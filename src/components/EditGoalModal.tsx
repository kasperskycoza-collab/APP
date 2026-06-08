import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X, Target } from 'lucide-react';
import { Goal } from '../types';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export default function EditGoalModal({ isOpen, onClose, goal }: EditGoalModalProps) {
  const { editGoal } = useStore();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal && isOpen) {
      setName(goal.name);
      setTarget(goal.target.toString());
      setCurrent(goal.current.toString());
      setDeadline(goal.deadline);
      setDescription(goal.description || '');
      setError('');
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    const parsedTarget = parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (!deadline) {
      setError('Please select a deadline');
      return;
    }

    const parsedCurrent = current ? parseFloat(current) : 0;

    editGoal(goal.id, {
      name,
      target: parsedTarget,
      current: parsedCurrent,
      deadline,
      description,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target className="text-amber-500" size={20} />
            Edit Goal
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
          <form id="edit-goal-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Goal Name</label>
              <input
                type="text"
                placeholder="e.g. New Car, Vacation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Saved Already</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
              <textarea
                placeholder="Why are you saving for this?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:border-amber-500 focus:outline-none transition-colors min-h-[80px]"
              />
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 font-bold py-4 rounded-xl text-white shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
