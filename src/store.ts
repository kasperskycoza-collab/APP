import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Transaction, Goal, Account } from './types';

interface StoreState extends AppState {
  login: (email: string) => void;
  logout: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: number, tx: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: number) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  setCurrency: (currency: string) => void;
  editGoal: (id: number, goal: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: number) => void;
  updateGoalStatus: (id: number, amount: number, accountId?: string) => void;
  toggleDarkMode: () => void;
  togglePinLock: () => void;
  setPin: (pin: string) => void;
  importData: (data: string) => boolean;
  addCategory: (type: 'income' | 'expense', category: string) => void;
  deleteCategory: (type: 'income' | 'expense', category: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }],
      transactions: [],
      goals: [],
      currency: 'USD',
      isLoggedIn: false,
      pinLock: false,
      pin: '',
      darkMode: false,
      expenseCategories: ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'other'],
      incomeCategories: ['salary', 'freelance', 'investments', 'gifts', 'other'],

      login: (email) => set({ user: { name: email.split('@')[0], email }, isLoggedIn: true }),
      
      logout: () => set({ user: null, isLoggedIn: false }),
      
      addTransaction: (tx) => set((state) => {
        const amount = tx.type === 'income' ? tx.amount : -tx.amount;
        const newAccounts = state.accounts.map(acc => 
          acc.id === tx.account ? { ...acc, balance: acc.balance + amount } : acc
        );
        let newGoals = state.goals;
        if (tx.goalId) {
            const goalEffect = tx.type === 'expense' ? tx.amount : -tx.amount;
            newGoals = state.goals.map(g => 
               g.id === tx.goalId ? { ...g, current: g.current + goalEffect } : g
            );
        }
        return {
          transactions: [{ id: Date.now(), ...tx }, ...state.transactions],
          accounts: newAccounts,
          goals: newGoals
        };
      }),

      addGoal: (goal) => set((state) => ({
        goals: [{ id: Date.now(), ...goal }, ...state.goals]
      })),

      deleteTransaction: (id: number) => set((state) => {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return state;

        const amount = tx.type === 'income' ? -tx.amount : tx.amount; // reverse the effect
        const newAccounts = state.accounts.map(acc => 
          acc.id === tx.account ? { ...acc, balance: acc.balance + amount } : acc
        );

        let newGoals = state.goals;
        if (tx.goalId) {
            const goalRevertEffect = tx.type === 'expense' ? -tx.amount : tx.amount;
            newGoals = state.goals.map(g => 
               g.id === tx.goalId ? { ...g, current: g.current + goalRevertEffect } : g
            );
        }

        return {
          transactions: state.transactions.filter(t => t.id !== id),
          accounts: newAccounts,
          goals: newGoals
        };
      }),

      editTransaction: (id: number, updatedTx: Partial<Omit<Transaction, 'id'>>) => set((state) => {
        const oldTx = state.transactions.find(t => t.id === id);
        if (!oldTx) return state;

        // Revert old transaction's effect
        const revertAmount = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        
        // Calculate new transaction's effect
        const newType = updatedTx.type || oldTx.type;
        const newTxAmount = updatedTx.amount !== undefined ? updatedTx.amount : oldTx.amount;
        const applyAmount = newType === 'income' ? newTxAmount : -newTxAmount;
        
        const oldAccount = oldTx.account;
        const newAccount = updatedTx.account || oldTx.account;

        let newAccounts = state.accounts.map(acc => ({ ...acc }));
        
        // If account hasn't changed, combobox the amount
        if (oldAccount === newAccount) {
            newAccounts = newAccounts.map(acc => 
              acc.id === oldAccount ? { ...acc, balance: acc.balance + revertAmount + applyAmount } : acc
            );
        } else {
            // Apply to different accounts
            newAccounts = newAccounts.map(acc => {
              if (acc.id === oldAccount) {
                return { ...acc, balance: acc.balance + revertAmount };
              }
              if (acc.id === newAccount) {
                return { ...acc, balance: acc.balance + applyAmount };
              }
              return acc;
            });
        }

        let newGoals = state.goals;
        const oldGoalId = oldTx.goalId;
        const newGoalId = updatedTx.goalId !== undefined ? updatedTx.goalId : oldTx.goalId;

        // Revert old goal effect
        if (oldGoalId) {
            const goalRevertEffect = oldTx.type === 'expense' ? -oldTx.amount : oldTx.amount;
            newGoals = newGoals.map(g => 
               g.id === oldGoalId ? { ...g, current: g.current + goalRevertEffect } : g
            );
        }

        // Apply new goal effect
        if (newGoalId) {
            const goalApplyEffect = newType === 'expense' ? newTxAmount : -newTxAmount;
            newGoals = newGoals.map(g => 
               g.id === newGoalId ? { ...g, current: g.current + goalApplyEffect } : g
            );
        }

        return {
          transactions: state.transactions.map(t => t.id === id ? { ...t, ...updatedTx } : t),
          accounts: newAccounts,
          goals: newGoals
        };
      }),

      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),

      editGoal: (id, updatedGoal) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...updatedGoal } : g)
      })),

      updateGoalStatus: (id, amount, accountId) => {
        const goal = get().goals.find(g => g.id === id);

        if (accountId && goal) {
          get().addTransaction({
            type: 'expense',
            amount: amount,
            category: 'savings',
            date: new Date().toISOString(),
            description: `Funded Goal: ${goal.name}`,
            method: 'transfer',
            account: accountId,
            recurring: false,
            goalId: id
          });
        } else if (goal) {
          set((state) => ({
            goals: state.goals.map(g => g.id === id ? { ...g, current: g.current + amount } : g)
          }));
        }
      },

      setCurrency: (currency) => set({ currency }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      togglePinLock: () => set((state) => ({ pinLock: !state.pinLock })),
      setPin: (pin) => set({ pin }),
      importData: (dataStr: string) => {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed && typeof parsed === 'object' && parsed.transactions) {
            set((state) => ({ ...state, ...parsed }));
            return true;
          }
          return false;
        } catch(e) {
          return false;
        }
      },
      addCategory: (type, category) => set((state) => {
        if (type === 'income') {
          return { incomeCategories: [...state.incomeCategories, category] };
        }
        return { expenseCategories: [...state.expenseCategories, category] };
      }),
      deleteCategory: (type, category) => set((state) => {
        if (type === 'income') {
          return { incomeCategories: state.incomeCategories.filter(c => c !== category) };
        }
        return { expenseCategories: state.expenseCategories.filter(c => c !== category) };
      })
    }),
    {
      name: 'simzy-storage',
    }
  )
);
