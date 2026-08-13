import { useStore } from './store';
import { translations, getCategoryTranslation, getPaymentMethodTranslation, getCurrencyFullName, CURRENCIES } from './i18n';

export function useTranslation() {
  const language = useStore((s) => s.language) || 'en';
  const setLanguage = useStore((s) => s.setLanguage);

  const t = (key: keyof typeof translations['en']): string => {
    const langDict = translations[language] || translations['en'];
    return (langDict as any)[key] || (translations['en'] as any)[key] || key;
  };

  const getCategoryName = (cat: string) => getCategoryTranslation(cat, language);
  const getPaymentMethodName = (pm: string) => getPaymentMethodTranslation(pm, language);
  const getMethodName = (pm: string) => getPaymentMethodTranslation(pm, language);
  const getCurrencyName = (code: string) => getCurrencyFullName(code, language);

  return {
    t,
    language,
    setLanguage,
    getCategoryName,
    getPaymentMethodName,
    getMethodName,
    getCurrencyName,
    currencies: CURRENCIES
  };
}
