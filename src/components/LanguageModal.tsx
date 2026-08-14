import { X, Check, Globe } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import { AppLanguage } from '../types';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { language, setLanguage, themePalette } = useStore();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const languages: { code: AppLanguage; name: string; localName: string; flag: string; country: string }[] = [
    {
      code: 'en',
      name: 'English',
      localName: 'English (United Kingdom)',
      flag: '🇬🇧',
      country: 'Britain'
    },
    {
      code: 'sw',
      name: 'Kiswahili',
      localName: 'Kiswahili (Tanzania)',
      flag: '🇹🇿',
      country: 'Tanzania'
    }
  ];

  const handleSelect = (lang: AppLanguage) => {
    setLanguage(lang);
    onClose();
  };

  const isUbuntu = themePalette === 'ubuntu';

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950/65 dark:bg-black/75 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUbuntu ? 'bg-[#E95420]/10 text-[#E95420]' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
              <Globe size={18} />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
              {t('selectLanguageTitle')}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Languages */}
        <div className="p-4 space-y-3">
          {languages.map((langItem) => {
            const isSelected = language === langItem.code;
            return (
              <div
                key={langItem.code}
                onClick={() => handleSelect(langItem.code)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? (isUbuntu 
                        ? 'bg-[#E95420]/10 border-[#E95420] text-slate-900 dark:text-white shadow-sm' 
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-sm')
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl filter drop-shadow-sm select-none" role="img" aria-label={langItem.country}>
                    {langItem.flag}
                  </span>
                  <div>
                    <div className="font-bold text-sm sm:text-base flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <span>{langItem.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {langItem.flag} {langItem.country}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {langItem.localName}
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
            ? '💡 Mipangilio ya lugha inatumika mara moja kwenye programu nzima.' 
            : '💡 Language preference applies instantly throughout the entire application.'}
        </div>

      </div>
    </div>
  );
}
