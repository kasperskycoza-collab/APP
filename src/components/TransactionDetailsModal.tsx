import { X, Calendar, Wallet, Tag, Target, RefreshCw, CreditCard, ArrowDown, ArrowUp } from 'lucide-react';
import { Transaction, Account, Goal } from '../types';
import { formatCurrency as formatMoney } from '../utils';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  netBalance: number;
  currency: string;
  accounts: Account[];
  goals: Goal[];
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  netBalance,
  currency,
  accounts,
  goals
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const formatCurrency = (amount: number) => formatMoney(amount, currency);

  // Find associated details
  const account = accounts.find(a => a.id === transaction.account);
  const goal = transaction.goalId ? goals.find(g => g.id === transaction.goalId) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[90%] sm:max-h-[85%] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            Transaction Details
          </h2>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1">
          {/* Main Hero Stats */}
          <div className="text-center bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isIncome ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
              {isIncome ? <ArrowDown size={28} /> : <ArrowUp size={28} />}
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 px-2 text-sm">
              {transaction.description || 'No Description'}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            {/* Net Balance Snapshot */}
            <div className="flex items-center justify-between p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <div className="flex items-center gap-2.5 text-sky-700 dark:text-sky-300 font-semibold">
                <Wallet size={18} />
                <span>Computed Net Balance</span>
              </div>
              <div className="font-extrabold text-sky-800 dark:text-sky-300">
                {formatCurrency(netBalance)}
              </div>
            </div>

            {/* Main Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} /> Date
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {new Date(transaction.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>
              </div>

              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} /> Category
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                  {transaction.category}
                </div>
              </div>

              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={12} /> Payment Method
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                  {transaction.method}
                </div>
              </div>

              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet size={12} /> Account
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {account ? account.name : 'Unknown Account'}
                </div>
              </div>
            </div>

            {/* Recurring */}
            {transaction.recurring && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300 font-semibold">
                  <RefreshCw size={16} className="animate-spin-slow" />
                  <span>Recurring Transaction</span>
                </div>
                <span className="text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold capitalize">
                  {transaction.frequency || 'Weekly'}
                </span>
              </div>
            )}

            {/* Savings Goal Info */}
            {goal && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <Target size={18} />
                  <span>Savings Goal Progress</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium truncate">{goal.name}</span>
                  <span className="font-bold">{Math.round((goal.current / goal.target) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Saved: {formatCurrency(goal.current)}</span>
                  <span>Target: {formatCurrency(goal.target)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0 bg-slate-50 dark:bg-slate-900/20 flex gap-3 rounded-b-3xl sm:rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 rounded-xl transition duration-150"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
