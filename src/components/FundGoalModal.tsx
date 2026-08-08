import React, { useState, useEffect } from 'react';
import { formatCurrency as formatMoney } from '../utils';
import { useStore } from '../store';
import { X, Target, PlusCircle } from 'lucide-react';
import { Goal } from '../types';

interface FundGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export default function FundGoalModal({ isOpen, onClose, goal }: FundGoalModalProps) {
  const { updateGoalStatus, accounts, currency } = useStore();

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal && isOpen) {
      setAmount('');
      setAccountId('default');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === accountId);
    if (!selectedAccount) {
      setError('Invalid account selected');
      return;
    }

    if (selectedAccount.balance < parsedAmount) {
      setError(`Insufficient funds in ${selectedAccount.name}`);
      return;
    }

    // Remaining required to hit the target
    const remaining = goal.target - goal.current;
    if (parsedAmount > remaining && remaining > 0) {
       // Just a warning or we could allow it. Let's allow it but we might want to warn or cap it. Let's not restrict it to allow overfunding or just fund exact amount.
    }

    updateGoalStatus(goal.id, parsedAmount, accountId, date);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return formatMoney(amount, currency);
  };

  const formatGoalCurrency = (amount: number) => {
    return formatMoney(amount, currency, 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="text-emerald-500" size={20} />
            Fund Goal
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          <form id="fund-goal-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{goal.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Remaining: <span className="font-bold text-emerald-600">{formatGoalCurrency(goal.target - goal.current)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Amount to Fund</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Source Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors appearance-none bg-white dark:bg-slate-800"
              >
                <option value="" disabled>Select an account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Transaction Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-white dark:bg-slate-800"
              />
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold py-4 rounded-xl text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-[0.98]"
              >
                Add Funds
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
