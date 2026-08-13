import React, { useState, useRef } from 'react';
import { 
  User, Wallet, Calculator, Coins, Tags, Moon, Lock, Bell, LogOut, 
  ChevronRight, Download, Upload, Cloud, DollarSign, Banknote, Palette, 
  Sun, Laptop, Check, Globe 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { useTranslation } from '../useTranslation';
import AccountsModal from './AccountsModal';
import BudgetModal from './BudgetModal';
import NotificationsModal from './NotificationsModal';
import ManageCategoriesModal from './ManageCategoriesModal';
import PinSetupModal from './PinSetupModal';
import CurrencyModal from './CurrencyModal';
import LanguageModal from './LanguageModal';
import { auth, db, hasFirebaseConfig } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ThemePalette, ThemeMode } from '../types';
import { CURRENCIES } from '../i18n';

export default function Profile() {
  const store = useStore();
  const { 
    user, 
    currency, 
    darkMode, 
    themePalette, 
    themeMode, 
    pinLock, 
    logout, 
    toggleDarkMode, 
    setThemePalette, 
    setThemeMode, 
    importData,
    notifications,
    language
  } = store;

  const { t } = useTranslation();
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePalette: ThemePalette = themePalette || 'dream';
  const activeMode: ThemeMode = themeMode || (darkMode ? 'dark' : 'light');

  const currentCurrencyObj = CURRENCIES.find(c => c.code === currency);
  const currencyFullDisplay = currentCurrencyObj 
    ? `${currentCurrencyObj.code} - ${language === 'sw' ? currentCurrencyObj.nameSw : currentCurrencyObj.nameEn}`
    : currency;

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
          const parsed = JSON.parse(content);
          if (parsed.state) {
             const success = importData(JSON.stringify(parsed.state));
             if (success) {
               alert(language === 'sw' ? 'Data zimeingizwa kikamilifu!' : 'Data imported successfully!');
               window.location.reload();
             } else {
               alert(language === 'sw' ? 'Muundo wa faili haufai.' : 'Invalid backup file structure.');
             }
          } else {
             alert(language === 'sw' ? 'Faili si sahihi.' : 'Invalid backup file.');
          }
        } catch (err) {
          alert(language === 'sw' ? 'Imeshindwa kusoma faili ya nakala.' : 'Failed to parse backup file.');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloudBackup = async () => {
    if (!hasFirebaseConfig || !auth?.currentUser || !db) {
      alert(language === 'sw' ? "Hifadhi ya mtandaoni haipatikani. Tafadhali ingia kwenye akaunti." : "Cloud backup is not available. Please login to an online account.");
      return;
    }
    try {
      const state = localStorage.getItem('simzy-storage');
      if (state) {
        await setDoc(doc(db, 'backups', auth.currentUser.uid), {
          data: state,
          updatedAt: new Date().toISOString()
        });
        alert(language === 'sw' ? "Imehifadhiwa kikamilifu kwenye Google Cloud Sync!" : "Successfully backed up to Google Cloud Sync!");
      }
    } catch (err) {
      alert(language === 'sw' ? "Imeshindwa kuhifadhi mtandaoni." : "Failed to backup to cloud.");
    }
  };

  const handleCloudRestore = async () => {
    if (!hasFirebaseConfig || !auth?.currentUser || !db) {
      alert(language === 'sw' ? "Urejeshaji wa mtandaoni haupatikani." : "Cloud restore is not available.");
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
            alert(language === 'sw' ? 'Data zimerejeshwa kutoka mtandaoni kikamilifu!' : 'Data restored from cloud successfully!');
            window.location.reload();
          } else {
            alert(language === 'sw' ? 'Data za mtandaoni si sahihi.' : 'Invalid cloud backup data.');
          }
        }
      } else {
        alert(language === 'sw' ? 'Hakuna nakala iliyopatikana mtandaoni.' : 'No cloud backup found.');
      }
    } catch (err) {
      alert(language === 'sw' ? "Imeshindwa kurejesha kutoka mtandaoni." : "Failed to restore from cloud.");
    }
  };

  const menuItems = [
    { 
      icon: Wallet, 
      label: t('myAccounts'), 
      desc: t('myAccountsDesc'), 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/30', 
      action: () => setShowAccountsModal(true) 
    },
    { 
      icon: Calculator, 
      label: t('budgetPlanning'), 
      desc: t('budgetPlanningDesc'), 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-900/30', 
      action: () => setShowBudgetModal(true) 
    },
    { 
      icon: Tags, 
      label: t('manageCategories'), 
      desc: t('manageCategoriesDesc'), 
      color: 'text-teal-600', 
      bg: 'bg-teal-50 dark:bg-teal-900/30', 
      action: () => setShowCategoriesModal(true) 
    },
    { 
      icon: Lock, 
      label: t('pinSecurity'), 
      desc: t('pinSecurityDesc'), 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/30', 
      action: () => setShowPinSetupModal(true), 
      toggle: pinLock 
    },
    { 
      icon: Cloud, 
      label: t('cloudSync'), 
      desc: t('cloudSyncDesc'), 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50 dark:bg-indigo-900/30', 
      action: handleCloudBackup 
    },
    { 
      icon: Cloud, 
      label: t('cloudRestore'), 
      desc: t('cloudRestoreDesc'), 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50 dark:bg-indigo-900/30', 
      action: handleCloudRestore 
    },
    { 
      icon: Download, 
      label: t('exportBackup'), 
      desc: t('exportBackupDesc'), 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-900/30', 
      action: handleExportData 
    },
    { 
      icon: Upload, 
      label: t('importBackup'), 
      desc: t('importBackupDesc'), 
      color: 'text-amber-600', 
      bg: 'bg-amber-50 dark:bg-amber-900/30', 
      action: () => fileInputRef.current?.click() 
    },
    { 
      icon: Moon, 
      label: t('darkThemeQuick'), 
      desc: darkMode ? (language === 'sw' ? 'Mandhari Meusi' : 'Dark Mode') : (language === 'sw' ? 'Mandhari Meupe' : 'Light Mode'), 
      color: 'text-slate-600 dark:text-slate-300', 
      bg: 'bg-slate-100 dark:bg-slate-800', 
      toggle: darkMode, 
      action: toggleDarkMode 
    },
    { 
      icon: Bell, 
      label: t('notifications'), 
      desc: notifications?.reminders 
        ? (language === 'sw' ? 'Imewashwa • Vikumbusho & Tahadhari' : 'Active • Reminders & alerts') 
        : (language === 'sw' ? 'Imezimwa' : 'Disabled'), 
      color: 'text-purple-600', 
      bg: 'bg-purple-50 dark:bg-purple-900/30', 
      action: () => setShowNotificationsModal(true) 
    },
    { 
      icon: Coins, 
      label: t('currencySettings'), 
      desc: currencyFullDisplay, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50 dark:bg-amber-900/30', 
      action: () => setShowCurrencyModal(true) 
    },
    { 
      icon: Palette, 
      label: t('themeVisualStyling'), 
      desc: `${activePalette === 'ubuntu' ? 'Ubuntu 26.04' : 'Dream (Classic)'} • ${activeMode.toUpperCase()}`, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50 dark:bg-orange-900/30', 
      action: () => setShowThemeModal(true) 
    },
    { 
      icon: Globe, 
      label: t('languageSettings'), 
      desc: language === 'sw' ? '🇹🇿 Kiswahili (Tanzania)' : '🇬🇧 English (United Kingdom)', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/30', 
      action: () => setShowLanguageModal(true) 
    },
  ];

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
              <span className={`w-1.5 h-1.5 rounded-full ${activePalette === 'ubuntu' ? 'bg-[#E95420]' : 'bg-emerald-300'}`}></span>
              {activePalette === 'ubuntu' ? 'Simzy • Ubuntu Edition' : 'Simzy Cash Saver Pro'}
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight">
              {user?.firstName && user?.surname ? `${user.firstName} ${user.surname}` : user?.name || (language === 'sw' ? 'Mtumiaji wa Simzy' : 'Valued User')}
            </h2>
            <p className="opacity-80 text-xs font-medium truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Floating Cash & Dollar Signs Animation */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pr-0.5 sm:pr-1 pointer-events-none select-none flex-shrink-0">
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/15 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/25 flex items-center justify-center shadow-sm text-white"
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [6, -6, 6] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/15 backdrop-blur-md rounded-xl border border-white/25 flex items-center justify-center shadow-sm text-white"
          >
            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -5, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white/25 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/35 flex items-center justify-center shadow-md font-black text-xs sm:text-sm text-white"
          >
            {currentCurrencyObj?.symbol || '$'}
          </motion.div>
        </div>
      </div>

      {/* Menu Settings Grid */}
      <div>
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
                <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${item.toggle ? (activePalette === 'ubuntu' ? 'bg-[#E95420]' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${item.toggle ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              ) : (
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              )}
            </div>
          ))}

          {/* Account Session Logout */}
          <div 
            onClick={handleLogout} 
            className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mr-4 flex-shrink-0 group-hover:scale-105 transition-transform">
              <LogOut size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('logout')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'sw' ? 'Ondoka kwenye akaunti yako' : 'Sign out of your account'}</div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activePalette === 'ubuntu'
                    ? 'bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420]'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{t('themeVisualStyling')}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('themeDesc')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowThemeModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Palette Selection */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {language === 'sw' ? 'Aina ya Mandhari' : 'Theme Palette Category'}
                </h4>
                <div className="space-y-2.5">
                  {/* Dream */}
                  <div
                    onClick={() => setThemePalette('dream')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                      activePalette === 'dream'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
                        DR
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Dream (Default Classic)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{language === 'sw' ? 'Kijani kibichi, teal na rangi safi' : 'Emerald green, teal & clean slate tones'}</div>
                      </div>
                    </div>
                    {activePalette === 'dream' && <Check size={18} className="text-emerald-600 dark:text-emerald-400 font-bold" />}
                  </div>

                  {/* Ubuntu 26.04 */}
                  <div
                    onClick={() => setThemePalette('ubuntu')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                      activePalette === 'ubuntu'
                        ? 'border-[#E95420] bg-[#FFF2EB] dark:bg-[#383838] ring-1 ring-[#E95420]/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E95420] via-[#77216F] to-[#2C001E] flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
                        UB
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>Ubuntu 26.04 LTS</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#E95420] text-white">NEW</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'sw' ? 'Rangi 8 Rasmi: Chungwa, Aubergine, Zambarau, Kijivu' : '8 Official Colours: Orange, Aubergine, Deep Purple, Charcoal'}</div>
                        
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#E95420' }} title="Ubuntu Orange #E95420" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#77216F' }} title="Ubuntu Aubergine #77216F" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#5E2750' }} title="Dark Aubergine #5E2750" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#2C001E' }} title="Deep Purple #2C001E" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#FFFFFF' }} title="White #FFFFFF" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#EBEBEB' }} title="Light Gray #EBEBEB" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#2D2D2D' }} title="Dark Gray #2D2D2D" />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: '#383838' }} title="Charcoal #383838" />
                        </div>
                      </div>
                    </div>
                    {activePalette === 'ubuntu' && <Check size={18} className="text-[#E95420] font-bold flex-shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {language === 'sw' ? 'Hali ya Muonekano' : 'Appearance Mode'}
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                      activeMode === 'light'
                        ? (activePalette === 'ubuntu'
                            ? 'border-[#E95420] bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] dark:text-[#E95420] ring-1 ring-[#E95420]/40 shadow-sm'
                            : 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-sm')
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Sun size={20} className="text-amber-500" />
                    <span>{language === 'sw' ? 'Mweupe' : 'Light'}</span>
                  </button>

                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                      activeMode === 'dark'
                        ? (activePalette === 'ubuntu'
                            ? 'border-[#E95420] bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] dark:text-[#E95420] ring-1 ring-[#E95420]/40 shadow-sm'
                            : 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-sm')
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Moon size={20} className="text-indigo-400" />
                    <span>{language === 'sw' ? 'Mweusi' : 'Dark'}</span>
                  </button>

                  <button
                    onClick={() => setThemeMode('system')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                      activeMode === 'system'
                        ? (activePalette === 'ubuntu'
                            ? 'border-[#E95420] bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] dark:text-[#E95420] ring-1 ring-[#E95420]/40 shadow-sm'
                            : 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-sm')
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Laptop size={20} className={activePalette === 'ubuntu' ? 'text-[#E95420]' : 'text-emerald-500'} />
                    <span>{language === 'sw' ? 'Kifaa (Auto)' : 'System Auto'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                💡 <span className="font-semibold">{language === 'sw' ? 'Kidokezo:' : 'Tip:'}</span> {language === 'sw' ? 'Mandhari na muonekano uliyochagua vinahifadhiwa kiotomatiki kwa vifaa vyako vyote.' : 'Your selected theme and appearance mode are automatically preserved across all your sessions and devices.'}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setShowThemeModal(false)}
                className={`px-5 py-2 rounded-xl text-white font-bold text-sm shadow-sm transition-colors cursor-pointer ${
                  activePalette === 'ubuntu'
                    ? 'bg-[#E95420] hover:bg-[#D14818]'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {t('applyAndDone')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CurrencyModal isOpen={showCurrencyModal} onClose={() => setShowCurrencyModal(false)} />
      <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      <AccountsModal isOpen={showAccountsModal} onClose={() => setShowAccountsModal(false)} />
      <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <NotificationsModal isOpen={showNotificationsModal} onClose={() => setShowNotificationsModal(false)} />
      <ManageCategoriesModal isOpen={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
      <PinSetupModal isOpen={showPinSetupModal} onClose={() => setShowPinSetupModal(false)} />

      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportData} />
    </div>
  );
}
