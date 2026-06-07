import { useState } from 'react';
import { useStore } from '../store';
import { Delete, Lock } from 'lucide-react';

interface PinScreenProps {
  onSuccess: () => void;
}

export default function PinScreen({ onSuccess }: PinScreenProps) {
  const { pin } = useStore();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-5 text-slate-800 dark:text-slate-100">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Enter PIN</h2>
        <p className="text-slate-500 dark:text-slate-400">Please enter your 4-digit PIN to access Simzy</p>
        <p className="text-xs text-slate-400 mt-2">(Default: 1234 if not set)</p>
      </div>

      <div className={`flex gap-4 mb-12 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-colors duration-300 ${
              i < input.length 
                ? error ? 'bg-red-500' : 'bg-emerald-500' 
                : 'bg-slate-200'
            }`}
          ></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-2xl font-semibold hover:bg-emerald-50 dark:bg-emerald-900/30 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95 flex items-center justify-center mx-auto"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16"></div>
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-2xl font-semibold hover:bg-emerald-50 dark:bg-emerald-900/30 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95 flex items-center justify-center mx-auto"
        >
          0
        </button>
        <button 
          onClick={handleBackspace}
          disabled={input.length === 0}
          className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center mx-auto disabled:opacity-50 disabled:active:scale-100"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
}
