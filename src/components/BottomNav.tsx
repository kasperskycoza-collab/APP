import { Home, Book, Target, User, PieChart } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const { themePalette } = useStore();
  const { t } = useTranslation();

  const isUbuntu = themePalette === 'ubuntu';

  const tabs = [
    { id: 'dashboard', label: t('navDashboard'), icon: Home },
    { id: 'transactions', label: t('navTransactions'), icon: Book },
    { id: 'analysis', label: t('navAudit'), icon: PieChart },
    { id: 'goals', label: t('navGoals'), icon: Target },
    { id: 'profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav 
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-5 items-center px-1 py-1.5 z-50 shadow-lg select-none"
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        const activeClass = isUbuntu
          ? 'text-[#E95420]'
          : 'text-emerald-600 dark:text-emerald-400';

        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-0.5 w-full min-w-0 transition-all cursor-pointer ${
              isActive ? activeClass : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon 
              size={20} 
              className={isActive ? 'transform -translate-y-0.5 transition-transform' : 'transition-transform'} 
            />
            <span 
              className={`text-[9.5px] xs:text-[10.5px] sm:text-[11px] leading-tight whitespace-nowrap text-center tracking-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

