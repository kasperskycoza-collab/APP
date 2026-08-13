import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Transaction, Goal, Account, AppLanguage, NotificationSettings } from './types';

interface StoreState extends AppState {
  login: (userInfo: { email: string; name?: string; firstName?: string; surname?: string; photoURL?: string; id?: string }) => void;
  registerOfflineUser: (firstName: string, surname: string, email: string) => { success: boolean; error?: string };
  accessOfflineUser: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: number, tx: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: number) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: AppLanguage) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  editGoal: (id: number, goal: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: number) => void;
  updateGoalStatus: (id: number, amount: number, accountId?: string, date?: string) => void;
  toggleDarkMode: () => void;
  setThemePalette: (palette: 'dream' | 'ubuntu') => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
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
      registeredUsers: [],
      registeredEmails: [],
      accounts: [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }],
      transactions: [],
      goals: [],
      currency: 'USD',
      language: 'en',
      notifications: {
        reminders: true,
        goalAlerts: true,
        budgetAlerts: true,
        weeklySummary: false,
        pushEnabled: true,
      },
      isLoggedIn: false,
      pinLock: false,
      pin: '',
      darkMode: false,
      themePalette: 'dream',
      themeMode: 'light',
      expenseCategories: ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'transfer', 'other'],
      incomeCategories: ['salary', 'freelance', 'investments', 'gifts', 'transfer', 'other'],

      login: (userInfo) => {
        const cleanEmail = (userInfo.email || '').trim().toLowerCase();
        const existingUsers = get().registeredUsers || [];
        const existingEmails = get().registeredEmails || [];

        let firstName = userInfo.firstName;
        let surname = userInfo.surname;
        if (!firstName && userInfo.name) {
          const parts = userInfo.name.trim().split(' ');
          firstName = parts[0] || 'User';
          surname = parts.slice(1).join(' ') || '';
        }

        const fullName = userInfo.name || (firstName ? `${firstName} ${surname}`.trim() : cleanEmail.split('@')[0]);

        const updatedEmails = existingEmails.includes(cleanEmail) || !cleanEmail 
          ? existingEmails 
          : [...existingEmails, cleanEmail];

        const alreadyInUsers = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
        const updatedUsers = alreadyInUsers || !cleanEmail 
          ? existingUsers 
          : [...existingUsers, { firstName: firstName || fullName, surname: surname || '', email: cleanEmail, registeredAt: new Date().toISOString() }];

        set({ 
          user: { 
            name: fullName, 
            email: cleanEmail || userInfo.email,
            firstName: firstName,
            surname: surname,
            photoURL: userInfo.photoURL,
            id: userInfo.id
          }, 
          registeredEmails: updatedEmails,
          registeredUsers: updatedUsers,
          isLoggedIn: true 
        });
      },

      registerOfflineUser: (firstNameRaw, surnameRaw, emailRaw) => {
        const firstName = firstNameRaw.trim();
        const surname = surnameRaw.trim();
        const email = emailRaw.trim().toLowerCase();

        if (!firstName) {
          return { success: false, error: 'First Name is required.' };
        }
        if (!surname) {
          return { success: false, error: 'Surname / Last Name is required.' };
        }
        if (!email) {
          return { success: false, error: 'Email address is required.' };
        }

        // Validate email format strictly
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { success: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
        }

        const state = get();
        const existingEmails = (state.registeredEmails || []).map(e => e.toLowerCase());

        // Check if email is already registered
        if (existingEmails.includes(email)) {
          return { 
            success: false, 
            error: `The email "${email}" is already registered. You cannot register it again. Please sign in instead.` 
          };
        }

        const fullName = `${firstName} ${surname}`;
        const newRegisteredUser = {
          firstName,
          surname,
          email,
          registeredAt: new Date().toISOString()
        };

        const updatedUsers = [...(state.registeredUsers || []), newRegisteredUser];
        const updatedEmails = [...(state.registeredEmails || []), email];

        set({
          user: {
            id: 'off_' + Date.now(),
            name: fullName,
            email: email,
            firstName,
            surname
          },
          registeredUsers: updatedUsers,
          registeredEmails: updatedEmails,
          isLoggedIn: true
        });

        return { success: true };
      },

      accessOfflineUser: (emailRaw) => {
        const email = emailRaw.trim().toLowerCase();
        if (!email) {
          return { success: false, error: 'Please enter your registered email address.' };
        }

        const state = get();
        const users = state.registeredUsers || [];
        const found = users.find(u => u.email.toLowerCase() === email);

        if (!found) {
          return { success: false, error: `No registered offline account found for "${email}". Please register a new account.` };
        }

        const fullName = `${found.firstName} ${found.surname}`.trim() || found.email.split('@')[0];

        set({
          user: {
            id: 'off_' + Date.now(),
            name: fullName,
            email: found.email,
            firstName: found.firstName,
            surname: found.surname
          },
          isLoggedIn: true
        });

        return { success: true };
      },
      
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
      setLanguage: (language) => set({ language }),
      setNotificationSettings: (newSettings) => set((state) => ({
        notifications: { ...state.notifications, ...newSettings }
      })),
      setThemePalette: (themePalette) => set({ themePalette }),
      setThemeMode: (themeMode) => set({ 
        themeMode,
        darkMode: themeMode === 'dark' ? true : themeMode === 'light' ? false : (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
      }),
      toggleDarkMode: () => set((state) => {
        const nextDark = !state.darkMode;
        return { 
          darkMode: nextDark,
          themeMode: nextDark ? 'dark' : 'light'
        };
      }),
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
      merge: (persistedState: any, currentState: StoreState) => {
        const ps = (persistedState && typeof persistedState === 'object') ? persistedState : {};
        return {
          ...currentState,
          ...ps,
          registeredUsers: Array.isArray(ps.registeredUsers) ? ps.registeredUsers : (currentState.registeredUsers || []),
          registeredEmails: Array.isArray(ps.registeredEmails) ? ps.registeredEmails : (currentState.registeredEmails || []),
          accounts: (Array.isArray(ps.accounts) && ps.accounts.length > 0) ? ps.accounts : currentState.accounts,
          transactions: Array.isArray(ps.transactions) ? ps.transactions : (currentState.transactions || []),
          goals: Array.isArray(ps.goals) ? ps.goals : (currentState.goals || []),
          expenseCategories: Array.isArray(ps.expenseCategories) ? ps.expenseCategories : currentState.expenseCategories,
          incomeCategories: Array.isArray(ps.incomeCategories) ? ps.incomeCategories : currentState.incomeCategories,
          language: ps.language || currentState.language || 'en',
          notifications: {
            ...currentState.notifications,
            ...(ps.notifications || {})
          },
          themePalette: ps.themePalette || currentState.themePalette || 'dream',
          themeMode: ps.themeMode || (ps.darkMode ? 'dark' : 'light') || currentState.themeMode || 'light',
        };
      }
    }
  )
);
