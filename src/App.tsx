import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Analysis from './components/Analysis';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';
import { useStore } from './store';
import { useTranslation } from './useTranslation';
import { LogIn, Target, Mail, Wallet, User, UserPlus, UserCheck, AlertCircle, PieChart, Book, Home } from 'lucide-react';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, hasFirebaseConfig } from './firebase';

export default function App() {
  const { 
    isLoggedIn, 
    pinLock, 
    darkMode, 
    themePalette, 
    themeMode, 
    login, 
    logout, 
    user, 
    setThemeMode, 
    registerOfflineUser, 
    accessOfflineUser, 
    registeredUsers 
  } = useStore();

  const { t, language } = useTranslation();
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // System theme preference detection
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const activeMode = themeMode || (darkMode ? 'dark' : 'light');
  const isEffectiveDark = activeMode === 'system' ? systemPrefersDark : activeMode === 'dark';
  const activePalette = themePalette || 'dream';
  const isUbuntu = activePalette === 'ubuntu';

  // Apply theme classes to document root so modals and portals inherit them
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isEffectiveDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (activePalette === 'ubuntu') {
      root.classList.add('theme-ubuntu');
      root.classList.remove('theme-dream');
    } else {
      root.classList.add('theme-dream');
      root.classList.remove('theme-ubuntu');
    }
  }, [isEffectiveDark, activePalette]);
  
  // Firebase Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Offline Account states
  const [offlineTab, setOfflineTab] = useState<'register' | 'access'>('register');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [offlineEmail, setOfflineEmail] = useState('');
  const [offlineError, setOfflineError] = useState('');

  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          login({
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || undefined,
            id: user.uid
          });
        }
      });
      return () => unsubscribe();
    }
  }, [login]);

  const handleGoogleLogin = async () => {
    if (!auth || !provider) return;
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (isSignUp: boolean) => {
    if (!hasFirebaseConfig) {
      return;
    }
    if (!auth || !email || !password) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfflineError('');
    const res = registerOfflineUser(firstName, surname, offlineEmail);
    if (!res.success) {
      setOfflineError(res.error || (language === 'sw' ? 'Imeshindwa kusajili akaunti' : 'Failed to register account'));
    }
  };

  const handleAccessOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfflineError('');
    const res = accessOfflineUser(offlineEmail);
    if (!res.success) {
      setOfflineError(res.error || (language === 'sw' ? 'Imeshindwa kuingia kwenye akaunti' : 'Failed to access account'));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center">
          <Wallet size={44} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1 text-center tracking-tight">Simzy Cash Saver</h1>
        <p className="opacity-80 mb-6 text-center text-xs sm:text-sm font-medium">
          {language === 'sw' ? 'Daftari Lako la Fedha na Ukaguzi wa Kifedha' : 'Your Personal Digital Cash Book & Financial Audit'}
        </p>
        
        <div className="w-full max-w-md bg-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          
          {hasFirebaseConfig ? (
            <div>
              {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30">{error}</div>}
              
              <input 
                type="email" 
                placeholder={language === 'sw' ? 'Barua Pepe' : 'Email Address'} 
                className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 focus:outline-none focus:border-white mb-4"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder={language === 'sw' ? 'Nenosiri' : 'Password'} 
                className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 mb-6 focus:outline-none focus:border-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <div className="space-y-3">
                <button 
                  onClick={() => handleEmailAction(false)}
                  disabled={loading}
                  className="w-full bg-white text-emerald-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  <LogIn size={20} /> {language === 'sw' ? 'Ingia na Barua Pepe' : 'SignIn with Email'}
                </button>
                <button 
                  onClick={() => handleEmailAction(true)}
                  disabled={loading}
                  className="w-full bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  <Mail size={20} /> {language === 'sw' ? 'Sajili Barua Pepe' : 'Register Email'}
                </button>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-white/30 flex-1"></div>
                  <span className="text-sm opacity-70">{language === 'sw' ? 'au endelea na' : 'or continue with'}</span>
                  <div className="h-px bg-white/30 flex-1"></div>
                </div>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white text-slate-800 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
                >
                  <svg className="w-5 h-5 col-auto shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab Switcher for Offline Mode */}
              <div className="grid grid-cols-2 p-1 bg-black/20 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setOfflineTab('register'); setOfflineError(''); }}
                  className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    offlineTab === 'register'
                      ? 'bg-white text-emerald-800 shadow-md font-extrabold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <UserPlus size={15} />
                  <span>{language === 'sw' ? 'Akaunti Mpya' : 'New Account'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setOfflineTab('access'); setOfflineError(''); }}
                  className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    offlineTab === 'access'
                      ? 'bg-white text-emerald-800 shadow-md font-extrabold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <UserCheck size={15} />
                  <span>{language === 'sw' ? 'Ingia Iliyopo' : 'Access Existing'}</span>
                </button>
              </div>

              {/* Error Box */}
              {offlineError && (
                <div className="bg-rose-500/25 text-rose-100 p-3 rounded-xl text-xs flex items-start gap-2.5 border border-rose-400/40 animate-in fade-in">
                  <AlertCircle size={16} className="text-rose-300 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{offlineError}</span>
                </div>
              )}

              {offlineTab === 'register' ? (
                <form onSubmit={handleRegisterOfflineSubmit} className="space-y-3.5">
                  <div className="text-center pb-1">
                    <h3 className="text-sm font-bold text-emerald-100">{language === 'sw' ? 'Sajili Akaunti ya Ndani' : 'Register Offline Account'}</h3>
                    <p className="text-[11px] opacity-75">{language === 'sw' ? 'Weka taarifa zako kuunda wasifu binafsi.' : 'Enter your details to create a unique local profile.'}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1">
                      <User size={12} /> {language === 'sw' ? 'Jina la Kwanza' : 'First Name'} <span className="text-rose-300">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Erick" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl p-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); setOfflineError(''); }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1">
                      <User size={12} /> {language === 'sw' ? 'Jina la Ukoo' : 'Surname / Last Name'} <span className="text-rose-300">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Paul" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl p-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                      value={surname}
                      onChange={e => { setSurname(e.target.value); setOfflineError(''); }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1">
                      <Mail size={12} /> {language === 'sw' ? 'Barua Pepe Sahihi' : 'Valid Email Address'} <span className="text-rose-300">*</span>
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. user@example.com" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl p-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                      value={offlineEmail}
                      onChange={e => { setOfflineEmail(e.target.value); setOfflineError(''); }}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 bg-white text-emerald-800 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <UserPlus size={18} />
                    <span>{language === 'sw' ? 'Sajili na Fungua Programu' : 'Register & Access Offline App'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAccessOfflineSubmit} className="space-y-3.5">
                  <div className="text-center pb-1">
                    <h3 className="text-sm font-bold text-emerald-100">{language === 'sw' ? 'Ingia kwenye Akaunti Iliyopo' : 'Sign In to Existing Offline Account'}</h3>
                    <p className="text-[11px] opacity-75">{language === 'sw' ? 'Weka barua pepe uliyosajili kufungua daftari lako.' : 'Enter your registered email address to access your cash book.'}</p>
                  </div>

                  {registeredUsers && registeredUsers.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        {language === 'sw' ? 'Akaunti Zilizohifadhiwa:' : 'Saved Offline Accounts:'}
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-black/20 rounded-xl border border-white/10 custom-scrollbar">
                        {registeredUsers.map(u => (
                          <button
                            key={u.email}
                            type="button"
                            onClick={() => { setOfflineEmail(u.email); setOfflineError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              offlineEmail.toLowerCase() === u.email.toLowerCase()
                                ? 'bg-emerald-500 text-white shadow-sm border border-emerald-300'
                                : 'bg-white/20 hover:bg-white/30 text-white'
                            }`}
                          >
                            <User size={12} />
                            <span>{u.firstName} {u.surname} ({u.email})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1">
                      <Mail size={12} /> {language === 'sw' ? 'Barua Pepe Iliyosajiliwa' : 'Registered Email Address'} <span className="text-rose-300">*</span>
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. user@example.com" 
                      className="w-full bg-white/20 border border-white/30 rounded-xl p-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                      value={offlineEmail}
                      onChange={e => { setOfflineEmail(e.target.value); setOfflineError(''); }}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 bg-white text-emerald-800 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <LogIn size={18} />
                    <span>{language === 'sw' ? 'Fungua Akaunti ya Ndani' : 'Access Offline Account'}</span>
                  </button>
                </form>
              )}

            </div>
          )}
          
          <div className="mt-6 text-center text-[11px] opacity-60 font-medium border-t border-white/10 pt-3">
            {hasFirebaseConfig 
              ? (language === 'sw' ? 'Usawazishaji wa Mtandaoni Umewashwa' : 'Cloud Sync Enabled') 
              : (language === 'sw' ? 'Hali ya Nje ya Mtandao (Uhifadhi Salama wa Kifaa)' : 'Offline Mode (Local Storage Persistence)')}
          </div>
        </div>
      </div>
    );
  }

  if (pinLock && !isUnlocked) {
    return <PinScreen onSuccess={() => setIsUnlocked(true)} onBack={logout} />;
  }

  const activeTabClass = isUbuntu
    ? 'bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] border-[#FCD2C2] dark:border-[#5E2750] shadow-sm'
    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm';

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden max-w-full ${isEffectiveDark ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'} ${activePalette === 'ubuntu' ? 'theme-ubuntu' : 'theme-dream'}`}>
      
      {/* PC / Desktop Navigation Sidebar & Main Content */}
      <div className="hidden md:flex min-h-screen max-w-full overflow-x-hidden">
        {/* Fixed Desktop Sidebar */}
        <aside className="w-56 lg:w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 shadow-sm">
          <div>
            {/* Logo / Brand */}
            <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 ${
                isUbuntu ? 'bg-[#E95420]' : 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20'
              }`}>
                <Wallet size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate">Simzy Cash</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isUbuntu ? 'text-[#E95420]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {activePalette === 'ubuntu' ? 'Ubuntu 26.04' : 'Cash Book & Saver'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 lg:p-4 space-y-1.5">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'dashboard'
                    ? activeTabClass
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Home size={18} />
                <span>{t('navDashboard')}</span>
              </button>

              <button
                onClick={() => setCurrentTab('transactions')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'transactions'
                    ? activeTabClass
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Book size={18} />
                <span>{t('navTransactions')}</span>
              </button>

              <button
                onClick={() => setCurrentTab('analysis')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'analysis'
                    ? activeTabClass
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <PieChart size={18} />
                <span>{t('navAudit')}</span>
              </button>

              <button
                onClick={() => setCurrentTab('goals')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'goals'
                    ? activeTabClass
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Target size={18} />
                <span>{t('navGoals')}</span>
              </button>

              <button
                onClick={() => setCurrentTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'profile'
                    ? activeTabClass
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <User size={18} />
                <span>{t('navProfile')}</span>
              </button>
            </nav>
          </div>

          {/* User badge & Appearance Mode at bottom of sidebar */}
          <div className="p-3 lg:p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
            {/* Mode Switcher Box */}
            <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/70 p-2 lg:p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === 'sw' ? 'Hali' : 'Mode'}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${activeMode === 'light' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-500 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Light Mode"
                >
                  <span>☀️</span>
                  <span className="text-[10px] hidden lg:inline">{language === 'sw' ? 'Mchana' : 'Light'}</span>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${activeMode === 'dark' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-400 font-bold border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Dark Mode"
                >
                  <span>🌙</span>
                  <span className="text-[10px] hidden lg:inline">{language === 'sw' ? 'Usiku' : 'Dark'}</span>
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${activeMode === 'system' ? (isUbuntu ? 'bg-white dark:bg-slate-800 shadow-sm text-[#E95420] font-bold border border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 shadow-sm text-emerald-500 font-bold border border-slate-200 dark:border-slate-700') : 'text-slate-400 hover:text-slate-600'}`}
                  title="System Auto Mode"
                >
                  <span>⚙️</span>
                  <span className="text-[10px] hidden lg:inline">Auto</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 lg:gap-3 px-1 pt-0.5">
              <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-extrabold text-sm uppercase shadow-sm flex-shrink-0 ${
                isUbuntu ? 'bg-[#FFF2EB] text-[#E95420] dark:bg-[#383838]' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
              }`}>
                {user?.name?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email || (language === 'sw' ? 'Hali ya Kifaa' : 'Offline mode')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Pane */}
        <main className="flex-1 ml-56 lg:ml-64 min-h-screen pb-12 min-w-0 max-w-full overflow-x-hidden">
          {/* Top Desktop Bar */}
          <header className="sticky top-0 z-20 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 px-4 md:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            <div>
              <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight capitalize">
                {currentTab === 'dashboard' && t('dashboardOverview')}
                {currentTab === 'transactions' && t('cashBookRegister')}
                {currentTab === 'analysis' && t('auditAnalytics')}
                {currentTab === 'goals' && t('savingsGoalsManager')}
                {currentTab === 'profile' && t('profileTitle')}
              </h2>
              <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400">
                Simzy Cash Saver • {activePalette === 'ubuntu' ? 'Ubuntu 26.04 Edition' : (language === 'sw' ? 'Toleo Rasmi' : 'Professional Edition')}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                isUbuntu 
                  ? 'bg-[#FFF2EB] dark:bg-[#383838] text-[#E95420] border-[#FCD2C2] dark:border-[#5E2750]' 
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isUbuntu ? 'bg-[#E95420]' : 'bg-emerald-500'}`}></span>
                <span>{language === 'sw' ? '🇹🇿 Kiswahili' : '🇬🇧 English'}</span>
              </div>
            </div>
          </header>

          {/* Desktop Content Max Width Container */}
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'transactions' && <Transactions />}
            {currentTab === 'analysis' && <Analysis />}
            {currentTab === 'goals' && <Goals />}
            {currentTab === 'profile' && <Profile />}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden mx-auto max-w-md relative pb-16 min-h-screen shadow-2xl bg-slate-100 dark:bg-slate-900">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'transactions' && <Transactions />}
        {currentTab === 'analysis' && <Analysis />}
        {currentTab === 'goals' && <Goals />}
        {currentTab === 'profile' && <Profile />}
        
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>

    </div>
  );
}
