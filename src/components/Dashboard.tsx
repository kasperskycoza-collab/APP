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
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-b-2xl shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-6 mt-1">
          <div className="text-2xl font-extrabold tracking-tight">Simzy Cash Saver</div>
        </div>
        
        <div className="bg-white/10 dark:bg-slate-800/15 backdrop-blur-md rounded-2xl p-5 text-center border border-white/20">
          <div className="text-xs uppercase tracking-wide opacity-90 mb-2">Total Savings Balance</div>
          <div className="text-2xl sm:text-3xl font-extrabold mb-4 break-words">{formatCurrency(totalBalance)}</div>
          
          <div className="flex justify-between gap-3 overflow-hidden">
            <div className="flex-1 bg-white/10 dark:bg-slate-800/10 rounded-xl p-3 min-w-0">
              <div className="text-xs opacity-80 mb-1 truncate">Today's Income</div>
              <div className="text-base sm:text-lg font-bold text-emerald-100 break-words">+{formatCurrency(todayIncome)}</div>
            </div>
            <div className="flex-1 bg-white/10 dark:bg-slate-800/10 rounded-xl p-3 min-w-0">
              <div className="text-xs opacity-80 mb-1 truncate">Today's Expenses</div>
              <div className="text-base sm:text-lg font-bold text-red-100 break-words">-{formatCurrency(todayExpense)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5">
        <button 
          onClick={() => { setTransactionType('income'); setIsAddTransactionOpen(true); }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2 transition-transform active:scale-95 hover:border-emerald-200"
        >
          <ArrowDown className="text-emerald-500" size={24} />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Add Income</span>
        </button>
        <button 
          onClick={() => { setTransactionType('expense'); setIsAddTransactionOpen(true); }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2 transition-transform active:scale-95 hover:border-red-200"
        >
          <ArrowUp className="text-red-500" size={24} />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Add Expense</span>
        </button>
        <button 
          onClick={() => setIsAddGoalOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2 transition-transform active:scale-95 hover:border-amber-200"
        >
          <Target className="text-amber-500" size={24} />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">New Goal</span>
        </button>
        <button 
          onClick={() => setIsTransferOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2 transition-transform active:scale-95 hover:border-blue-200"
        >
          <ArrowRightLeft className="text-blue-500" size={24} />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Transfer</span>
        </button>
      </div>

      <div className="px-5 mb-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-4">
            <TrendingUp size={18} className="text-blue-500" /> This Month
          </h2>
          
          <div style={{ width: '100%', height: 130 }} className="mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => formatCurrency(val)} width={80} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="font-semibold text-slate-600 dark:text-slate-300">Overall Goals Progress</span>
               <span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(monthlySavingsProgress)}%</span>
             </div>
             <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-emerald-500 transition-all duration-1000" 
                 style={{ width: `${Math.min(monthlySavingsProgress, 100)}%` }}
               ></div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-100">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.slice(0, 5).map(t => {
            const netBal = transactionNetBalances[t.id] ?? 0;
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedTransaction(t)}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-500/30 dark:hover:border-slate-600 transition-all hover:shadow active:scale-[99.5%] active:bg-slate-50/50 dark:active:bg-slate-800/80"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
                  {t.type === 'income' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.description}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Bal: {formatCurrency(netBal)}
                  </div>
                </div>
              </div>
            );
          })}
          {transactions.slice(0, 5).length === 0 && (
            <div className="text-center py-5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">No transactions yet.</div>
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
