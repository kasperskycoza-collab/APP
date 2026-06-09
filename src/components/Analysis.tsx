import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Filter, Download, PieChart as PieChartIcon, Wallet } from 'lucide-react';

export default function Analysis() {
  const { transactions, currency, accounts } = useStore();
  const [period, setPeriod] = useState('monthly');
  const [activeAccount, setActiveAccount] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

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

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold flex items-center gap-2">Audit & Analysis</div>
          <button className="w-10 h-10 rounded-full bg-black/10 dark:bg-slate-800/20 flex items-center justify-center backdrop-blur-sm text-white">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none custom-scrollbar">
          <button
            onClick={() => setActiveAccount('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeAccount === 'all' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Accounts
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setActiveAccount(acc.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeAccount === acc.id 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none custom-scrollbar">
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-colors border ${
                period === p 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-500' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-sm sm:text-base font-bold text-emerald-600 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.income)}>{formatCurrency(stats.income)}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase truncate">Income</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-sm sm:text-base font-bold text-red-600 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.expense)}>{formatCurrency(stats.expense)}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase truncate">Expenses</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-sm sm:text-base font-bold text-emerald-800 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(stats.net)}>{formatCurrency(stats.net)}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase truncate">Net Savings</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center min-w-0">
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{stats.count}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase truncate">Transactions</div>
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

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <PieChartIcon size={16} />
            </span>
            Expense Breakdown
          </h3>
          {expenseBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : null}
                    labelLine={false}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {expenseBreakdown.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 capitalize">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No expense data available</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Filter size={16} />
            </span>
            Cash Flow Trend
          </h3>
          {barChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => formatCurrency(value)} width={80} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="text-center py-8 text-slate-500 dark:text-slate-400">No trend data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
