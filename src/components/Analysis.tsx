import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney, getBoxValueClass, getMainValueClass } from '../utils';
import { useStore } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Sector } from 'recharts';
import { Filter, Download, PieChart as PieChartIcon, Wallet, TrendingUp, FileText } from 'lucide-react';
import ExportPdfModal from './ExportPdfModal';

export default function Analysis() {
  const { transactions, currency, accounts } = useStore();
  const [period, setPeriod] = useState('monthly');
  const [activeAccount, setActiveAccount] = useState<string>('all');
  const [activePieIndex, setActivePieIndex] = useState<number>(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Account'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category || ''}"`,
      `"${t.description || ''}"`,
      t.amount,
      `"${accounts?.find(a => a.id === t.account)?.name || 'Default'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `simzy-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6b7280'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => activeAccount === 'all' || (t.account || 'default') === activeAccount);
  }, [transactions, activeAccount]);

  const stats = useMemo(() => {
    // Basic filter logic (mocked for simplicity, in real app filter by period dates)
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    return { income, expense, net, count: filteredTransactions.length };
  }, [filteredTransactions, period]);

  const accountBalances = useMemo(() => {
    const balances: Record<string, { income: number; expense: number; net: number }> = {};
    
    // Initialize balances for all accounts
    if (activeAccount === 'all' && accounts) {
      accounts.forEach(acc => {
        balances[acc.id] = { income: 0, expense: 0, net: 0 };
      });
    } else if (activeAccount !== 'all') {
      balances[activeAccount] = { income: 0, expense: 0, net: 0 };
    }
    
    filteredTransactions.forEach(t => {
      const accId = t.account || 'default';
      if (!balances[accId]) {
        balances[accId] = { income: 0, expense: 0, net: 0 };
      }
      
      if (t.type === 'income') {
        balances[accId].income += t.amount;
      } else if (t.type === 'expense') {
        balances[accId].expense += t.amount;
      }
      balances[accId].net = balances[accId].income - balances[accId].expense;
    });
    
    return balances;
  }, [filteredTransactions, accounts, activeAccount]);

  const expenseBreakdown = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, period]);

  const barChartData = useMemo(() => {
    // Generate simple last 7 items or mocked dates
    // In a real scenario, this aggregates correctly by date
    const grouped: Record<string, { income: number, expense: number }> = {};
    const recentTx = [...filteredTransactions].reverse().slice(0, 50); // Get latest for display
    recentTx.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!grouped[dateKey]) grouped[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'income') grouped[dateKey].income += t.amount;
      else grouped[dateKey].expense += t.amount;
    });
    
    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-7); // Last 7 periods
  }, [transactions, period]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="font-extrabold text-xs sm:text-sm capitalize">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-black text-xs">
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 font-bold text-[10px]">
          {(percent * 100).toFixed(0)}%
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 13}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Top Green Banner Card - Identical in size, style & rounded edges to Dashboard & Cash Book */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1">Total Net Savings Balance</div>
            <div className={getMainValueClass(formatCurrency(totalBalance))}>{formatCurrency(totalBalance)}</div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
              <span className="truncate">Audit & Analytics Audit Register</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden w-full lg:w-auto">
            <div className="flex-1 lg:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Total Income</div>
              <div className={`text-emerald-200 ${getBoxValueClass('+' + formatCurrency(stats.income))}`}>+{formatCurrency(stats.income)}</div>
            </div>
            <div className="flex-1 lg:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Total Expenses</div>
              <div className={`text-red-200 ${getBoxValueClass('-' + formatCurrency(stats.expense))}`}>-{formatCurrency(stats.expense)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Audit Controls & Adjustments Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Filter className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">Audit Adjustments & Scope Controls</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setIsPdfModalOpen(true)} 
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <FileText size={16} /> Export Audit PDF
            </button>
            <button 
              onClick={handleExportCSV} 
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Adjustments Form Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          {/* Account Filter */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Account Scope
            </label>
            <select
              value={activeAccount}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          {/* Timeframe Interval */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Analysis Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`w-full py-1.5 px-2 text-xs font-bold rounded-lg capitalize transition-all text-center truncate ${
                    period === p 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Audited Entries Indicator */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Audited Records
            </label>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center h-[38px]">
              <span>Filtered Records</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md font-black">{stats.count}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-base sm:text-xl font-black text-emerald-600 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.income)}>{formatCurrency(stats.income)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">Income</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-base sm:text-xl font-black text-red-600 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.expense)}>{formatCurrency(stats.expense)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">Expenses</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-base sm:text-xl font-black text-emerald-800 dark:text-emerald-400 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.net)}>{formatCurrency(stats.net)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">Net Savings</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{stats.count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase truncate">Transactions</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <Wallet size={16} />
            </span>
            Account Balances
          </h3>
          <div className="space-y-3">
            {Object.entries(accountBalances).length > 0 ? (
              Object.entries(accountBalances).map(([accId, data]) => {
                const balancesData = data as { income: number; expense: number; net: number };
                const acc = accounts?.find(a => a.id === accId);
                const name = acc ? acc.name : 'Unknown Account';
                return (
                  <div key={accId} className="p-3 sm:p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col gap-2.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">{name}</div>
                    <div className="flex flex-col gap-1.5 w-full text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Income</span>
                        <span className="text-emerald-600 font-semibold max-w-[60%] truncate" title={'+' + formatCurrency(balancesData.income)}>+{formatCurrency(balancesData.income)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Expenses</span>
                        <span className="text-red-500 font-semibold max-w-[60%] truncate" title={'-' + formatCurrency(balancesData.expense)}>-{formatCurrency(balancesData.expense)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Net balance</span>
                        <span className={`font-bold max-w-[60%] truncate ${balancesData.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} title={(balancesData.net >= 0 ? '+' : '') + formatCurrency(balancesData.net)}>
                          {balancesData.net >= 0 ? '+' : ''}{formatCurrency(balancesData.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">No account data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 md:bg-emerald-100 md:dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PieChartIcon size={16} />
              </span>
              Expense Breakdown
            </h3>
            {expenseBreakdown.length > 0 && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
                {expenseBreakdown.length} Categories
              </span>
            )}
          </div>

          {expenseBreakdown.length > 0 ? (
            <div className="w-full">
              {/* Interactive Pie Chart with Zoom Segment */}
              <div className="h-64 sm:h-72 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onClick={(_, index) => setActivePieIndex(index)}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="transition-all duration-300 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Keys Legend Container - Fits cleanly inside column grid */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  Category Keys (Tap/Hover to Zoom Segment)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {expenseBreakdown.map((entry, i) => {
                    const isSelected = activePieIndex === i;
                    const color = COLORS[i % COLORS.length];
                    return (
                      <button
                        key={entry.name}
                        onClick={() => setActivePieIndex(i)}
                        onMouseEnter={() => setActivePieIndex(i)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-50 dark:bg-slate-700 border-emerald-500/80 shadow-sm scale-[1.02]' 
                            : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                          <span className="truncate text-slate-800 dark:text-slate-200 capitalize text-[11px] sm:text-xs">{entry.name}</span>
                        </div>
                        <span className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 flex-shrink-0">
                          {formatCurrency(entry.value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No expense data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
              Cash Flow Trend Audit
            </h2>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-3 py-1 rounded-full">
              Period Register
            </div>
          </div>
          {barChartData.length > 0 ? (
            <div className="w-full">
              <div style={{ width: '100%', height: 220 }} className="mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => formatCurrency(value)} width={80} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                      cursor={false}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Summary & Legend Badges with Corresponding Colors */}
              <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-1.5 sm:gap-3 items-center w-full">
                {/* Amount In Badge */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm min-w-0 text-center">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      In<span className="hidden sm:inline">come</span>:
                    </span>
                  </div>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] xs:text-xs sm:text-sm whitespace-nowrap">
                    +{formatCurrency(stats.income)}
                  </span>
                </div>

                {/* Amount Out Badge */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/60 shadow-sm min-w-0 text-center">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>
                    <span className="text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-300">
                      Out<span className="hidden sm:inline">go</span>:
                    </span>
                  </div>
                  <span className="font-black text-red-600 dark:text-red-400 text-[10px] xs:text-xs sm:text-sm whitespace-nowrap">
                    -{formatCurrency(stats.expense)}
                  </span>
                </div>

                {/* Net Flow Balance Badge */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-center shadow-sm min-w-0 ${
                  stats.net >= 0 
                    ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-red-100/80 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
                }`}>
                  <span className="text-[10px] sm:text-xs font-bold opacity-90 flex-shrink-0">
                    Net<span className="hidden sm:inline"> Flow</span>:
                  </span>
                  <span className="font-black text-[10px] xs:text-xs sm:text-sm whitespace-nowrap">
                    {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-8 text-slate-500 dark:text-slate-400">No trend data available</div>
          )}
        </div>
      </div>

      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultAccount={activeAccount}
        defaultPeriod={period}
      />
    </div>
  );
}
