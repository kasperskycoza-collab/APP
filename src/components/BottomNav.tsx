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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex justify-around p-2 z-50 shadow-lg">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        const activeClass = isUbuntu
          ? 'text-[#E95420]'
          : 'text-emerald-600 dark:text-emerald-400';

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 w-16 transition-all ${
              isActive ? activeClass : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon size={22} className={isActive ? 'transform -translate-y-0.5 transition-transform' : ''} />
            <span className={`text-[10px] truncate max-w-full font-semibold ${isActive ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
