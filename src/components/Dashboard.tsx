import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { ArrowDown, ArrowUp, Target, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import AddTransactionModal from './AddTransactionModal';
import AddGoalModal from './AddGoalModal';
import TransferModal from './TransferModal';
import EditTransactionModal from './EditTransactionModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import { Transaction } from '../types';

export default function Dashboard() {
  const { accounts, transactions, goals, currency, deleteTransaction } = useStore();
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = () => {
    if (deletingTransactionId !== null) {
      deleteTransaction(deletingTransactionId);
      setDeletingTransactionId(null);
    }
  };

  const transactionNetBalances = useMemo(() => {
    // Sort all transactions chronologically (oldest to newest) to compute historical running balance correctly
    const sortedAll = [...transactions].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id; // tie breaker
    });

    const txSums: Record<string, number> = {};
    sortedAll.forEach(tx => {
      const accId = tx.account || 'default';
      txSums[accId] = (txSums[accId] || 0) + (tx.type === 'income' ? tx.amount : -tx.amount);
    });

    const initialBalances: Record<string, number> = {};
    accounts.forEach(acc => {
      initialBalances[acc.id] = acc.balance - (txSums[acc.id] || 0);
    });

    const runningBalances: Record<string, number> = {};
    const currentRunning: Record<string, number> = { ...initialBalances };

    sortedAll.forEach(tx => {
      const accId = tx.account || 'default';
      if (currentRunning[accId] === undefined) {
        currentRunning[accId] = 0;
      }
      currentRunning[accId] += tx.type === 'income' ? tx.amount : -tx.amount;
      runningBalances[tx.id] = currentRunning[accId];
    });

    return runningBalances;
  }, [transactions, accounts]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

  const currentMonthTransactions = useMemo(() => {
    const d = new Date();
    const month = d.getMonth();
    const year = d.getFullYear();
    return transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year;
    });
  }, [transactions]);

  const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const chartData = [
    { name: 'Month', income: monthlyIncome, expense: monthlyExpense }
  ];

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
  const monthlySavingsProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

  return (
    <div className="pb-24 md:pb-8 space-y-6">
      {/* Top Total Balance & Today's Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1">Total Savings Balance</div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight break-words">{formatCurrency(totalBalance)}</div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
              Live Cash Book Register
            </div>
          </div>
          
          <div className="flex gap-3 sm:gap-4 overflow-hidden w-full md:w-auto">
            <div className="flex-1 md:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-0">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Today's Income</div>
              <div className="text-lg sm:text-xl font-black text-emerald-200 break-words">+{formatCurrency(todayIncome)}</div>
            </div>
            <div className="flex-1 md:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-0">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Today's Expenses</div>
              <div className="text-lg sm:text-xl font-black text-red-200 break-words">-{formatCurrency(todayExpense)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <button 
          onClick={() => { setTransactionType('income'); setIsAddTransactionOpen(true); }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-emerald-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <ArrowDown size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Add Income</span>
        </button>

        <button 
          onClick={() => { setTransactionType('expense'); setIsAddTransactionOpen(true); }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-red-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
            <ArrowUp size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Add Expense</span>
        </button>

        <button 
          onClick={() => setIsAddGoalOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-amber-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">New Goal</span>
        </button>

        <button 
          onClick={() => setIsTransferOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-blue-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <ArrowRightLeft size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Transfer</span>
        </button>
      </div>

      {/* Main Grid Section: Chart & Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Chart Pane */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
              Cash Flow Summary (This Month)
            </h2>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 md:bg-emerald-100/80 md:dark:bg-slate-700 text-slate-700 dark:text-slate-300 md:text-emerald-900 md:dark:text-emerald-200">
              In: {formatCurrency(monthlyIncome)} | Out: {formatCurrency(monthlyExpense)}
            </div>
          </div>
          
          <div style={{ width: '100%', height: 200 }} className="mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => formatCurrency(val)} width={80} />
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
        </div>

        {/* Goals Progress Card Pane */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-4">
              <Target size={20} className="text-amber-500 md:text-emerald-600 md:dark:text-emerald-400" />
              Overall Goals Progress
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 md:bg-white/80 md:dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 md:border-emerald-200/60">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  <span>Saved</span>
                  <span>Target</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-800 dark:text-slate-100">
                  <span>{formatCurrency(totalGoalCurrent)}</span>
                  <span>{formatCurrency(totalGoalTarget)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Completion Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.round(monthlySavingsProgress)}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-900 md:bg-emerald-200/50 md:dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/20 md:border-emerald-200/40">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" 
                    style={{ width: `${Math.min(monthlySavingsProgress, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsAddGoalOpen(true)}
            className="w-full mt-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 md:bg-emerald-600 md:hover:bg-emerald-700 text-emerald-700 dark:text-emerald-400 md:text-white font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors border border-emerald-200/50 dark:border-emerald-800/50 md:border-transparent flex items-center justify-center gap-2"
          >
            + Create New Savings Goal
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100">Recent Transactions</h2>
          <span className="text-xs text-slate-400 font-semibold">Latest 5 Entries</span>
        </div>
        
        <div className="space-y-2.5">
          {transactions.slice(0, 5).map(t => {
            const netBal = transactionNetBalances[t.id] ?? 0;
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedTransaction(t)}
                className="bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-500/50 dark:hover:border-slate-500 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                  {t.type === 'income' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{t.description}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="capitalize font-medium">{t.category}</span>
                    <span>•</span>
                    <span>{new Date(t.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <div className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                    Running Bal: {formatCurrency(netBal)}
                  </div>
                </div>
              </div>
            );
          })}
          {transactions.slice(0, 5).length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">No transactions recorded yet.</div>
          )}
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isAddTransactionOpen} 
        onClose={() => setIsAddTransactionOpen(false)} 
        initialType={transactionType} 
      />
      <AddGoalModal 
        isOpen={isAddGoalOpen} 
        onClose={() => setIsAddGoalOpen(false)} 
      />
      <TransferModal 
        isOpen={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)} 
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <ConfirmDeleteModal
        isOpen={deletingTransactionId !== null}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={confirmDelete}
      />

      <TransactionDetailsModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        netBalance={selectedTransaction ? (transactionNetBalances[selectedTransaction.id] ?? 0) : 0}
        currency={currency}
        accounts={accounts}
        goals={goals}
        onEdit={(tx) => { setSelectedTransaction(null); setEditingTransaction(tx); }}
        onDelete={(id) => { setSelectedTransaction(null); handleDelete(id); }}
      />
    </div>
  );
}
