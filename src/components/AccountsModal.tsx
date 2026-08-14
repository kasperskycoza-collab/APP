import { useState } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { X, Wallet, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const { accounts, currency, addAccount, deleteAccount } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const handleAdd = () => {
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim(), parseFloat(newAccountBalance) || 0);
      setNewAccountName('');
      setNewAccountBalance('');
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingAccountId(id);
  };

  const confirmDelete = () => {
    if (deletingAccountId) {
      deleteAccount(deletingAccountId);
      setDeletingAccountId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-900/65 dark:bg-black/75 z-[100] flex items-center justify-center p-4 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="text-emerald-500" size={20} />
            My Accounts
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {acc.name}
                    {acc.isDefault && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Default</span>}
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 mt-1">
                    {formatMoney(acc.balance, currency)}
                  </div>
                </div>
                {!acc.isDefault && (
                  <button onClick={() => handleDelete(acc.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:bg-red-900/30 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                + Add New Account
              </button>
            ) : (
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Account Name</label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={e => setNewAccountName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Savings, Mobile Money"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Initial Balance</label>
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={e => setNewAccountBalance(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg">Cancel</button>
                  <button onClick={handleAdd} className="flex-1 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Add Account</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deletingAccountId !== null}
        onClose={() => setDeletingAccountId(null)}
        onConfirm={confirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? Transactions associated with this account may default to another account."
      />
    </div>
  );
}
