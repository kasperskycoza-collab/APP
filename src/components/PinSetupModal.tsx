import { useState } from 'react';
import { useStore } from '../store';
import { X, Lock, Check } from 'lucide-react';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PinSetupModal({ isOpen, onClose }: PinSetupModalProps) {
  const { pin, setPin, togglePinLock, pinLock } = useStore();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(pinLock && pin ? 'current' : 'new');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    setError('');
    if (step === 'current') {
      if (currentPin === pin) {
        setStep('new');
        setCurrentPin('');
      } else {
        setError('Incorrect current PIN');
      }
    } else if (step === 'new') {
      if (newPin.length === 4) {
        setStep('confirm');
      } else {
        setError('PIN must be 4 digits');
      }
    } else if (step === 'confirm') {
      if (newPin === confirmPin) {
        setPin(newPin);
        if (!pinLock) togglePinLock();
        onClose();
        setNewPin('');
        setConfirmPin('');
        setStep('current');
      } else {
        setError('PINs do not match');
      }
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950/65 dark:bg-black/75 z-[100] flex items-center justify-center p-5 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-xs rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Lock className="text-emerald-500" size={20} />
            Setup Custom PIN
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {error && <div className="p-2 mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg text-sm self-stretch text-center">{error}</div>}
          
          <div className="text-center font-medium mb-4 text-slate-700 dark:text-slate-300">
            {step === 'current' ? 'Enter Current PIN' : step === 'new' ? 'Enter New 4-Digit PIN' : 'Confirm New PIN'}
          </div>

          <input
            type="password"
            maxLength={4}
            value={step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (step === 'current') setCurrentPin(val);
              else if (step === 'new') setNewPin(val);
              else setConfirmPin(val);
            }}
            placeholder="••••"
            className="w-32 text-center text-2xl tracking-widest border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition-colors bg-white dark:bg-slate-900 mx-auto"
          />

          <button onClick={handleNext} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
            <Check size={20} /> {step === 'confirm' ? 'Save PIN' : 'Next'}
          </button>

          {pinLock && step === 'new' && (
            <button onClick={() => { togglePinLock(); setPin(''); onClose(); }} className="mt-4 text-red-500 text-sm font-medium hover:underline">
              Disable PIN Lock completely
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
