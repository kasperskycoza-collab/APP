import { useState, useMemo } from 'react';
import { X, Search, Check, Coins } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { CURRENCIES } from '../i18n';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CurrencyModal({ isOpen, onClose }: CurrencyModalProps) {
  const { currency, setCurrency, themePalette } = useStore();
  const { t, language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCurrencies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return CURRENCIES;
    return CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(term) ||
      c.nameEn.toLowerCase().includes(term) ||
      c.nameSw.toLowerCase().includes(term) ||
      c.symbol.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelect = (code: string) => {
    setCurrency(code);
    onClose();
  };

  const isUbuntu = themePalette === 'ubuntu';

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUbuntu ? 'bg-[#E95420]/10 text-[#E95420]' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
              <Coins size={18} />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
              {t('selectCurrencyTitle')}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchCurrency')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Currency List */}
        <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
          {filteredCurrencies.map((curr) => {
            const isSelected = currency === curr.code;
            const fullName = language === 'sw' ? curr.nameSw : curr.nameEn;

            return (
              <div
                key={curr.code}
                onClick={() => handleSelect(curr.code)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? (isUbuntu
                        ? 'bg-[#E95420]/10 border-[#E95420] text-slate-900 dark:text-white shadow-sm'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-sm')
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none" role="img" aria-label={curr.nameEn}>
                    {curr.flag || '🌐'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                        {curr.code}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 font-semibold text-slate-600 dark:text-slate-300">
                        {curr.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {fullName}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-600'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400">
          {language === 'sw'
            ? `Sarafu ya sasa: ${currency} - ${CURRENCIES.find(c => c.code === currency)?.nameSw || currency}`
            : `Active Currency: ${currency} - ${CURRENCIES.find(c => c.code === currency)?.nameEn || currency}`}
        </div>

      </div>
    </div>
  );
}
