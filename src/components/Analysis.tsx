import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Filter, Download, PieChart as PieChartIcon, Wallet } from 'lucide-react';

export default function Analysis() {
  const { transactions, currency, accounts } = useStore();
  const [period, setPeriod] = useState('monthly');

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency);
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6b7280'];

  const stats = useMemo(() => {
    // Basic filter logic (mocked for simplicity, in real app filter by period dates)
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    return { income, expense, net, count: transactions.length };
  }, [transactions, period]);

  const accountBalances = useMemo(() => {
    const balances: Record<string, { income: number; expense: number; net: number }> = {};
    
    // Initialize balances for all accounts
    if (accounts) {
      accounts.forEach(acc => {
        balances[acc.id] = { income: 0, expense: 0, net: 0 };
      });
    }
    
    transactions.forEach(t => {
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
  }, [transactions, accounts]);

  const expenseBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, period]);

  const barChartData = useMemo(() => {
    // Generate simple last 7 items or mocked dates
    // In a real scenario, this aggregates correctly by date
    const grouped: Record<string, { income: number, expense: number }> = {};
    const recentTx = [...transactions].reverse().slice(0, 50); // Get latest for display
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
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/20 flex items-center justify-center backdrop-blur-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xl font-bold text-emerald-600 mb-1">{formatCurrency(stats.income)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Income</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(stats.expense)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Expenses</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xl font-bold text-emerald-800 mb-1">{formatCurrency(stats.net)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Net Savings</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{stats.count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Transactions</div>
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
                  <div key={accId} className="p-3 border border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{name}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">+ {formatCurrency(balancesData.income)}</span>
                      <span className="text-red-500">- {formatCurrency(balancesData.expense)}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Net: {formatCurrency(balancesData.net)}</span>
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
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value}`} />
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
