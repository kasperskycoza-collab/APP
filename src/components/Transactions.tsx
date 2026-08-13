import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney, getBoxValueClass, getMainValueClass } from '../utils';
import { ArrowDown, ArrowUp, Plus, Search, Filter, Trash2, Edit2, Target, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import AddTransactionModal from './AddTransactionModal';
import EditTransactionModal from './EditTransactionModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import { Transaction } from '../types';

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
type ViewMode = 'grouped' | 'list' | 'details';
type TimeGroup = 'daily' | 'month' | 'week' | 'year';

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
};

const getPeriodKey = (dateString: string, groupBy: TimeGroup, isSwahili: boolean) => {
  const d = new Date(dateString);
  if (groupBy === 'daily') {
    return d.toLocaleDateString(isSwahili ? 'sw' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (groupBy === 'year') {
    return d.getFullYear().toString();
  }
  if (groupBy === 'week') {
    return (isSwahili ? 'Wk ' : 'W ') + getWeekNumber(d);
  }
  return d.toLocaleDateString(isSwahili ? 'sw' : 'en-US', { month: 'short', year: 'numeric' });
};

export default function Transactions() {
  const { transactions, currency, deleteTransaction, accounts, goals, themePalette } = useStore();
  const { t, language, getCategoryName, getMethodName } = useTranslation();
  
  const isUbuntu = themePalette === 'ubuntu';
  const isSwahili = language === 'sw';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [timeGroup, setTimeGroup] = useState<TimeGroup>('month');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency);
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => 
        t.description.toLowerCase().includes(search.toLowerCase()) || 
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        getCategoryName(t.category).toLowerCase().includes(search.toLowerCase())
      );

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, filterType, search, sortBy, getCategoryName]);

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const accountId = tx.account || 'default';
      const period = getPeriodKey(tx.date, timeGroup, isSwahili);
      
      if (!acc[accountId]) {
        acc[accountId] = {};
      }
      if (!acc[accountId][period]) {
        acc[accountId][period] = [];
      }
      acc[accountId][period].push(tx);
      return acc;
    }, {} as Record<string, Record<string, Transaction[]>>);
  }, [filteredTransactions, timeGroup, isSwahili]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') inflow += t.amount;
      else outflow += t.amount;
    });
    return { totalInflow: inflow, totalOutflow: outflow };
  }, [filteredTransactions]);

  const handleDelete = (id: number) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = () => {
    if (deletingTransactionId !== null) {
      deleteTransaction(deletingTransactionId);
      setDeletingTransactionId(null);
    }
  };

  const renderTransactionCard = (txItem: Transaction, showAccount: boolean = false) => {
    const isIncome = txItem.type === 'income';
    const netBal = transactionNetBalances[txItem.id] ?? 0;
    return (
      <div 
        key={txItem.id} 
        onClick={() => setSelectedTransaction(txItem)}
        className="transaction-card-interactive bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1.5 group cursor-pointer active:scale-[99.5%]"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isIncome 
              ? (isUbuntu ? 'bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420]' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600') 
              : (isUbuntu ? 'bg-[#FDF0F7] dark:bg-[#383838] text-[#77216F]' : 'bg-red-50 dark:bg-red-900/30 text-red-600')
          }`}>
            {isIncome ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{txItem.description}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="capitalize font-medium">{getCategoryName(txItem.category)}</span>
              <span>•</span>
              <span>{new Date(txItem.date).toLocaleDateString(isSwahili ? 'sw' : 'en-US')}</span>
              {viewMode === 'details' && (
                <>
                  <span>•</span>
                  <span className="capitalize px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                    {getMethodName(txItem.method)}
                  </span>
                </>
              )}
              {txItem.goalId && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1 py-0.5 rounded font-medium">
                    <Target size={10} /> {t('goal')}
                  </span>
                </>
              )}
              {txItem.recurring && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-1 py-0.5 rounded font-medium capitalize">
                    <RefreshCw size={10} /> {txItem.frequency}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
            <div className={`font-bold text-sm whitespace-nowrap ${
              isIncome 
                ? (isUbuntu ? 'text-[#E95420]' : 'text-emerald-600') 
                : (isUbuntu ? 'text-[#77216F]' : 'text-red-600')
            }`}>
              {isIncome ? '+' : '-'}{formatCurrency(txItem.amount)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
              {isSwahili ? 'Salio' : 'Bal'}: {formatCurrency(netBal)}
            </div>
            <div className="flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingTransaction(txItem); }}
                className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                aria-label="Edit transaction"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(txItem.id); }}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                aria-label="Delete transaction"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
        {viewMode === 'details' && showAccount && (
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-0.5">
            <span>{t('account')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{accounts.find(a => a.id === txItem.account)?.name || (isSwahili ? 'Akaunti Isiyojulikana' : 'Unknown')}</span></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Top Total Balance Card */}
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
              <span className="truncate">{isSwahili ? 'Daftari la Fedha Moja kwa Moja' : 'Live Cash Book Register'}</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden w-full lg:w-auto shrink-0">
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">{t('totalInflow')}</div>
              <div className={`text-emerald-200 ${getBoxValueClass('+' + formatCurrency(totalInflow))}`} title={'+' + formatCurrency(totalInflow)}>
                +{formatCurrency(totalInflow)}
              </div>
            </div>
            <div className="flex-1 lg:w-44 xl:w-48 bg-white/10 dark:bg-slate-800/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-center">
              <div className="text-xs opacity-80 mb-1 font-medium truncate">{t('totalOutflow')}</div>
              <div className={`text-red-200 ${getBoxValueClass('-' + formatCurrency(totalOutflow))}`} title={'-' + formatCurrency(totalOutflow)}>
                -{formatCurrency(totalOutflow)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Cashbook Adjustments Form Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Filter className={isUbuntu ? "text-[#E95420]" : "text-emerald-600 dark:text-emerald-400"} size={20} />
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {isSwahili ? 'Marekebisho ya Daftari la Fedha' : 'Cashbook Adjustments & Form Controls'}
            </h3>
          </div>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs md:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 flex-shrink-0 cursor-pointer ${
              isUbuntu ? 'bg-[#E95420] hover:bg-[#D14818]' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Plus size={18} /> {t('addTransaction')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Adjustments Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end">
          {/* Transaction Type Filter */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Chuja Aina' : 'Type Filter'}
            </label>
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 h-[42px] items-center w-full min-w-0">
              {(['all', 'income', 'expense'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`w-full h-full min-w-0 px-0.5 sm:px-1 text-[10.5px] sm:text-[11px] md:text-xs font-extrabold capitalize transition-all text-center flex items-center justify-center rounded-lg cursor-pointer ${
                    filterType === type 
                      ? (isUbuntu ? 'bg-white dark:bg-slate-800 text-[#E95420] shadow-sm border border-slate-200/50 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700')
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="w-full min-w-0 block text-center truncate">
                    {type === 'all' ? t('all') : (type === 'income' ? t('income') : t('expense'))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Layout */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Mtindo wa Muonekano' : 'Layout View'}
            </label>
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 h-[42px] items-center w-full min-w-0">
              {(['grouped', 'list', 'details'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`w-full h-full min-w-0 px-0.5 sm:px-1 text-[10.5px] sm:text-[11px] md:text-xs font-extrabold capitalize transition-all text-center flex items-center justify-center rounded-lg cursor-pointer ${
                    viewMode === mode 
                      ? (isUbuntu ? 'bg-white dark:bg-slate-800 text-[#E95420] shadow-sm border border-slate-200/50 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700')
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="w-full min-w-0 block text-center truncate">
                    {mode === 'grouped' ? (isSwahili ? 'Kikundi' : 'Grouped') : mode === 'list' ? (isSwahili ? 'Orodha' : 'List') : (isSwahili ? 'Maelezo' : 'Details')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Grouping */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Kipindi cha Muda' : 'Time Grouping'}
            </label>
            <div className={`grid grid-cols-4 gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 h-[42px] items-center w-full min-w-0 transition-opacity ${viewMode !== 'grouped' ? 'opacity-50 pointer-events-none' : ''}`}>
              {[
                { id: 'daily', labelEn: 'Daily', labelSw: 'Siku' },
                { id: 'week', labelEn: 'Weekly', labelSw: 'Wiki' },
                { id: 'month', labelEn: 'Monthly', labelSw: 'Mwezi' },
                { id: 'year', labelEn: 'Yearly', labelSw: 'Mwaka' }
              ].map(g => (
                <button
                  key={g.id}
                  disabled={viewMode !== 'grouped'}
                  onClick={() => setTimeGroup(g.id as TimeGroup)}
                  className={`w-full h-full min-w-0 px-0.5 sm:px-1 text-[9.5px] min-[400px]:text-[10px] sm:text-[10.5px] md:text-[11px] lg:text-xs font-extrabold tracking-tighter sm:tracking-tight capitalize transition-all text-center flex items-center justify-center rounded-lg cursor-pointer ${
                    timeGroup === g.id 
                      ? (isUbuntu ? 'bg-white dark:bg-slate-800 text-[#E95420] shadow-sm border border-slate-200/50 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700')
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={`${isSwahili ? g.labelSw : g.labelEn}`}
                >
                  <span className="w-full min-w-0 block text-center truncate">
                    {isSwahili ? g.labelSw : g.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div className="min-w-0">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {isSwahili ? 'Mfuatano wa Kupanga' : 'Sort Sequence'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full h-[42px] text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="date_desc">{isSwahili ? 'Mpya Zaidi Awali' : 'Newest First'}</option>
              <option value="date_asc">{isSwahili ? 'Ya Zamani Zaidi Awali' : 'Oldest First'}</option>
              <option value="amount_desc">{isSwahili ? 'Kiasi Kikubwa Zaidi' : 'Highest Amount'}</option>
              <option value="amount_asc">{isSwahili ? 'Kiasi Kidogo Zaidi' : 'Lowest Amount'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-0">
        <div className="space-y-6">
          {viewMode === 'grouped' ? (
            Object.entries(groupedTransactions).map(([accountId, periodsMap]) => {
              const account = accounts.find(a => a.id === accountId);
              const accountName = account ? account.name : (isSwahili ? 'Akaunti Isiyojulikana' : 'Unknown Account');
              
              return (
                <div key={accountId} className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className={`w-3 h-3 rounded-full shadow-sm ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500'}`}></span>
                    {accountName}
                  </h3>

                  {Object.entries(periodsMap as Record<string, Transaction[]>).map(([period, txs]) => {
                    const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                    const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const netBalance = totalIncome - totalExpense;

                    // Group categories
                    const categorySums = txs.reduce((cAcc, t) => {
                       cAcc[t.category] = (cAcc[t.category] || 0) + t.amount;
                       return cAcc;
                    }, {} as Record<string, number>);
                    const categoryEntries = Object.entries(categorySums).sort((a,b) => b[1] - a[1]);

                    return (
                      <div key={period} className="space-y-3 pl-3.5 border-l-2 border-slate-300 dark:border-slate-600 ml-1.5 mt-4">
                        <div className="flex flex-col pb-1">
                          <h4 className="font-semibold text-slate-700 dark:text-slate-200">{period}</h4>
                          <div className="flex gap-4 text-xs mt-1 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 inline-flex w-fit shadow-sm flex-wrap">
                            <span className="text-emerald-600 font-medium">{t('inflow')}: {formatCurrency(totalIncome)}</span>
                            <span className="text-red-500 font-medium">{t('outflow')}: {formatCurrency(totalExpense)}</span>
                            <span className="text-slate-700 dark:text-slate-300 font-bold border-l border-slate-200 dark:border-slate-700 pl-4">
                              {t('net')}: {formatCurrency(netBalance)}
                            </span>
                          </div>
                          {categoryEntries.length > 0 && (
                            <div className="mt-2 text-[11px] flex gap-2 flex-wrap text-slate-600 dark:text-slate-400">
                              {categoryEntries.map(([cat, amt]) => (
                                <span key={cat} className="bg-slate-200/70 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg capitalize font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                  {getCategoryName(cat)} <span className="text-slate-800 dark:text-slate-200 ml-1">{formatCurrency(amt)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {txs.map(t => renderTransactionCard(t, false))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(t => renderTransactionCard(t, true))}
            </div>
          )}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <p>{t('noTransactionsFound')}</p>
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        initialType="expense"
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
