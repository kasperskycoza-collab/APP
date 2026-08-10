import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney, getBoxValueClass, getMainValueClass } from '../utils';
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
  const [selectedBar, setSelectedBar] = useState<{ index: number; dataKey: 'income' | 'expense' } | null>(null);

  const renderZoomBarShape = (props: any, isSelected: boolean) => {
    const { fill, x, y, width, height, radius } = props;
    if (!width || !height || height <= 0) return null;

    const rx = Array.isArray(radius) ? radius[0] : (radius || 6);
    const scaleX = isSelected ? 1.18 : 1;
    const scaleY = isSelected ? 1.12 : 1;
    
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;
    const dx = (width - scaledWidth) / 2;
    const dy = height - scaledHeight;

    return (
      <rect
        x={x + dx}
        y={y + dy}
        width={scaledWidth}
        height={scaledHeight}
        fill={fill}
        rx={rx}
        ry={rx}
        className={`transition-all duration-300 ease-out cursor-pointer ${
          isSelected ? 'filter drop-shadow-lg brightness-110' : 'hover:opacity-95'
        }`}
        style={{
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    );
  };

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
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Top Total Balance & Today's Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0 max-w-full flex-1 shrink pr-0 lg:pr-2 overflow-hidden">
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1 truncate">Total Savings Balance</div>
            <div className={getMainValueClass(formatCurrency(totalBalance))} title={formatCurrency(totalBalance)}>{formatCurrency(totalBalance)}</div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
              <span className="truncate">Live Cash Book Register</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden w-full lg:w-auto shrink-0">
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Today's Income</div>
              <div className={`text-emerald-200 ${getBoxValueClass('+' + formatCurrency(todayIncome))}`} title={'+' + formatCurrency(todayIncome)}>+{formatCurrency(todayIncome)}</div>
            </div>
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">Today's Expenses</div>
              <div className={`text-red-200 ${getBoxValueClass('-' + formatCurrency(todayExpense))}`} title={'-' + formatCurrency(todayExpense)}>-{formatCurrency(todayExpense)}</div>
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
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="font-extrabold text-sm sm:text-base lg:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 min-w-0">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">Cash Flow Summary (This Month)</span>
            </h2>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
              Monthly Register
            </div>
          </div>
          
          <div style={{ width: '100%', height: 200 }} className="mb-4 select-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [-webkit-tap-highlight-color:transparent]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => formatCurrency(val)} width={70} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                  cursor={false}
                />
                <Bar 
                  dataKey="income" 
                  name="Income" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45} 
                  activeBar={false}
                  onClick={(_, index) => {
                    setSelectedBar(prev => (prev?.index === index && prev?.dataKey === 'income' ? null : { index, dataKey: 'income' }));
                  }}
                  shape={(props: any) => {
                    const isSelected = selectedBar?.index === props.index && selectedBar?.dataKey === 'income';
                    return renderZoomBarShape(props, isSelected);
                  }}
                />
                <Bar 
                  dataKey="expense" 
                  name="Expense" 
                  fill="#ef4444" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45} 
                  activeBar={false}
                  onClick={(_, index) => {
                    setSelectedBar(prev => (prev?.index === index && prev?.dataKey === 'expense' ? null : { index, dataKey: 'expense' }));
                  }}
                  shape={(props: any) => {
                    const isSelected = selectedBar?.index === props.index && selectedBar?.dataKey === 'expense';
                    return renderZoomBarShape(props, isSelected);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Summary & Legend Badges with Corresponding Colors */}
          <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-1.5 sm:gap-3 items-center w-full">
            {/* Amount In Badge */}
            <div className="flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm min-w-0 text-center">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  In<span className="hidden xl:inline">come</span>:
                </span>
              </div>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full">
                +{formatCurrency(monthlyIncome)}
              </span>
            </div>

            {/* Amount Out Badge */}
            <div className="flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/60 shadow-sm min-w-0 text-center">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-300">
                  Out<span className="hidden xl:inline">go</span>:
                </span>
              </div>
              <span className="font-black text-red-600 dark:text-red-400 text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full">
                -{formatCurrency(monthlyExpense)}
              </span>
            </div>

            {/* Net Flow Balance Badge */}
            <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border text-center shadow-sm min-w-0 ${
              (monthlyIncome - monthlyExpense) >= 0 
                ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-red-100/80 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
            }`}>
              <span className="text-[10px] sm:text-xs font-bold opacity-90 flex-shrink-0">
                Net<span className="hidden xl:inline"> Flow</span>:
              </span>
              <span className="font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full">
                {(monthlyIncome - monthlyExpense) >= 0 ? '+' : ''}{formatCurrency(monthlyIncome - monthlyExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* Goals Progress Card Pane */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-800 md:bg-emerald-50/70 md:dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 md:border-emerald-200/80 md:dark:border-slate-700 shadow-sm flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 min-w-0">
                <Target size={20} className="text-amber-500 md:text-emerald-600 md:dark:text-emerald-400 flex-shrink-0" />
                <span className="truncate">Overall Goals Progress</span>
              </h2>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full flex-shrink-0">
                {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
              </span>
            </div>

            {/* Saved & Target Stat Row Cards - Two Stacked Bar Cards (Saved Amount on top of Target Goal) */}
            <div className="flex flex-col gap-2.5 sm:gap-3 mb-4 min-w-0">
              {/* Saved Box - Stacked Label on Top of Amount */}
              <div className="bg-slate-50 dark:bg-slate-900/60 md:bg-white/90 md:dark:bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 md:border-emerald-200/60 flex flex-col justify-between min-w-0 gap-1">
                <div className="text-[11px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Saved Amount
                </div>
                <div 
                  className="font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-snug break-words"
                  title={formatCurrency(totalGoalCurrent)}
                >
                  {formatCurrency(totalGoalCurrent)}
                </div>
              </div>

              {/* Target Box - Stacked Label on Top of Amount */}
              <div className="bg-slate-50 dark:bg-slate-900/60 md:bg-white/90 md:dark:bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 md:border-emerald-200/60 flex flex-col justify-between min-w-0 gap-1">
                <div className="text-[11px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  Target Goal
                </div>
                <div 
                  className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-snug break-words"
                  title={formatCurrency(totalGoalTarget)}
                >
                  {formatCurrency(totalGoalTarget)}
                </div>
              </div>
            </div>

            {/* Progress Bar & Completion Details */}
            <div className="bg-slate-50 dark:bg-slate-900/40 md:bg-white/60 md:dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 space-y-2.5 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold gap-2">
                <span className="text-slate-600 dark:text-slate-300 truncate">Completion Rate</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black flex-shrink-0">
                  {Math.round(monthlySavingsProgress)}%
                </span>
              </div>

              <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 md:bg-emerald-200/50 md:dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/20 md:border-emerald-200/40">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 rounded-full" 
                  style={{ width: `${Math.min(monthlySavingsProgress, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-0.5 min-w-0">
                <span>Remaining:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-visible ml-1" title={formatCurrency(Math.max(0, totalGoalTarget - totalGoalCurrent))}>
                  {formatCurrency(Math.max(0, totalGoalTarget - totalGoalCurrent))}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsAddGoalOpen(true)}
            className="w-full mt-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
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
