import { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Target, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AddTransactionModal from './AddTransactionModal';
import AddGoalModal from './AddGoalModal';
import TransferModal from './TransferModal';

export default function Dashboard() {
  const { accounts, transactions, goals, currency } = useStore();
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
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
    { name: 'Income', amount: monthlyIncome, color: '#10b981' },
    { name: 'Expense', amount: monthlyExpense, color: '#ef4444' }
  ];

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
  const monthlySavingsProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-b-2xl shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div className="text-xl font-bold">Simzy</div>
        </div>
        
        <div className="bg-white dark:bg-slate-800/15 backdrop-blur-md rounded-2xl p-5 text-center border border-white/20">
          <div className="text-xs uppercase tracking-wide opacity-90 mb-2">Total Savings Balance</div>
          <div className="text-4xl font-extrabold mb-4">{formatCurrency(totalBalance)}</div>
          
          <div className="flex justify-between gap-3">
            <div className="flex-1 bg-white dark:bg-slate-800/10 rounded-xl p-3">
              <div className="text-xs opacity-80 mb-1">Today's Income</div>
              <div className="text-lg font-bold text-emerald-300">+{formatCurrency(todayIncome)}</div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800/10 rounded-xl p-3">
              <div className="text-xs opacity-80 mb-1">Today's Expenses</div>
              <div className="text-lg font-bold text-red-300">-{formatCurrency(todayExpense)}</div>
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
          
          <div className="h-32 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" opacity={0.5} tickFormatter={(val) => val.toLocaleString()} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
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
        <h2 className="text-lg font-bold mb-3">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.slice(0, 5).map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
                {t.type === 'income' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.description}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
              </div>
              <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-5 text-slate-500 dark:text-slate-400">No transactions yet.</div>
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
    </div>
  );
}
