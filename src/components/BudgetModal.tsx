import { useState } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { X, Calculator, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BudgetModal({ isOpen, onClose }: BudgetModalProps) {
  const { transactions, currency } = useStore();
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [deletingBudget, setDeletingBudget] = useState<string | null>(null);

  const expenseCategories = ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'other'];

  const handleAdd = () => {
    if (limit && parseFloat(limit) > 0) {
      setBudgets(prev => ({
        ...prev,
        [category]: parseFloat(limit)
      }));
      setLimit('');
      setIsAdding(false);
    }
  };

  const handleDelete = (cat: string) => {
    setDeletingBudget(cat);
  };

  const confirmDelete = () => {
    if (deletingBudget) {
      setBudgets(prev => {
        const next = { ...prev };
        delete next[deletingBudget];
        return next;
      });
      setDeletingBudget(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-5 pb-[5.5rem] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[100%] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="text-blue-500" size={20} />
            Budget Planning
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          {Object.keys(budgets).length === 0 && !isAdding && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <Calculator className="mx-auto opacity-50 mb-3" size={40} />
              <p className="text-sm">No budgets set yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(budgets).map(([cat, lim]) => {
              const spent = transactions
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
              
              const limitNum = Number(lim);
              const percentage = Math.min((spent / limitNum) * 100, 100);
              const statusColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={cat} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-slate-800 dark:text-slate-100 capitalize">{cat}</div>
                    <button onClick={() => handleDelete(cat)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Spent: {formatMoney(spent, currency)}</span>
                    <span className="font-semibold">{formatMoney(limitNum, currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${statusColor} transition-all`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Set New Budget
              </button>
            ) : (
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-800 capitalize"
                  >
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Monthly Limit</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg">Cancel</button>
                  <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg">Set Budget</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deletingBudget !== null}
        onClose={() => setDeletingBudget(null)}
        onConfirm={confirmDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget limit?"
      />
    </div>
  );
}
