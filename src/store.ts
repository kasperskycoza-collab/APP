import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Transaction, Goal, Account } from './types';

interface StoreState extends AppState {
  login: (userInfo: { email: string; name?: string; photoURL?: string; id?: string }) => void;
  logout: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: number, tx: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: number) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  setCurrency: (currency: string) => void;
  editGoal: (id: number, goal: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: number) => void;
  updateGoalStatus: (id: number, amount: number, accountId?: string, date?: string) => void;
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
      expenseCategories: ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'transfer', 'other'],
      incomeCategories: ['salary', 'freelance', 'investments', 'gifts', 'transfer', 'other'],

      login: (userInfo) => set({ 
        user: { 
          name: userInfo.name || userInfo.email.split('@')[0], 
          email: userInfo.email,
          photoURL: userInfo.photoURL,
          id: userInfo.id
        }, 
        isLoggedIn: true 
      }),
      
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
          transactions: [{ id: Date.now() + Math.floor(Math.random() * 1000000), ...tx }, ...state.transactions],
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

        let newAccounts = [...state.accounts];
        let newGoals = [...state.goals];
        let transactionsToRemoveIds = [id];

        if (tx.transferGroupId) {
          const relatedTxs = state.transactions.filter(t => t.transferGroupId === tx.transferGroupId);
          transactionsToRemoveIds = relatedTxs.map(t => t.id);

          relatedTxs.forEach(rtx => {
            const amount = rtx.type === 'income' ? -rtx.amount : rtx.amount;
            newAccounts = newAccounts.map(acc => 
              acc.id === rtx.account ? { ...acc, balance: acc.balance + amount } : acc
            );

            if (rtx.goalId) {
              const goalRevertEffect = rtx.type === 'expense' ? -rtx.amount : rtx.amount;
              newGoals = newGoals.map(g => 
                g.id === rtx.goalId ? { ...g, current: g.current + goalRevertEffect } : g
              );
            }
          });
        } else {
          const amount = tx.type === 'income' ? -tx.amount : tx.amount;
          newAccounts = state.accounts.map(acc => 
            acc.id === tx.account ? { ...acc, balance: acc.balance + amount } : acc
          );

          if (tx.goalId) {
            const goalRevertEffect = tx.type === 'expense' ? -tx.amount : tx.amount;
            newGoals = state.goals.map(g => 
              g.id === tx.goalId ? { ...g, current: g.current + goalRevertEffect } : g
            );
          }
        }

        return {
          transactions: state.transactions.filter(t => !transactionsToRemoveIds.includes(t.id)),
          accounts: newAccounts,
          goals: newGoals
        };
      }),

      editTransaction: (id: number, updatedTx: Partial<Omit<Transaction, 'id'>>) => set((state) => {
        const oldTx = state.transactions.find(t => t.id === id);
        if (!oldTx) return state;

        if (oldTx.transferGroupId) {
          const partnerTx = state.transactions.find(t => t.transferGroupId === oldTx.transferGroupId && t.id !== oldTx.id);

          if (partnerTx) {
            let tempAccounts = state.accounts.map(acc => ({ ...acc }));
            
            const oldTxRevert = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            tempAccounts = tempAccounts.map(acc => 
              acc.id === oldTx.account ? { ...acc, balance: acc.balance + oldTxRevert } : acc
            );

            const partnerTxRevert = partnerTx.type === 'income' ? -partnerTx.amount : partnerTx.amount;
            tempAccounts = tempAccounts.map(acc => 
              acc.id === partnerTx.account ? { ...acc, balance: acc.balance + partnerTxRevert } : acc
            );

            const newAmount = updatedTx.amount !== undefined ? updatedTx.amount : oldTx.amount;
            const newDate = updatedTx.date !== undefined ? updatedTx.date : oldTx.date;
            const newMethod = updatedTx.method !== undefined ? updatedTx.method : oldTx.method;
            const newRecurring = updatedTx.recurring !== undefined ? updatedTx.recurring : oldTx.recurring;
            const newFrequency = updatedTx.frequency !== undefined ? updatedTx.frequency : oldTx.frequency;
            
            const newAccountTx1 = updatedTx.account !== undefined ? updatedTx.account : oldTx.account;
            const newAccountTx2 = partnerTx.account;

            const newCategory = updatedTx.category !== undefined ? updatedTx.category : oldTx.category;

            const updatedDescription = updatedTx.description !== undefined ? updatedTx.description : oldTx.description;
            const colonIndex = updatedDescription.indexOf(': ');
            const customDesc = colonIndex !== -1 ? updatedDescription.substring(colonIndex + 2) : updatedDescription;

            const fromAccName = oldTx.type === 'expense'
              ? (tempAccounts.find(a => a.id === newAccountTx1)?.name || 'Account')
              : (tempAccounts.find(a => a.id === newAccountTx2)?.name || 'Account');

            const toAccName = oldTx.type === 'expense'
              ? (tempAccounts.find(a => a.id === newAccountTx2)?.name || 'Account')
              : (tempAccounts.find(a => a.id === newAccountTx1)?.name || 'Account');

            const fromDescription = `Transfer to ${toAccName}: ${customDesc}`;
            const toDescription = `Transfer from ${fromAccName}: ${customDesc}`;

            const newDescriptionTx1 = oldTx.type === 'expense' ? fromDescription : toDescription;
            const newDescriptionTx2 = partnerTx.type === 'expense' ? fromDescription : toDescription;

            const tx1Apply = oldTx.type === 'income' ? newAmount : -newAmount;
            tempAccounts = tempAccounts.map(acc => 
              acc.id === newAccountTx1 ? { ...acc, balance: acc.balance + tx1Apply } : acc
            );

            const tx2Apply = partnerTx.type === 'income' ? newAmount : -newAmount;
            tempAccounts = tempAccounts.map(acc => 
              acc.id === newAccountTx2 ? { ...acc, balance: acc.balance + tx2Apply } : acc
            );

            return {
              accounts: tempAccounts,
              transactions: state.transactions.map(t => {
                if (t.id === oldTx.id) {
                  return {
                    ...t,
                    amount: newAmount,
                    date: newDate,
                    method: newMethod,
                    recurring: newRecurring,
                    frequency: newRecurring ? newFrequency : undefined,
                    account: newAccountTx1,
                    category: newCategory,
                    description: newDescriptionTx1,
                  };
                }
                if (t.id === partnerTx.id) {
                  return {
                    ...t,
                    amount: newAmount,
                    date: newDate,
                    method: newMethod,
                    recurring: newRecurring,
                    frequency: newRecurring ? newFrequency : undefined,
                    account: newAccountTx2,
                    category: newCategory,
                    description: newDescriptionTx2,
                  };
                }
                return t;
              })
            };
          }
        }

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

      updateGoalStatus: (id, amount, accountId, date) => {
        const goal = get().goals.find(g => g.id === id);

        if (accountId && goal) {
          get().addTransaction({
            type: 'expense',
            amount: amount,
            category: 'savings',
            date: date || new Date().toISOString().split('T')[0],
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
