import { X, Calendar, Edit2, Trash2, PlusCircle, Target, TrendingUp, AlertCircle, Sparkles, CheckCircle2, Wallet } from 'lucide-react';
import { Goal, Transaction, Account } from '../types';
import { formatCurrency as formatMoney } from '../utils';

interface GoalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  currency: string;
  transactions: Transaction[];
  accounts: Account[];
  onFund: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: number) => void;
}

export default function GoalDetailsModal({
  isOpen,
  onClose,
  goal,
  currency,
  transactions,
  accounts,
  onFund,
  onEdit,
  onDelete
}: GoalDetailsModalProps) {
  if (!isOpen || !goal) return null;

  const percentage = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = goal.current >= goal.target;
  const formatCurrency = (amount: number) => formatMoney(amount, currency, 0);

  const getFontSizeClass = (formattedStr: string) => {
    const len = formattedStr.length;
    if (len > 12) return "text-[9px] xs:text-[10px] sm:text-xs";
    if (len > 9) return "text-[10px] xs:text-xs sm:text-xs";
    if (len > 7) return "text-xs sm:text-sm";
    return "text-sm sm:text-sm";
  };

  // Filter transactions related to this goal
  const relatedTransactions = transactions
    .filter(t => t.goalId === goal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculates remaining days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(goal.deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const timeDiff = deadlineDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const getDeadlineStatus = () => {
    if (isCompleted) {
      return { text: 'Target Reached! 🎉', className: 'text-orange-500 dark:text-orange-400 bg-orange-100/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-500/20' };
    }
    if (daysDiff < 0) {
      return { text: `Overdue by ${Math.abs(daysDiff)} days`, className: 'text-rose-500 bg-rose-50 dark:bg-rose-950/25 border-rose-100 dark:border-rose-500/10' };
    }
    if (daysDiff === 0) {
      return { text: 'Due today! ⏰', className: 'text-amber-500 bg-amber-50 dark:bg-amber-950/25 border-amber-100 dark:border-amber-500/10' };
    }
    if (daysDiff === 1) {
      return { text: 'Due tomorrow! ⏰', className: 'text-amber-500 bg-amber-50 dark:bg-amber-950/25 border-amber-100 dark:border-amber-500/10' };
    }
    return { text: `${daysDiff} days remaining`, className: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/10' };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl flex flex-col max-h-[90%] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Target className={isCompleted ? 'text-orange-500' : 'text-emerald-600'} size={20} />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              Savings Goal Details
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1">
          
          {/* Main Visual Progress */}
          <div className={`p-5 rounded-2xl border text-center relative overflow-hidden transition-colors duration-300 ${
            isCompleted 
              ? 'bg-orange-50/20 border-orange-200 dark:border-orange-500/20' 
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'
          }`}>
            {isCompleted && (
              <div className="absolute top-2 right-2 text-orange-500 animate-pulse">
                <Sparkles size={18} />
              </div>
            )}
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isCompleted 
                ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isCompleted ? <CheckCircle2 size={32} /> : <TrendingUp size={32} />}
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white capitalize truncate px-2">
              {goal.name}
            </h3>

            {goal.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-4 break-words">
                {goal.description}
              </p>
            )}

            {/* Orange theme for completed/achieved status, also percentage approached when not completed */}
            <div className="mt-4 flex flex-col items-center">
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${deadlineStatus.className}`}>
                {deadlineStatus.text}
              </span>
            </div>

            {/* Custom Styled Progress Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                    isCompleted ? 'from-orange-400 to-orange-500' : 'from-emerald-400 to-emerald-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{percentage.toFixed(1)}% complete</span>
                <span className={`font-extrabold ${isCompleted ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {isCompleted ? 'Completed 🎉' : `${percentage.toFixed(0)}% Approached`}
                </span>
              </div>
            </div>
          </div>

          {/* Amount breakdown grids */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 border border-slate-100 dark:border-slate-800 bg-emerald-50/10 rounded-xl space-y-0.5 text-center min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Saved</span>
              <p className={`font-extrabold text-emerald-600 break-all select-all ${getFontSizeClass(formatCurrency(goal.current))}`}>{formatCurrency(goal.current)}</p>
            </div>
            <div className="p-2 sm:p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/10 rounded-xl space-y-0.5 text-center min-w-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Target</span>
              <p className={`font-extrabold text-slate-700 dark:text-slate-300 break-all select-all ${getFontSizeClass(formatCurrency(goal.target))}`}>{formatCurrency(goal.target)}</p>
            </div>
            <div className={`p-2 sm:p-3 border rounded-xl space-y-0.5 text-center min-w-0 ${
              isCompleted 
                ? 'bg-orange-50/20 border-orange-200 dark:border-orange-500/10' 
                : 'border-slate-100 dark:border-slate-800 bg-slate-50/10'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Remaining</span>
              <p className={`font-extrabold break-all select-all ${
                isCompleted ? 'text-orange-500 text-xs sm:text-sm' : `${getFontSizeClass(formatCurrency(goal.target - goal.current))} text-red-500`
              }`}>
                {isCompleted ? 'None 🎉' : formatCurrency(goal.target - goal.current)}
              </p>
            </div>
          </div>

          {/* Target Dates details */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-sm bg-slate-50/30">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar size={14} /> Created / Target date:
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {new Date(goal.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>

          {/* Goal contributions / funding logs */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Goal Funding History</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {relatedTransactions.length}
              </span>
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {relatedTransactions.map(tx => {
                const account = accounts.find(a => a.id === tx.account);
                return (
                  <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{tx.description || 'Goal Funding Record'}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                        {account && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400 font-medium">
                              <Wallet size={10} className="text-slate-400" /> {account.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      +{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}

              {relatedTransactions.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <AlertCircle size={22} className="mx-auto text-slate-400 opacity-70" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No funding transactions logged yet</p>
                  <p className="text-[10px] text-slate-400">Use the "Fund" action below or record a transaction on this goal.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0 bg-slate-50 dark:bg-slate-900/20 flex items-center gap-3 rounded-b-2xl">
          <button 
            onClick={() => onFund(goal)}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle size={16} /> Fund Goal
          </button>
          
          <button 
            onClick={() => onEdit(goal)}
            className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-slate-200/50 dark:border-slate-700"
            aria-label="Edit goal"
            title="Edit Goal"
          >
            <Edit2 size={16} />
          </button>

          <button 
            onClick={() => onDelete(goal.id)}
            className="p-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors border border-rose-100 dark:border-rose-950/20"
            aria-label="Delete goal"
            title="Delete Goal"
          >
            <Trash2 size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
