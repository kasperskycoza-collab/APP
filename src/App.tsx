import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Analysis from './components/Analysis';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';
import { useStore } from './store';
import { LogIn, Key, Mail, Wallet, User, UserPlus, UserCheck, AlertCircle } from 'lucide-react';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, hasFirebaseConfig } from './firebase';

export default function App() {
  const { isLoggedIn, pinLock, darkMode, login, logout, user, toggleDarkMode, registerOfflineUser, accessOfflineUser, registeredUsers, processRecurringTransactions } = useStore();
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    processRecurringTransactions();
  }, [processRecurringTransactions]);
  
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
      setOfflineError(res.error || 'Failed to register account');
    }
  };

  const handleAccessOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfflineError('');
    const res = accessOfflineUser(offlineEmail);
    if (!res.success) {
      setOfflineError(res.error || 'Failed to access account');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center">
          <Wallet size={44} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1 text-center tracking-tight">Simzy Cash Saver</h1>
        <p className="opacity-80 mb-6 text-center text-xs sm:text-sm font-medium">Your Personal Digital Cash Book & Financial Audit</p>
        
        <div className="w-full max-w-md bg-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          
          {hasFirebaseConfig ? (
            <div>
              {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30">{error}</div>}
              
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 focus:outline-none focus:border-white mb-4"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password" 
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
                  <LogIn size={20} /> SignIn with Email
                </button>
                <button 
                  onClick={() => handleEmailAction(true)}
                  disabled={loading}
                  className="w-full bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  <Mail size={20} /> Register Email
                </button>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-white/30 flex-1"></div>
                  <span className="text-sm opacity-70">or continue with</span>
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
                  <span>New Offline Account</span>
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
                  <span>Access Existing</span>
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
                    <h3 className="text-sm font-bold text-emerald-100">Register Offline Account</h3>
                    <p className="text-[11px] opacity-75">Enter your details to create a unique local profile.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1">
                      <User size={12} /> First Name <span className="text-rose-300">*</span>
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
                      <User size={12} /> Surname / Last Name <span className="text-rose-300">*</span>
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
                      <Mail size={12} /> Valid Email Address <span className="text-rose-300">*</span>
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
                    <span>Register & Access Offline App</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAccessOfflineSubmit} className="space-y-3.5">
                  <div className="text-center pb-1">
                    <h3 className="text-sm font-bold text-emerald-100">Sign In to Existing Offline Account</h3>
                    <p className="text-[11px] opacity-75">Enter your registered email address to access your cash book.</p>
                  </div>

                  {registeredUsers && registeredUsers.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        Saved Offline Accounts:
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
                      <Mail size={12} /> Registered Email Address <span className="text-rose-300">*</span>
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
                    <span>Access Offline Account</span>
                  </button>
                </form>
              )}

            </div>
          )}
          
          <div className="mt-6 text-center text-[11px] opacity-60 font-medium border-t border-white/10 pt-3">
            {hasFirebaseConfig ? 'Cloud Sync Enabled' : 'Offline Mode (Local Storage Persistence)'}
          </div>
        </div>
      </div>
    );
  }

  if (pinLock && !isUnlocked) {
    return <PinScreen onSuccess={() => setIsUnlocked(true)} onBack={logout} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'transactions', label: 'Cash Book', icon: Key }, // or other Lucide icon
    { id: 'analysis', label: 'Audit Analytics', icon: LogIn },
    { id: 'goals', label: 'Savings Goals', icon: Wallet },
    { id: 'profile', label: 'Profile & Settings', icon: Mail },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 overflow-x-hidden max-w-full ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* PC / Desktop Navigation Sidebar & Main Content */}
      <div className="hidden md:flex min-h-screen max-w-full overflow-x-hidden">
        {/* Fixed Desktop Sidebar */}
        <aside className="w-56 lg:w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 shadow-sm">
          <div>
            {/* Logo / Brand */}
            <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Wallet size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate">Simzy Cash</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate">Cash Book & Saver</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 lg:p-4 space-y-1.5">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Wallet size={18} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('transactions')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'transactions'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <LogIn size={18} className="rotate-90" />
                <span>Cash Book</span>
              </button>

              <button
                onClick={() => setCurrentTab('analysis')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'analysis'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Mail size={18} />
                <span>Audit Analytics</span>
              </button>

              <button
                onClick={() => setCurrentTab('goals')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'goals'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Key size={18} />
                <span>Savings Goals</span>
              </button>

              <button
                onClick={() => setCurrentTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-bold transition-all ${
                  currentTab === 'profile'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Wallet size={18} />
                <span>Settings & Profile</span>
              </button>
            </nav>
          </div>

          {/* User badge & Appearance Toggle at bottom of sidebar */}
          <div className="p-3 lg:p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2 lg:p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appearance</span>
              <button
                onClick={toggleDarkMode}
                className="text-xs font-bold px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 transition-colors"
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 lg:gap-3 px-2 pt-1">
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-sm uppercase shadow-sm flex-shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email || 'Offline mode'}</p>
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
                {currentTab === 'dashboard' && 'Dashboard Overview'}
                {currentTab === 'transactions' && 'Cash Book Register'}
                {currentTab === 'analysis' && 'Financial Audit & Analytics'}
                {currentTab === 'goals' && 'Savings Goals Manager'}
                {currentTab === 'profile' && 'Profile & Accounts Settings'}
              </h2>
              <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400">Simzy Cash Saver • Professional Edition</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ready</span>
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
