import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney, getBoxValueClass, getMainValueClass } from '../utils';
import { ArrowDown, ArrowUp, Target, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AddTransactionModal from './AddTransactionModal';
import AddGoalModal from './AddGoalModal';
import TransferModal from './TransferModal';
import EditTransactionModal from './EditTransactionModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import { Transaction } from '../types';

export default function Dashboard() {
  const { accounts, transactions, goals, currency, deleteTransaction, themePalette, darkMode } = useStore();
  const { t, language, getCategoryName } = useTranslation();
  
  const isUbuntu = themePalette === 'ubuntu';
  const isDark = darkMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const incomeBarColor = isUbuntu ? '#E95420' : '#10b981';
  const expenseBarColor = isUbuntu ? '#77216F' : '#ef4444';
  const gridStroke = isDark ? (isUbuntu ? '#666666' : '#475569') : (isUbuntu ? '#D5D0C7' : '#e2e8f0');
  const axisTextColor = isDark ? '#EBEBEB' : (isUbuntu ? '#2D2D2D' : '#64748b');
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<{ index: number; dataKey: 'income' | 'expense' } | null>(null);
  const [chartView, setChartView] = useState<'weeks' | 'months'>('weeks');

  const renderZoomBarShape = (props: any, isSelected: boolean) => {
    const { fill, x, y, width, height, radius, value } = props;
    if (!width || width <= 0 || !value || value <= 0) return null;

    const rx = Array.isArray(radius) ? radius[0] : (radius || 6);
    const scaleX = isSelected ? 1.18 : 1;
    const scaleY = isSelected ? 1.12 : 1;
    
    const barHeight = Math.max(height || 0, 4);
    const scaledWidth = width * scaleX;
    const scaledHeight = barHeight * scaleY;
    const dx = (width - scaledWidth) / 2;
    const dy = barHeight - scaledHeight;
    const barY = y + (height - barHeight);

    const resolvedFill = fill || (props.dataKey === 'income' ? incomeBarColor : expenseBarColor);

    return (
      <rect
        x={x + dx}
        y={barY + dy}
        width={scaledWidth}
        height={scaledHeight}
        fill={resolvedFill}
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
    const sortedAll = [...transactions].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id;
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
  
  const chartData = useMemo(() => {
    if (chartView === 'weeks') {
      const prefix = language === 'sw' ? 'Wk' : 'W';
      const weeks = [
        { name: `${prefix}1 (1-7)`, weekStart: 1, weekEnd: 7, income: 0, expense: 0 },
        { name: `${prefix}2 (8-14)`, weekStart: 8, weekEnd: 14, income: 0, expense: 0 },
        { name: `${prefix}3 (15-21)`, weekStart: 15, weekEnd: 21, income: 0, expense: 0 },
        { name: `${prefix}4 (22-28)`, weekStart: 22, weekEnd: 28, income: 0, expense: 0 },
        { name: `${prefix}5 (29+)`, weekStart: 29, weekEnd: 31, income: 0, expense: 0 },
      ];
      currentMonthTransactions.forEach(t => {
        const day = new Date(t.date).getDate();
        const bucket = weeks.find(w => day >= w.weekStart && day <= w.weekEnd);
        if (bucket) {
          if (t.type === 'income') bucket.income += t.amount;
          else bucket.expense += t.amount;
        }
      });
      return weeks;
    } else {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const label = d.toLocaleString(language === 'sw' ? 'sw' : 'en-US', { month: 'short' });
        const txs = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y;
        });
        const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        months.push({ name: label, income: inc, expense: exp });
      }
      return months;
    }
  }, [currentMonthTransactions, transactions, chartView, language]);

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
  const monthlySavingsProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

  const maxYValue = useMemo(() => {
    return chartData.reduce((max, d) => Math.max(max, d.income, d.expense), 0);
  }, [chartData]);

  const yAxisWidth = useMemo(() => {
    const sampleFormatted = formatCurrency(maxYValue > 0 ? maxYValue : 100000);
    const len = sampleFormatted.length;
    return Math.max(78, Math.min(125, len * 7.5 + 18));
  }, [maxYValue, currency]);

  const CompactTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/80 rounded-xl p-2 px-2.5 shadow-xl text-[11px] backdrop-blur-md pointer-events-none select-none z-50 min-w-[125px]">
          {label && <p className="font-bold text-[10px] text-slate-400 mb-1 tracking-wide uppercase">{label}</p>}
          {payload.map((entry: any, index: number) => {
            const entryName = entry.dataKey === 'income' ? t('income') : t('expense');
            return (
              <div key={`dash-item-${index}`} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span>{entryName}:</span>
                </span>
                <span className="font-extrabold text-white whitespace-nowrap">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Top Total Balance & Today's Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0 max-w-full flex-1 shrink pr-0 lg:pr-2 overflow-hidden">
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1 truncate">
              {t('totalBalance')}
            </div>
            <div className={getMainValueClass(formatCurrency(totalBalance))} title={formatCurrency(totalBalance)}>
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
              <span className="truncate">{language === 'sw' ? 'Daftari la Fedha Moja kwa Moja' : 'Live Cash Book Register'}</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden w-full lg:w-auto shrink-0">
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/20 dark:bg-black/35 backdrop-blur-md rounded-2xl p-3 md:p-4 border-2 border-white/40 dark:border-white/30 min-w-0 flex flex-col justify-center shadow-lg">
              <div className="text-xs text-white/90 dark:text-emerald-200 mb-1 font-extrabold uppercase tracking-wide truncate">{t('todayIncome')}</div>
              <div className={`text-emerald-100 dark:text-emerald-300 font-black ${getBoxValueClass('+' + formatCurrency(todayIncome))}`} title={'+' + formatCurrency(todayIncome)}>
                +{formatCurrency(todayIncome)}
              </div>
            </div>
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/20 dark:bg-black/35 backdrop-blur-md rounded-2xl p-3 md:p-4 border-2 border-white/40 dark:border-white/30 min-w-0 flex flex-col justify-center shadow-lg">
              <div className="text-xs text-white/90 dark:text-red-200 mb-1 font-extrabold uppercase tracking-wide truncate">{t('todayExpense')}</div>
              <div className={`text-red-100 dark:text-red-300 font-black ${getBoxValueClass('-' + formatCurrency(todayExpense))}`} title={'-' + formatCurrency(todayExpense)}>
                -{formatCurrency(todayExpense)}
              </div>
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
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {language === 'sw' ? 'Weka Mapato' : 'Add Income'}
          </span>
        </button>

        <button 
          onClick={() => { setTransactionType('expense'); setIsAddTransactionOpen(true); }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-red-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
            <ArrowUp size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {language === 'sw' ? 'Weka Matumizi' : 'Add Expense'}
          </span>
        </button>

        <button 
          onClick={() => setIsAddGoalOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-amber-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {t('addGoal')}
          </span>
        </button>

        <button 
          onClick={() => setIsTransferOpen(true)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-2.5 transition-all hover:border-blue-500 hover:shadow-md active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <ArrowRightLeft size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {t('transfer')}
          </span>
        </button>
      </div>

      {/* Main Grid Section: Chart & Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Chart Pane */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="font-extrabold text-sm sm:text-base lg:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 min-w-0">
              <TrendingUp size={18} className={isUbuntu ? "text-[#E95420] flex-shrink-0" : "text-emerald-600 dark:text-emerald-400 flex-shrink-0"} />
              <span className="truncate">{t('cashFlowTrends')}</span>
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setChartView('weeks')}
                className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all ${
                  chartView === 'weeks'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {language === 'sw' ? 'Kila Wiki' : 'Weekly'}
              </button>
              <button
                type="button"
                onClick={() => setChartView('months')}
                className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all ${
                  chartView === 'months'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {language === 'sw' ? 'Miezi 6' : '6 Months'}
              </button>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 200 }} className="mb-4 select-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [-webkit-tap-highlight-color:transparent]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 12, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: axisTextColor }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: axisTextColor }} 
                  tickFormatter={(val) => formatCurrency(val)} 
                  width={yAxisWidth} 
                />
                <Tooltip 
                  content={<CompactTooltip />}
                  cursor={false}
                />
                <Bar 
                  dataKey="income" 
                  name={t('income')} 
                  fill={incomeBarColor} 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45} 
                  minPointSize={4}
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
                  name={t('expense')} 
                  fill={expenseBarColor} 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45} 
                  minPointSize={4}
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

          {/* Bottom Summary & Legend Badges */}
          <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-1.5 sm:gap-3 items-center w-full">
            {/* Amount In Badge */}
            <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border shadow-sm min-w-0 text-center ${
              isUbuntu 
                ? 'bg-[#FFF2EB] dark:bg-[rgba(233,84,32,0.16)] border-[#FCD2C2] dark:border-[rgba(233,84,32,0.5)]'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60'
            }`}>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500'}`}></span>
                <span className={`text-[10px] sm:text-xs font-bold ${isUbuntu ? 'text-[#2D2D2D] dark:text-white' : 'text-emerald-800 dark:text-emerald-300'}`}>
                  {t('inflow')}:
                </span>
              </div>
              <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                +{formatCurrency(monthlyIncome)}
              </span>
            </div>

            {/* Amount Out Badge */}
            <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border shadow-sm min-w-0 text-center ${
              isUbuntu 
                ? 'bg-[#FDF0F7] dark:bg-[rgba(119,33,111,0.25)] border-[#F3CFEA] dark:border-[rgba(119,33,111,0.6)]'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60'
            }`}>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isUbuntu ? 'bg-[#77216F]' : 'bg-red-500'}`}></span>
                <span className={`text-[10px] sm:text-xs font-bold ${isUbuntu ? 'text-[#2D2D2D] dark:text-white' : 'text-red-800 dark:text-red-300'}`}>
                  {t('outflow')}:
                </span>
              </div>
              <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${isUbuntu ? 'text-[#77216F]' : 'text-red-600 dark:text-red-400'}`}>
                -{formatCurrency(monthlyExpense)}
              </span>
            </div>

            {/* Net Flow Balance Badge */}
            <div className={`flex flex-col xl:flex-row items-center justify-center gap-0.5 xl:gap-1.5 px-1 py-2 sm:px-2.5 sm:py-2.5 rounded-xl border text-center shadow-sm min-w-0 ${
              isUbuntu
                ? (monthlyIncome - monthlyExpense >= 0 
                    ? 'bg-[#FFF2EB] dark:bg-[rgba(233,84,32,0.16)] border-[#FCD2C2] dark:border-[rgba(233,84,32,0.5)] text-[#2D2D2D] dark:text-white' 
                    : 'bg-[#FDF0F7] dark:bg-[rgba(119,33,111,0.25)] border-[#F3CFEA] dark:border-[rgba(119,33,111,0.6)] text-[#2D2D2D] dark:text-white')
                : ((monthlyIncome - monthlyExpense) >= 0 
                    ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-red-100/80 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200')
            }`}>
              <span className="text-[10px] sm:text-xs font-bold opacity-90 flex-shrink-0">
                {t('net')}:
              </span>
              <span className={`font-black text-[10px] sm:text-xs xl:text-sm whitespace-nowrap truncate max-w-full ${
                isUbuntu ? (monthlyIncome - monthlyExpense >= 0 ? 'text-[#E95420]' : 'text-[#77216F]') : ''
              }`}>
                {(monthlyIncome - monthlyExpense) >= 0 ? '+' : ''}{formatCurrency(monthlyIncome - monthlyExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* Goals Progress Card Pane */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100 min-w-0">
                <Target size={20} className={isUbuntu ? "text-[#E95420] flex-shrink-0" : "text-amber-500 flex-shrink-0"} />
                <span className="truncate">{t('savingsProgress')}</span>
              </h2>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full flex-shrink-0">
                {goals.length} {language === 'sw' ? 'Malengo' : (goals.length === 1 ? 'Goal' : 'Goals')}
              </span>
            </div>

            {/* Saved & Target Stat Row Cards */}
            <div className="flex flex-col gap-2.5 sm:gap-3 mb-4 min-w-0">
              {/* Saved Box */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between min-w-0 gap-1">
                <div className="text-[11px] sm:text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">
                  {t('currentSaved')}
                </div>
                <div 
                  className={`font-black text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-snug break-words ${
                    isUbuntu ? 'text-[#E95420] dark:text-[#FF7A45]' : 'text-amber-600 dark:text-amber-400'
                  }`}
                  title={formatCurrency(totalGoalCurrent)}
                >
                  {formatCurrency(totalGoalCurrent)}
                </div>
              </div>

              {/* Target Box */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between min-w-0 gap-1">
                <div className="text-[11px] sm:text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">
                  {t('targetAmount')}
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
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 space-y-2.5 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold gap-2">
                <span className="text-slate-700 dark:text-slate-300 truncate">{t('targetProgress')}</span>
                <span className={`font-black flex-shrink-0 ${
                  isUbuntu ? 'text-[#E95420] dark:text-[#FF7A45]' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {Math.round(monthlySavingsProgress)}%
                </span>
              </div>

              <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    isUbuntu 
                      ? 'bg-gradient-to-r from-[#E95420] to-[#FF7A45]' 
                      : 'bg-gradient-to-r from-amber-400 to-amber-600'
                  }`}
                  style={{ width: `${Math.min(monthlySavingsProgress, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-0.5 min-w-0">
                <span>{t('goalRemaining')}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-visible ml-1" title={formatCurrency(Math.max(0, totalGoalTarget - totalGoalCurrent))}>
                  {formatCurrency(Math.max(0, totalGoalTarget - totalGoalCurrent))}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsAddGoalOpen(true)}
            className={`w-full mt-5 py-2.5 sm:py-3 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 btn-add-saving-goal ${
              isUbuntu 
                ? 'bg-[#EBEBEB] text-[#2D2D2D] hover:bg-white border border-[#D5D0C7] dark:bg-[#EBEBEB] dark:text-[#2D2D2D] dark:hover:bg-white dark:border-[#EBEBEB]' 
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            + {t('createGoal')}
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
        <div className="flex justify-between items-center gap-2 mb-4">
          <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate">
            {t('recentTransactions')}
          </h2>
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">
            {language === 'sw' ? 'Miamala 5 ya Mwisho' : 'Latest 5 Entries'}
          </span>
        </div>
        
        <div className="space-y-2.5 min-w-0">
          {transactions.slice(0, 5).map(tItem => {
            const isIncome = tItem.type === 'income';
            const netBal = transactionNetBalances[tItem.id] ?? 0;
            return (
              <div 
                key={tItem.id} 
                onClick={() => setSelectedTransaction(tItem)}
                className="transaction-card-interactive bg-slate-50/70 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors min-w-0"
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isIncome 
                      ? (isUbuntu ? 'bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420]' : 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400') 
                      : (isUbuntu ? 'bg-[#FDF0F7] dark:bg-[#383838] text-[#77216F]' : 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400')
                  }`}>
                    {isIncome ? <ArrowDown size={18} className="sm:w-5 sm:h-5" /> : <ArrowUp size={18} className="sm:w-5 sm:h-5" />}
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate" title={tItem.description}>
                      {tItem.description}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5 min-w-0">
                      <span className="capitalize font-medium truncate max-w-[100px] sm:max-w-[160px]">{getCategoryName(tItem.category)}</span>
                      <span className="opacity-40">•</span>
                      <span className="whitespace-nowrap">{new Date(tItem.date).toLocaleDateString(language === 'sw' ? 'sw' : 'en-US')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0 text-right ml-1">
                  <div className={`font-black text-xs sm:text-sm md:text-base whitespace-nowrap ${
                    isIncome 
                      ? (isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400') 
                      : (isUbuntu ? 'text-[#77216F]' : 'text-red-600 dark:text-red-400')
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tItem.amount)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                    <span className="opacity-80">{language === 'sw' ? 'Salio' : 'Bal'}:</span> {formatCurrency(netBal)}
                  </div>
                </div>
              </div>
            );
          })}
          {transactions.slice(0, 5).length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
              {t('noRecentTransactions')}
            </div>
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
