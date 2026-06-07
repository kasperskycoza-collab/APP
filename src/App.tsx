import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Analysis from './components/Analysis';
import BottomNav from './components/BottomNav';
import PinScreen from './components/PinScreen';
import { useStore } from './store';
import { LogIn } from 'lucide-react';

export default function App() {
  const { isLoggedIn, pinLock, darkMode, login } = useStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (!isLoggedIn) {
// OMITTING AUTH SCREEN FOR BREVITY IN DIFF BUT KEEPING LOGIC UNCHANGED
    return (
      <div className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-5 text-white">
        <div className="text-4xl font-extrabold mb-2 text-center">Simzy Cash Saver</div>
        <div className="opacity-80 mb-10 text-center">Your Personal Digital Cash Book</div>
        
        <div className="w-full max-w-sm bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 mb-4 focus:outline-none focus:border-white"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-white/60 mb-6 focus:outline-none focus:border-white"
          />
          <button 
            onClick={() => email && login(email)}
            className="w-full bg-white text-emerald-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Sign In
          </button>
          
          <div className="mt-6 text-center text-sm opacity-80">
            <button onClick={() => login('offline@simzy.com')}>Use Offline</button>
          </div>
        </div>
      </div>
    );
  }

  if (pinLock && !isUnlocked) {
    return <PinScreen onSuccess={() => setIsUnlocked(true)} />;
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
