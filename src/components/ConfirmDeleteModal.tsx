import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Transaction",
  message = "Are you sure you want to delete this transaction? This action cannot be undone."
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[70] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center justify-center border-b border-red-100 dark:border-red-900/30">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle className="text-red-500 shadow-sm" size={32} />
          </div>
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100 text-center">
            {title}
          </h2>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
