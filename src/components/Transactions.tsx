import { useState, useMemo } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { ArrowDown, ArrowUp, Plus, Search, Filter, Trash2, Edit2, List, AlignLeft, ChevronDown, Target, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
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

const getPeriodKey = (dateString: string, groupBy: TimeGroup) => {
  const d = new Date(dateString);
  if (groupBy === 'daily') {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  if (groupBy === 'year') {
    return d.getFullYear().toString();
  }
  if (groupBy === 'week') {
    return getWeekNumber(d);
  }
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Transactions() {
  const { transactions, currency, deleteTransaction, accounts, goals } = useStore();
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
    // Sort all transactions chronologically (oldest to newest) to compute historical running balance correctly
    const sortedAll = [...transactions].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id; // tie breaker
    });

    // Group sum of txs per account
    const txSums: Record<string, number> = {};
    sortedAll.forEach(tx => {
      const accId = tx.account || 'default';
      txSums[accId] = (txSums[accId] || 0) + (tx.type === 'income' ? tx.amount : -tx.amount);
    });

    // Calculate initial balance for each account using our robust balance-reversal forumla
    const initialBalances: Record<string, number> = {};
    accounts.forEach(acc => {
      initialBalances[acc.id] = acc.balance - (txSums[acc.id] || 0);
    });

    // Calculate running balance incrementally
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
      .filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, filterType, search, sortBy]);

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const accountId = tx.account || 'default';
      const period = getPeriodKey(tx.date, timeGroup);
      
      if (!acc[accountId]) {
        acc[accountId] = {};
      }
      if (!acc[accountId][period]) {
        acc[accountId][period] = [];
      }
      acc[accountId][period].push(tx);
      return acc;
    }, {} as Record<string, Record<string, Transaction[]>>);
  }, [filteredTransactions, timeGroup]);

  const handleDelete = (id: number) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = () => {
    if (deletingTransactionId !== null) {
      deleteTransaction(deletingTransactionId);
      setDeletingTransactionId(null);
    }
  };

  const renderTransactionCard = (t: Transaction, showAccount: boolean = false) => {
    const isIncome = t.type === 'income';
    const netBal = transactionNetBalances[t.id] ?? 0;
    return (
      <div 
        key={t.id} 
        onClick={() => setSelectedTransaction(t)}
        className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1.5 group cursor-pointer hover:border-emerald-500/30 dark:hover:border-slate-600 transition-all hover:shadow active:scale-[99.5%] active:bg-slate-50/50 dark:active:bg-slate-800/80"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
            {isIncome ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{t.description}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="capitalize">{t.category}</span>
              <span>•</span>
              <span>{new Date(t.date).toLocaleDateString()}</span>
              {viewMode === 'details' && (
                <>
                  <span>•</span>
                  <span className="capitalize px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">{t.method}</span>
                </>
              )}
              {t.goalId && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1 py-0.5 rounded font-medium">
                    <Target size={10} /> Goal
                  </span>
                </>
              )}
              {t.recurring && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-1 py-0.5 rounded font-medium capitalize">
                    <RefreshCw size={10} /> {t.frequency}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
            <div className={`font-bold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
            </div>
            {/* Net/Running Balance badge under the amount */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
              Bal: {formatCurrency(netBal)}
            </div>
            <div className="flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingTransaction(t); }}
                className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-md hover:bg-blue-50 dark:bg-blue-900/30"
                aria-label="Edit transaction"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:bg-red-900/30"
                aria-label="Delete transaction"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
        {viewMode === 'details' && showAccount && (
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-0.5">
            <span>Account: <span className="font-semibold text-slate-700">{accounts.find(a => a.id === t.account)?.name || 'Unknown'}</span></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold flex items-center gap-2">Cash Book</div>
          <button onClick={() => setIsAddOpen(true)} className="w-10 h-10 rounded-full bg-black/10 dark:bg-slate-800/20 flex items-center justify-center backdrop-blur-sm text-white">
            <Plus size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/10 dark:bg-slate-800/10 border border-white/20 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1 sm:flex-none">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium transition-colors border-r border-slate-200 dark:border-slate-700 last:border-0 ${
                  viewMode === 'grouped' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'
                }`}
                aria-label="Grouped view"
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium transition-colors border-r border-slate-200 dark:border-slate-700 last:border-0 ${
                  viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'
                }`}
                aria-label="List view"
              >
                List
              </button>
              <button
                onClick={() => setViewMode('details')}
                className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium transition-colors last:border-0 ${
                  viewMode === 'details' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'
                }`}
                aria-label="Details view"
              >
                Details
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors hidden sm:block"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                    filterType === type 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {viewMode === 'grouped' && (
              <select
                value={timeGroup}
                onChange={(e) => setTimeGroup(e.target.value as TimeGroup)}
                className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors ml-auto"
              >
                <option value="daily">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-emerald-500 transition-colors sm:hidden w-full mt-2"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {viewMode === 'grouped' ? (
            Object.entries(groupedTransactions).map(([accountId, periodsMap]) => {
              const account = accounts.find(a => a.id === accountId);
              const accountName = account ? account.name : 'Unknown Account';
              
              return (
                <div key={accountId} className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mx-[-8px] sm:mx-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
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
                            <span className="text-emerald-600 font-medium">In: {formatCurrency(totalIncome)}</span>
                            <span className="text-red-500 font-medium">Out: {formatCurrency(totalExpense)}</span>
                            <span className="text-slate-700 dark:text-slate-300 font-bold border-l border-slate-200 dark:border-slate-700 pl-4">Net: {formatCurrency(netBalance)}</span>
                          </div>
                          {categoryEntries.length > 0 && (
                            <div className="mt-2 text-[11px] flex gap-2 flex-wrap text-slate-600 dark:text-slate-400">
                              {categoryEntries.map(([cat, amt]) => (
                                <span key={cat} className="bg-slate-200/70 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg capitalize font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                  {cat} <span className="text-slate-800 dark:text-slate-200 ml-1">{formatCurrency(amt)}</span>
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
              <p>No transactions found.</p>
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
