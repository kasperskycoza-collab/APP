import { useState } from 'react';
import { useStore } from '../store';
import { Delete, Lock, Sun, Moon } from 'lucide-react';

interface PinScreenProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export default function PinScreen({ onSuccess, onBack }: PinScreenProps) {
  const { pin, darkMode, themePalette, themeMode, toggleDarkMode } = useStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const expectedPin = pin || '1234';

  const handleKeyPress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      setError(false);

      if (newInput.length === 4) {
        if (newInput === expectedPin) {
          setTimeout(onSuccess, 200);
        } else {
          setError(true);
          setTimeout(() => setInput(''), 400);
        }
      }
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
    setError(false);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-5 relative transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 md:bg-slate-100 text-slate-900'} ${themePalette === 'ubuntu' ? 'theme-ubuntu' : 'theme-dream'}`}>
      
      {/* Top Controls: Back & Theme Toggle (Theme toggle desktop-only) */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
        {onBack ? (
          <button 
            onClick={onBack} 
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs shadow-sm transition-all"
          >
            ← Back
          </button>
        ) : <div />}

        <button 
          onClick={toggleDarkMode} 
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all hidden md:flex items-center justify-center"
          title="Toggle Dark / Light Mode"
        >
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
        </button>
      </div>

      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200/50 dark:border-emerald-800/40">
          <Lock size={30} />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-1 text-slate-900 dark:text-slate-100">Enter PIN</h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Please enter your 4-digit PIN to access Simzy Cash Saver</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">(Default: 1234 if not set)</p>
      </div>

      <div className={`flex gap-4 mb-10 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < input.length 
                ? error 
                  ? 'bg-red-500 ring-4 ring-red-200 dark:ring-red-900/50' 
                  : 'bg-emerald-500 ring-4 ring-emerald-200 dark:ring-emerald-900/50' 
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          ></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 max-w-[280px] w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700/80 shadow-sm transition-all active:scale-95 flex items-center justify-center mx-auto"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16"></div>
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700/80 shadow-sm transition-all active:scale-95 flex items-center justify-center mx-auto"
        >
          0
        </button>
        <button 
          onClick={handleBackspace}
          disabled={input.length === 0}
          className="w-16 h-16 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all active:scale-95 flex items-center justify-center mx-auto disabled:opacity-40 disabled:active:scale-100"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
