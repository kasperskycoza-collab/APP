import React, { useState } from 'react';
import { useStore } from '../store';
import { X, ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { addTransaction, accounts } = useStore();

  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || 'default');
  const [toAccount, setToAccount] = useState(accounts.length > 1 ? accounts[1].id : 'default');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (fromAccount === toAccount) {
      setError('Cannot transfer to the same account');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccount);
    if (!fromAcc) return;

    if (fromAcc.balance < parsedAmount) {
      setError('Insufficient funds in the source account');
      return;
    }

    const toAcc = accounts.find(a => a.id === toAccount);
    const date = new Date().toISOString().split('T')[0];

    // Create expense transaction for outgoing
    addTransaction({
      type: 'expense',
      amount: parsedAmount,
      category: 'other',
      date,
      description: `Transfer to ${toAcc?.name}: ${description}`,
      method: 'transfer',
      account: fromAccount,
      recurring: false,
    });

    // Create income transaction for incoming
    addTransaction({
      type: 'income',
      amount: parsedAmount,
      category: 'other',
      date,
      description: `Transfer from ${fromAcc.name}: ${description}`,
      method: 'transfer',
      account: toAccount,
      recurring: false,
    });

    onClose();
    // Reset form
    setAmount('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl m-4 max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-500" size={20} />
            Transfer Funds
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <form id="transfer-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">From Account</label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-colors text-sm bg-white dark:bg-slate-800"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">To Account</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-colors text-sm bg-white dark:bg-slate-800"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-colors text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
              <input
                type="text"
                placeholder="Transfer description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-4 rounded-xl text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-[0.98]"
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
