import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X } from 'lucide-react';
import { Transaction } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { editTransaction, accounts } = useStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('');
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
      setDescription(transaction.description);
      setMethod(transaction.method);
      setAccount(transaction.account);
      setError('');
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const incomeCategories = ['salary', 'business', 'freelance', 'investment', 'other'];
  const expenseCategories = ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'other'];
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    editTransaction(transaction.id, {
      type,
      amount: parsedAmount,
      category,
      date,
      description,
      method,
      account,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Edit Transaction</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'expense' ? 'bg-white dark:bg-slate-800 text-red-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Expense
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`border-2 p-2 rounded-xl text-center cursor-pointer text-xs font-semibold capitalize transition-all ${
                      category === cat
                        ? type === 'income' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700' : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-200 hover:bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
              <input
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-white dark:bg-slate-800"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Account</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-white dark:bg-slate-800"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                className={`w-full font-bold py-4 rounded-xl text-white shadow-lg transition-transform active:scale-[0.98] ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                }`}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
