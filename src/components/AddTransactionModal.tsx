import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { X } from 'lucide-react';
import { evaluateMath } from '../utils';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

export default function AddTransactionModal({ isOpen, onClose, initialType = 'expense' }: AddTransactionModalProps) {
  const store = useStore();
  const { addTransaction, accounts } = store;
  const { t, language, getCategoryName, getMethodName } = useTranslation();

  const isSwahili = language === 'sw';
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setRecurring(false);
      setFrequency('monthly');
      setError('');
    }
  }, [isOpen, initialType]);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('cash');
  const [account, setAccount] = useState('default');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categories = type === 'income' ? store.incomeCategories : store.expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = evaluateMath(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      setError(isSwahili ? 'Tafadhali weka kiasi sahihi' : 'Please enter a valid amount');
      return;
    }
    if (!category) {
      setError(isSwahili ? 'Tafadhali chagua kundi' : 'Please select a category');
      return;
    }
    if (!description.trim()) {
      setError(isSwahili ? 'Tafadhali weka maelezo' : 'Please enter a description');
      return;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      category,
      date,
      description,
      method,
      account,
      recurring,
      frequency: recurring ? frequency : undefined,
    });

    onClose();
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setRecurring(false);
    setFrequency('monthly');
  };

  const isUbuntu = store.themePalette === 'ubuntu';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950/65 dark:bg-black/75 z-[100] flex items-center justify-center p-4 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('addTransaction')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-sm font-semibold">{error}</div>}

            {/* Income / Expense Segmented Control with High Contrast Rectangles */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); }}
                className={`py-2.5 px-3 text-sm font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  type === 'income' 
                    ? (isUbuntu 
                        ? 'bg-white dark:bg-[#383838] text-[#E95420] dark:text-[#E95420] border-[#E95420]/50 shadow-md ring-1 ring-[#E95420]/30' 
                        : 'bg-white dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30') 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500'}`} />
                <span>{t('income')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`py-2.5 px-3 text-sm font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  type === 'expense' 
                    ? (isUbuntu 
                        ? 'bg-white dark:bg-[#383838] text-[#77216F] dark:text-pink-400 border-[#77216F]/50 dark:border-pink-500/50 shadow-md ring-1 ring-[#77216F]/30' 
                        : 'bg-white dark:bg-red-950/70 text-red-600 dark:text-red-400 border-red-500/60 shadow-md ring-1 ring-red-500/30') 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUbuntu ? 'bg-[#77216F] dark:bg-pink-400' : 'bg-red-500'}`} />
                <span>{t('expense')}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('amount')}</label>
              <input
                type="text"
                placeholder={isSwahili ? "0.00 (mf. 5000 + 2000)" : "0.00 (e.g. 50 + 20)"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                  const result = evaluateMath(amount);
                  if (result !== null) setAmount(result.toString());
                }}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('category')}</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`border-2 p-2 rounded-xl text-center cursor-pointer text-xs font-semibold capitalize transition-all ${
                      category === cat
                        ? type === 'income' 
                            ? (isUbuntu ? 'border-[#E95420] bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] dark:text-[#E95420]' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300') 
                            : (isUbuntu ? 'border-[#77216F] bg-[#FDF0F7] dark:bg-[#383838] text-[#77216F] dark:text-pink-300' : 'border-red-500 bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300')
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {getCategoryName(cat)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('description')}</label>
              <input
                type="text"
                placeholder={isSwahili ? "Ilikuwa ya nini?" : "What was this for?"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('date')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('paymentMethod')}</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="cash">{getMethodName('cash')}</option>
                  <option value="bank">{getMethodName('bank')}</option>
                  <option value="mobile">{getMethodName('mobile')}</option>
                  <option value="card">{getMethodName('card')}</option>
                  <option value="other">{getMethodName('other')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('account')}</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="recurring" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isSwahili ? 'Fanya iwe ya mara kwa mara' : 'Make this recurring'}
                </label>
                {recurring && (
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="mt-2 w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:border-emerald-500 focus:outline-none text-sm bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    <option value="daily">{isSwahili ? 'Kila Siku' : 'Daily'}</option>
                    <option value="weekly">{isSwahili ? 'Kila Wiki' : 'Weekly'}</option>
                    <option value="monthly">{isSwahili ? 'Kila Mwezi' : 'Monthly'}</option>
                    <option value="yearly">{isSwahili ? 'Kila Mwaka' : 'Yearly'}</option>
                  </select>
                )}
              </div>
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                className={`w-full font-bold py-4 rounded-xl text-white shadow-lg transition-transform active:scale-[0.98] cursor-pointer ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                }`}
              >
                {t('save')} {t('navTransactions')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
