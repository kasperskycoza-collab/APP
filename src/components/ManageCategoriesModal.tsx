import { useState } from 'react';
import { useStore } from '../store';
import { X, Plus, Trash2, Tags } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { incomeCategories, expenseCategories, addCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [newCat, setNewCat] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleAdd = () => {
    if (newCat.trim()) {
      addCategory(activeTab, newCat.trim().toLowerCase());
      setNewCat('');
    }
  };

  const handleDelete = (cat: string) => {
    setDeletingCat(cat);
  };

  const confirmDelete = () => {
    if (deletingCat) {
      deleteCategory(activeTab, deletingCat);
      setDeletingCat(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tags className="text-emerald-500" size={20} />
            Categories
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'expense' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              onClick={() => setActiveTab('expense')}
            >
              Expense
            </button>
            <button
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'income' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              onClick={() => setActiveTab('income')}
            >
              Income
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New category name" 
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-emerald-500 focus:outline-none bg-white dark:bg-slate-800 text-sm"
            />
            <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-4 flex-1 space-y-2">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group">
              <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{cat}</span>
              <button onClick={() => handleDelete(cat)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deletingCat !== null}
        onClose={() => setDeletingCat(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Past transactions using this category will not be affected."
      />
    </div>
  );
}
