import React, { useState, useRef } from 'react';
import { User, Wallet, Calculator, Coins, Tags, Moon, Lock, Bell, LogOut, ChevronRight, Download, Upload, Cloud, DollarSign, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import AccountsModal from './AccountsModal';
import BudgetModal from './BudgetModal';
import NotificationsModal from './NotificationsModal';
import ManageCategoriesModal from './ManageCategoriesModal';
import PinSetupModal from './PinSetupModal';
import { auth, db, hasFirebaseConfig } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Profile() {
  const store = useStore();
  const { user, currency, darkMode, pinLock, setCurrency, logout, toggleDarkMode, togglePinLock, importData } = store;
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const data = localStorage.getItem('simzy-storage');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simzy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Parse structure inside persistent storage
          const parsed = JSON.parse(content);
          if (parsed.state) {
             const success = importData(JSON.stringify(parsed.state));
             if (success) {
               alert('Data imported successfully!');
               window.location.reload();
             } else {
               alert('Invalid backup file structure.');
             }
          } else {
             alert('Invalid backup file.');
          }
        } catch (err) {
          alert('Failed to parse backup file.');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloudBackup = async () => {
    if (!hasFirebaseConfig || !auth?.currentUser || !db) {
      alert("Cloud backup is not available. Please login to an online account.");
      return;
    }
    try {
      const state = localStorage.getItem('simzy-storage');
      if (state) {
        await setDoc(doc(db, 'backups', auth.currentUser.uid), {
          data: state,
          updatedAt: new Date().toISOString()
        });
        alert("Successfully backed up to Google Cloud Sync!");
      }
    } catch (err) {
      alert("Failed to backup to cloud.");
    }
  };

  const handleCloudRestore = async () => {
    if (!hasFirebaseConfig || !auth?.currentUser || !db) {
      alert("Cloud restore is not available.");
      return;
    }
    try {
      const docSnap = await getDoc(doc(db, 'backups', auth.currentUser.uid));
      if (docSnap.exists()) {
        const stateStr = docSnap.data().data;
        const parsed = JSON.parse(stateStr);
        if (parsed.state) {
          const success = importData(JSON.stringify(parsed.state));
          if (success) {
            alert('Data restored from cloud successfully!');
            window.location.reload();
          } else {
            alert('Invalid cloud backup data.');
          }
        }
      } else {
        alert('No cloud backup found.');
      }
    } catch (err) {
      alert("Failed to restore from cloud.");
    }
  };

  const menuItems = [
    { icon: Wallet, label: 'My Accounts', desc: 'Manage multiple savings accounts', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', action: () => setShowAccountsModal(true) },
    { icon: Calculator, label: 'Budget Planning', desc: 'Set monthly spending limits', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30', action: () => setShowBudgetModal(true) },
    { icon: Coins, label: 'Currency Settings', desc: `Default: ${currency}`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/30', action: () => setShowCurrencyModal(true) },
    { icon: Tags, label: 'Manage Categories', desc: 'Add, edit, or delete categories', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', action: () => setShowCategoriesModal(true) },
    { icon: Cloud, label: 'Cloud Sync', desc: 'Backup to Google Cloud', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', action: handleCloudBackup },
    { icon: Cloud, label: 'Cloud Restore', desc: 'Restore from Google Cloud', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', action: handleCloudRestore },
    { icon: Moon, label: 'Dark Mode', desc: 'Toggle appearance', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', toggle: darkMode, action: toggleDarkMode },
    { icon: Lock, label: 'PIN Lock', desc: 'Secure app with 4-digit PIN', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30 dark:bg-emerald-900/30', action: () => setShowPinSetupModal(true), toggle: pinLock },
    { icon: Download, label: 'Export Backup', desc: 'Save data to a file', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30 dark:bg-blue-900/30', action: handleExportData },
    { icon: Upload, label: 'Import Backup', desc: 'Restore data from a file', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30 dark:bg-amber-900/30', action: () => fileInputRef.current?.click() },
    { icon: Bell, label: 'Notifications', desc: 'Reminders & alerts', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', action: () => setShowNotificationsModal(true) },
  ];

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    setShowCurrencyModal(false);
  };

  const handleLogout = async () => {
    if (auth && hasFirebaseConfig) {
      await auth.signOut();
    }
    logout();
  };

  return (
    <div className="pb-24 md:pb-8 space-y-5">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-md relative z-10 overflow-hidden flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/10 dark:bg-slate-800/20 rounded-full border-2 border-white/30 flex items-center justify-center text-white overflow-hidden flex-shrink-0 shadow-inner">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={26} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/20 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              Simzy Cash Saver Pro
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight">{user?.name}</h2>
            <p className="opacity-80 text-xs font-medium truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Floating Cash & Dollar Signs Animation (Desktop Only) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 pr-1 pointer-events-none select-none flex-shrink-0">
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 backdrop-blur-md rounded-xl border border-white/25 flex items-center justify-center shadow-sm text-emerald-100"
          >
            <DollarSign size={18} />
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0], rotate: [6, -6, 6] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 backdrop-blur-md rounded-xl border border-white/25 flex items-center justify-center shadow-sm text-emerald-100"
          >
            <Banknote size={18} />
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/25 backdrop-blur-md rounded-xl border border-white/35 flex items-center justify-center shadow-md font-black text-sm text-emerald-100"
          >
            $
          </motion.div>

          <motion.div
            animate={{ y: [0, -9, 0], rotate: [-10, 10, -10] }}
            transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 backdrop-blur-md rounded-xl border border-white/25 flex items-center justify-center shadow-sm text-emerald-100 hidden sm:flex"
          >
            <Coins size={18} />
          </motion.div>
        </div>
      </div>

      {/* Menu Settings Grid */}
      <div className="p-5 md:p-0">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 hidden md:block">
          App Settings & Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {menuItems.map((item, i) => (
            <div 
              key={i} 
              onClick={item.action} 
              className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${item.bg} ${item.color} mr-4 flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <item.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.desc}</div>
              </div>
              {item.toggle !== undefined ? (
                <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${item.toggle ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${item.toggle ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              ) : (
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              )}
            </div>
          ))}

          <div 
            onClick={handleLogout} 
            className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mr-4 flex-shrink-0 group-hover:scale-105 transition-transform">
              <LogOut size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Logout</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign out of your account</div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>
      </div>

      {showCurrencyModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-5 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Select Currency</h3>
              <button onClick={() => setShowCurrencyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:text-slate-400 hover:bg-slate-300 transition-colors">×</button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
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

      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportData} />

      <AccountsModal isOpen={showAccountsModal} onClose={() => setShowAccountsModal(false)} />
      <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <NotificationsModal isOpen={showNotificationsModal} onClose={() => setShowNotificationsModal(false)} />
      <ManageCategoriesModal isOpen={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
      <PinSetupModal isOpen={showPinSetupModal} onClose={() => setShowPinSetupModal(false)} />
    </div>
  );
}
