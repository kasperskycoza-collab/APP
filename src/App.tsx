import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Analysis from './components/Analysis';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';
import { useStore } from './store';
import { LogIn, Key, Mail } from 'lucide-react';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, hasFirebaseConfig } from './firebase';

export default function App() {
  const { isLoggedIn, pinLock, darkMode, login, logout } = useStore();
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
        <div className="text-4xl font-extrabold mb-2 text-center">Simzy Cash Saver</div>
        <div className="opacity-80 mb-10 text-center">Your Personal Digital Cash Book</div>
        
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

  return (
    <div className={`min-h-screen font-sans mx-auto max-w-md relative pb-16 shadow-2xl transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'transactions' && <Transactions />}
      {currentTab === 'analysis' && <Analysis />}
      {currentTab === 'goals' && <Goals />}
      {currentTab === 'profile' && <Profile />}
      
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}
