import { useState } from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [reminders, setReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  if (!isOpen) return null;

  const toggleConfig = [
    { id: 'reminders', label: 'Daily Savings Reminders', desc: 'Remind me to save daily', state: reminders, setter: setReminders },
    { id: 'goalAlerts', label: 'Goal Achievement Alerts', desc: 'Notify when goals are reached', state: goalAlerts, setter: setGoalAlerts },
    { id: 'budgetAlerts', label: 'Budget Limit Warnings', desc: 'Alert when near budget limit', state: budgetAlerts, setter: setBudgetAlerts },
    { id: 'weeklySummary', label: 'Weekly Summary', desc: 'Send weekly financial summary', state: weeklySummary, setter: setWeeklySummary },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="text-amber-500" size={20} />
            Notification Settings
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1 space-y-4">
          {toggleConfig.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => item.setter(!item.state)}>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors ${item.state ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${item.state ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
