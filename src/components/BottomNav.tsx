import { Home, Book, Target, User, PieChart } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Cash Book', icon: Book },
    { id: 'analysis', label: 'Audit', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-50">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <Icon size={24} className={isActive ? 'transform -translate-y-1 transition-transform' : ''} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
