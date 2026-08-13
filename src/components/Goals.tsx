import { useState } from 'react';
import { formatCurrency as formatMoney, getMainValueClass } from '../utils';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { Target, Plus, Edit2, Trash2, PlusCircle, Sparkles, Trophy } from 'lucide-react';
import AddGoalModal from './AddGoalModal';
import EditGoalModal from './EditGoalModal';
import FundGoalModal from './FundGoalModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import GoalDetailsModal from './GoalDetailsModal';
import EditTransactionModal from './EditTransactionModal';
import { Goal, Transaction } from '../types';

export default function Goals() {
  const { goals, currency, deleteGoal, transactions, accounts, deleteTransaction, themePalette } = useStore();
  const { t, language } = useTranslation();
  const isUbuntu = themePalette === 'ubuntu';
  const isSwahili = language === 'sw';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [fundingGoal, setFundingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

  const handleDelete = (id: number) => {
    setDeletingGoalId(id);
  };

  const confirmDelete = () => {
    if (deletingGoalId !== null) {
      deleteGoal(deletingGoalId);
      setDeletingGoalId(null);
    }
  };

  const confirmDeleteTransaction = () => {
    if (deletingTransactionId !== null) {
      deleteTransaction(deletingTransactionId);
      setDeletingTransactionId(null);
    }
  };

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.current, 0);

  return (
    <div className="pb-24 md:pb-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Banner Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-xl relative z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-80 mb-1">
              {t('totalSavingsTarget')}
            </div>
            <div className={getMainValueClass(formatCurrency(totalGoalCurrent))}>
              {formatCurrency(totalGoalCurrent)}
            </div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping flex-shrink-0"></span>
              <span className="truncate">
                {t('targetProgress')}: {totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0}% ({formatCurrency(totalGoalTarget)} {isSwahili ? 'lengo jumla' : 'total target'})
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 sm:gap-4 overflow-hidden w-full lg:w-auto items-center">
            <button 
              onClick={() => setIsAddOpen(true)}
              className={`px-5 py-3 lg:px-6 lg:py-3.5 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 w-full lg:w-auto cursor-pointer btn-add-saving-goal ${
                isUbuntu
                  ? 'bg-[#EBEBEB] text-[#2D2D2D] hover:bg-white border border-[#D5D0C7] dark:bg-[#EBEBEB] dark:text-[#2D2D2D] dark:hover:bg-white dark:border-[#EBEBEB]'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Plus size={20} className={isUbuntu ? 'text-[#E95420]' : ''} /> {t('addGoal')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...goals]
          .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
          .map(goal => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = goal.current >= goal.target;
          const currentStr = formatCurrency(goal.current);
          const targetStr = formatCurrency(goal.target);
          const remainingAmount = goal.target - goal.current;
          const remainingStr = formatCurrency(remainingAmount);
          const savedText = isSwahili ? `${currentStr} zimehifadhiwa kati ya ${targetStr}` : `${currentStr} saved of ${targetStr}`;
          const remainingText = isCompleted ? (isSwahili ? 'Imekamilika! 🥳' : 'Completed! 🥳') : (isSwahili ? `${remainingStr} zimebaki` : `${remainingStr} remaining`);
          const figureTotalLen = savedText.length + remainingText.length;

          const amountFontSizeClass = figureTotalLen > 42
            ? "text-xs"
            : figureTotalLen > 32
              ? "text-xs sm:text-sm"
              : "text-xs sm:text-base";

          const percStr = `${percentage.toFixed(0)}%`;
          const percFontSizeClass = percStr.length > 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl";

          return (
            <div 
              key={goal.id} 
              onClick={() => setSelectedGoal(goal)}
              className={`bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border shadow-sm flex flex-col justify-between gap-4 group transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-emerald-500/40 active:scale-[99.5%] min-w-0 ${
                isCompleted 
                  ? 'border-amber-300/80 dark:border-amber-500/30 ring-2 ring-amber-400/20 dark:ring-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.08)] bg-gradient-to-br from-amber-50/40 to-amber-100/10 dark:from-amber-950/10 dark:to-amber-900/10' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="min-w-0">
                <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap min-w-0">
                      <span className="truncate max-w-full">{goal.name}</span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 shadow-sm animate-pulse whitespace-nowrap flex-shrink-0">
                          <Trophy size={11} className="text-amber-500 dark:text-amber-400 animate-bounce flex-shrink-0" /> {isSwahili ? 'Imetimia!' : 'Achieved!'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap min-w-0">
                      <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border whitespace-nowrap flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-amber-100 to-amber-200/60 dark:from-amber-950/60 dark:to-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20' 
                          : 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20'
                      }`}>
                        {isCompleted ? (isSwahili ? 'Imekamilika 🎉' : 'Completed 🎉') : `${percentage.toFixed(0)}% ${isSwahili ? 'Imefikiwa' : 'Approached'}`}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        {isSwahili ? 'Mwisho' : 'Due'} {new Date(goal.deadline).toLocaleDateString(isSwahili ? 'sw' : 'en-US')}
                      </span>
                    </div>
                  </div>
                  <div className={`font-black ${percFontSizeClass} tracking-tight flex items-center gap-1 flex-shrink-0 ${isCompleted ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isCompleted && <Sparkles size={16} className="text-amber-500 flex-shrink-0" />}
                    {percStr}
                  </div>
                </div>
                
                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden my-3 border border-slate-200/10 dark:border-slate-800/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      isCompleted 
                        ? 'from-amber-400 via-yellow-400 to-amber-500 border-r border-amber-300 dark:border-amber-600/20 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                        : isUbuntu
                          ? 'from-[#E95420] to-[#FF7A45]'
                          : 'from-emerald-400 to-emerald-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className={`flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center justify-between gap-1 ${amountFontSizeClass} text-slate-600 dark:text-slate-300 font-medium min-w-0 flex-wrap`}>
                  <span className="truncate min-w-0 max-w-full">{savedText}</span>
                  <span className={`font-extrabold whitespace-nowrap flex-shrink-0 ${isCompleted ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                    {remainingText}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setFundingGoal(goal); }}
                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  <PlusCircle size={15} className="flex-shrink-0" /> <span className="whitespace-nowrap">{t('fundGoal')}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); }}
                    className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-xl transition-colors cursor-pointer"
                    aria-label="Edit goal"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-xl transition-colors cursor-pointer"
                    aria-label="Delete goal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Target size={48} className="mx-auto mb-4 opacity-50 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {t('noGoalsSet')}
            </h3>
            <p className="text-xs">
              {isSwahili ? 'Unda lengo lako la kwanza kuanza kujiwekea akiba kwa ufanisi' : 'Create your first goal to start saving efficiently'}
            </p>
          </div>
        )}
      </div>

      <AddGoalModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />
      
      <EditGoalModal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        goal={editingGoal}
      />
      
      <FundGoalModal
        isOpen={!!fundingGoal}
        onClose={() => setFundingGoal(null)}
        goal={fundingGoal}
      />

      <GoalDetailsModal
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        goal={selectedGoal ? goals.find(g => g.id === selectedGoal.id) || null : null}
        currency={currency}
        transactions={transactions}
        accounts={accounts}
        onFund={(g) => { setSelectedGoal(null); setFundingGoal(g); }}
        onEdit={(g) => { setSelectedGoal(null); setEditingGoal(g); }}
        onDelete={(id) => { setSelectedGoal(null); handleDelete(id); }}
        onEditTransaction={(tx) => setEditingTransaction(tx)}
        onDeleteTransaction={(id) => setDeletingTransactionId(id)}
      />

      <ConfirmDeleteModal
        isOpen={deletingGoalId !== null}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={confirmDelete}
        title={isSwahili ? "Futa Lengo la Akiba" : "Delete Savings Goal"}
        message={isSwahili ? "Una uhakika unataka kufuta lengo hili la akiba? Hii haitaathiri miamala yako." : "Are you sure you want to delete this savings goal? This will not affect your transactions."}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <ConfirmDeleteModal
        isOpen={deletingTransactionId !== null}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={confirmDeleteTransaction}
        title={isSwahili ? "Futa Muamala" : "Delete Transaction"}
        message={isSwahili ? "Una uhakika unataka kufuta muamala huu? Hatua hii haiwezi kutenduliwa na itasasisha maendeleo ya lengo na salio lako." : "Are you sure you want to delete this transaction? This action cannot be undone and will update both this goal's savings progress and your Cash Book balance."}
      />
    </div>
  );
}
