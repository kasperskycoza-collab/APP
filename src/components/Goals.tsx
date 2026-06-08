import { useState } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { Target, Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
import AddGoalModal from './AddGoalModal';
import EditGoalModal from './EditGoalModal';
import FundGoalModal from './FundGoalModal';
import { Goal } from '../types';

export default function Goals() {
  const { goals, currency, deleteGoal } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [fundingGoal, setFundingGoal] = useState<Goal | null>(null);

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id);
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold flex items-center gap-2">Savings Goals</div>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/20 flex items-center justify-center backdrop-blur-sm transition-transform active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {goals.map(goal => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          return (
            <div key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 group">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{goal.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Due {new Date(goal.deadline).toLocaleDateString()}</div>
                </div>
                <div className="font-bold text-emerald-600 text-lg">{percentage.toFixed(0)}%</div>
              </div>
              
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>{formatCurrency(goal.current)} saved</span>
                <span>{formatCurrency(goal.target - goal.current)} remaining</span>
              </div>
              
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800">
                <button
                  onClick={() => setFundingGoal(goal)}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-semibold transition-colors"
                >
                  <PlusCircle size={16} /> Fund
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30 p-1.5 rounded-lg transition-colors"
                  aria-label="Edit goal"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg transition-colors"
                  aria-label="Delete goal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No savings goals yet</h3>
            <p>Create your first goal to start tracking</p>
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
    </div>
  );
}
