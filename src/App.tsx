import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Analysis from './components/Analysis';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';
import { useStore } from './store';
import { LogIn, Key, Mail, Wallet } from 'lucide-react';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, hasFirebaseConfig } from './firebase';

export default function App() {
  const { isLoggedIn, pinLock, darkMode, login, logout, user, toggleDarkMode } = useStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const userIdentifier = email || 'Guest';
      const name = userIdentifier.includes('@') ? userIdentifier.split('@')[0] : userIdentifier;
      login({ email: userIdentifier, name });
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-5 text-white">
        <div className="w-24 h-24 rounded-full mb-6 shadow-xl border-4 border-white/20 bg-emerald-600 flex items-center justify-center">
          <Wallet size={48} className="text-white" />
        </div>
        <div className="text-3xl font-extrabold mb-2 text-center">Simzy Cash Saver</div>
        <div className="opacity-80 mb-8 text-center text-sm">Your Personal Digital Cash Book</div>
        
        <div className="w-full max-w-sm bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
          {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30">{error}</div>}
          
          <input 
            type="email" 
            placeholder={hasFirebaseConfig ? "Email Address" : "Enter a Name or Email to start"} 
            className={`w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 focus:outline-none focus:border-white ${hasFirebaseConfig ? 'mb-4' : 'mb-6'}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {hasFirebaseConfig && (
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 mb-6 focus:outline-none focus:border-white"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          )}

          {hasFirebaseConfig ? (
            <div className="space-y-3">
              <button 
                onClick={() => handleEmailAction(false)}
                disabled={loading}
                className="w-full bg-white text-emerald-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <LogIn size={20} /> SignIn with Email
              </button>
              <button 
                onClick={() => handleEmailAction(true)}
                disabled={loading}
                className="w-full bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
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
                className="w-full bg-white text-slate-800 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
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
          ) : (
            <button 
              onClick={() => handleEmailAction(false)}
              className="w-full bg-white text-emerald-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Access Offline App
            </button>
          )}
          
          <div className="mt-8 text-center text-xs opacity-60">
            {hasFirebaseConfig ? 'Cloud Sync Enabled' : 'Offline Mode (Local Storage)'}
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* PC / Desktop Navigation Sidebar & Main Content */}
      <div className="hidden md:flex min-h-screen">
        {/* Fixed Desktop Sidebar */}
        <aside className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-30 shadow-sm">
          <div>
            {/* Logo / Brand */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">Simzy Cash</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Cash Book & Saver</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-1.5">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appearance</span>
              <button
                onClick={toggleDarkMode}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 transition-colors"
              >
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>

            <div className="flex items-center gap-3 px-2 pt-1">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-sm uppercase shadow-sm">
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
        <main className="flex-1 ml-64 min-h-screen pb-12">
          {/* Top Desktop Bar */}
          <header className="sticky top-0 z-20 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight capitalize">
                {currentTab === 'dashboard' && 'Dashboard Overview'}
                {currentTab === 'transactions' && 'Cash Book Register'}
                {currentTab === 'analysis' && 'Financial Audit & Analytics'}
                {currentTab === 'goals' && 'Savings Goals Manager'}
                {currentTab === 'profile' && 'Profile & Accounts Settings'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Simzy Cash Saver • Professional PC Edition</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ready</span>
              </div>
            </div>
          </header>

          {/* Desktop Content Max Width Container */}
          <div className="p-8 max-w-7xl mx-auto">
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
