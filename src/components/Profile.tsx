import { useState } from 'react';
import { User, Wallet, Calculator, Coins, RefreshCw, Tags, Moon, Lock, CloudUpload, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import AccountsModal from './AccountsModal';
import BudgetModal from './BudgetModal';
import NotificationsModal from './NotificationsModal';

export default function Profile() {
  const { user, currency, darkMode, pinLock, setCurrency, logout, toggleDarkMode, togglePinLock } = useStore();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const menuItems = [
    { icon: Wallet, label: 'My Accounts', desc: 'Manage multiple savings accounts', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', action: () => setShowAccountsModal(true) },
    { icon: Calculator, label: 'Budget Planning', desc: 'Set monthly spending limits', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30', action: () => setShowBudgetModal(true) },
    { icon: Coins, label: 'Currency Settings', desc: `Default: ${currency}`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/30', action: () => setShowCurrencyModal(true) },
    { icon: RefreshCw, label: 'Recurring Transactions', desc: 'Auto-repeat income & expenses', color: 'text-purple-600', bg: 'bg-purple-50', action: () => alert('Recurring feature coming soon!') },
    { icon: Tags, label: 'Manage Categories', desc: 'Add, edit, or delete categories', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', action: () => alert('Categories management coming soon!') },
    { icon: Moon, label: 'Dark Mode', desc: 'Toggle appearance', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', toggle: darkMode, action: toggleDarkMode },
    { icon: Lock, label: 'PIN Lock', desc: 'Secure app with 4-digit PIN', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', toggle: pinLock, action: togglePinLock },
    { icon: CloudUpload, label: 'Cloud Backup', desc: 'Backup to cloud storage', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30', action: () => alert('Backup feature coming soon!') },
    { icon: Bell, label: 'Notifications', desc: 'Reminders & alerts', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/30', action: () => setShowNotificationsModal(true) },
  ];

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    setShowCurrencyModal(false);
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-10 text-center rounded-b-2xl shadow-md">
        <div className="w-20 h-20 bg-white dark:bg-slate-800/20 rounded-full mx-auto mb-4 border-4 border-white/30 flex items-center justify-center">
          <User size={36} />
        </div>
        <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
        <p className="opacity-80 text-sm">{user?.email}</p>
      </div>

      <div className="p-5 space-y-2">
        {menuItems.map((item, i) => (
          <div key={i} onClick={item.action} className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${item.bg} ${item.color} mr-4 flex-shrink-0`}>
              <item.icon size={20} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
            </div>
            {item.toggle !== undefined ? (
              <div className={`w-12 h-6 rounded-full relative transition-colors ${item.toggle ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${item.toggle ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            ) : (
              <ChevronRight size={18} className="text-slate-400" />
            )}
          </div>
        ))}

        <div onClick={logout} className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-4 active:bg-red-50 dark:bg-red-900/30 transition-colors cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 mr-4 flex-shrink-0">
            <LogOut size={20} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800 dark:text-slate-100">Logout</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign out of your account</div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </div>

      {showCurrencyModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Select Currency</h3>
              <button onClick={() => setShowCurrencyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-300 transition-colors">×</button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {['USD', 'EUR', 'GBP', 'TZS', 'KES', 'NGN', 'ZAR', 'INR'].map(curr => (
                <div 
                  key={curr} 
                  onClick={() => handleCurrencyChange(curr)}
                  className={`p-3 rounded-xl mb-1 cursor-pointer font-medium flex justify-between items-center transition-colors ${currency === curr ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700' : 'hover:bg-slate-50 dark:bg-slate-900 text-slate-700'}`}
                >
                  {curr}
                  {currency === curr && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AccountsModal isOpen={showAccountsModal} onClose={() => setShowAccountsModal(false)} />
      <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <NotificationsModal isOpen={showNotificationsModal} onClose={() => setShowNotificationsModal(false)} />
    </div>
  );
}
