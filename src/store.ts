import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Transaction, Goal, Account, AppLanguage, NotificationSettings, ThemePalette, ThemeMode } from './types';
import { 
  saveTransactionToFirestore, 
  deleteTransactionFromFirestore, 
  saveGoalToFirestore, 
  deleteGoalFromFirestore, 
  saveAccountToFirestore, 
  deleteAccountFromFirestore,
  saveUserProfileToFirestore,
  CloudUserData
} from './firestoreSync';

interface StoreState extends AppState {
  isCloudSynced: boolean;
  setCloudSynced: (synced: boolean) => void;
  setCloudData: (data: Partial<CloudUserData>) => void;
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
  addAccount: (name: string, initialBalance?: number) => void;
  deleteAccount: (id: string) => void;
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
      currency: 'TZS',
      language: 'en',
      notifications: {
        reminders: true,
        goalAlerts: true,
        budgetAlerts: true,
        weeklySummary: false,
        pushEnabled: true,
      },
      isLoggedIn: false,
      isCloudSynced: true,
      pinLock: false,
      pin: '',
      darkMode: false,
      themePalette: 'dream',
      themeMode: 'light',
      expenseCategories: ['food', 'transport', 'rent', 'shopping', 'bills', 'health', 'education', 'transfer', 'other'],
      incomeCategories: ['salary', 'freelance', 'investments', 'gifts', 'transfer', 'other'],

      setCloudSynced: (synced: boolean) => set({ isCloudSynced: synced }),

      setCloudData: (cloudData: Partial<CloudUserData>) => {
        const state = get();
        const updates: Partial<AppState> = {};

        if (cloudData.transactions !== undefined) {
          updates.transactions = cloudData.transactions;
        }
        if (cloudData.goals !== undefined) {
          updates.goals = cloudData.goals;
        }
        if (cloudData.accounts !== undefined) {
          updates.accounts = cloudData.accounts.length > 0
            ? cloudData.accounts
            : [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }];
        }
        if (cloudData.profile) {
          if (cloudData.profile.currency) updates.currency = cloudData.profile.currency;
          if (cloudData.profile.language) updates.language = cloudData.profile.language;
          if (cloudData.profile.themePalette) updates.themePalette = cloudData.profile.themePalette;
          if (cloudData.profile.themeMode) {
            updates.themeMode = cloudData.profile.themeMode;
            updates.darkMode = cloudData.profile.themeMode === 'dark';
          }
          if (cloudData.profile.pinLock !== undefined) updates.pinLock = cloudData.profile.pinLock;
          if (cloudData.profile.pin !== undefined) updates.pin = cloudData.profile.pin;
        }

        set({ ...updates, isCloudSynced: true });
      },

      login: (userInfo) => {
        const cleanEmail = (userInfo.email || '').trim().toLowerCase();
        const state = get();
        const existingUsers = state.registeredUsers || [];
        const existingEmails = state.registeredEmails || [];
        const currentUser = state.user;

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

        const isDifferentUser = !currentUser || 
          (userInfo.id && currentUser.id !== userInfo.id) || 
          (cleanEmail && currentUser.email?.toLowerCase() !== cleanEmail);

        // When logging in as a new/different user, start with clean zero-balance state
        const initialAccounts = isDifferentUser
          ? [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }]
          : state.accounts;
        const initialTransactions = isDifferentUser ? [] : state.transactions;
        const initialGoals = isDifferentUser ? [] : state.goals;

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
          accounts: initialAccounts,
          transactions: initialTransactions,
          goals: initialGoals,
          isLoggedIn: true 
        });

        // Cloud sync profile if logged in with Firebase UID
        if (userInfo.id && !userInfo.id.startsWith('off_')) {
          saveUserProfileToFirestore(userInfo.id, {
            email: cleanEmail,
            name: fullName,
            firstName: firstName || '',
            surname: surname || '',
            currency: get().currency,
            language: get().language,
            themePalette: get().themePalette,
            themeMode: get().themeMode,
            pinLock: get().pinLock,
            pin: get().pin
          }).catch(console.error);
        }
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
        const freshAccounts = [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }];

        const updatedOfflineData = {
          ...(state.offlineDataByEmail || {}),
          [email]: {
            accounts: freshAccounts,
            transactions: [],
            goals: [],
            currency: state.currency,
            language: state.language
          }
        };

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
          offlineDataByEmail: updatedOfflineData,
          accounts: freshAccounts,
          transactions: [],
          goals: [],
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
        const savedData = state.offlineDataByEmail?.[email];

        set({
          user: {
            id: 'off_' + Date.now(),
            name: fullName,
            email: found.email,
            firstName: found.firstName,
            surname: found.surname
          },
          accounts: (savedData?.accounts && savedData.accounts.length > 0)
            ? savedData.accounts
            : [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }],
          transactions: savedData?.transactions || [],
          goals: savedData?.goals || [],
          currency: savedData?.currency || state.currency,
          language: savedData?.language || state.language,
          isLoggedIn: true
        });

        return { success: true };
      },
      
      logout: () => set({ 
        user: null, 
        isLoggedIn: false, 
        accounts: [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }],
        transactions: [], 
        goals: [] 
      }),
      
      addTransaction: (tx) => {
        const id = Date.now() + Math.floor(Math.random() * 1000000);
        const newTx: Transaction = { id, ...tx };
        const state = get();
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

        set({
          transactions: [newTx, ...state.transactions],
          accounts: newAccounts,
          goals: newGoals
        });

        // Sync with Cloud
        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveTransactionToFirestore(user.id, newTx).catch(console.error);
          const targetAcc = newAccounts.find(a => a.id === tx.account);
          if (targetAcc) saveAccountToFirestore(user.id, targetAcc).catch(console.error);
          if (tx.goalId) {
            const targetGoal = newGoals.find(g => g.id === tx.goalId);
            if (targetGoal) saveGoalToFirestore(user.id, targetGoal).catch(console.error);
          }
        }
      },

      addGoal: (goal) => {
        const id = Date.now();
        const newGoal: Goal = { id, ...goal };
        const state = get();
        set({
          goals: [newGoal, ...state.goals]
        });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveGoalToFirestore(user.id, newGoal).catch(console.error);
        }
      },

      deleteTransaction: (id: number) => {
        const state = get();
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

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
            newGoals = newGoals.map(g => 
              g.id === tx.goalId ? { ...g, current: g.current + goalRevertEffect } : g
            );
          }
        }

        set({
          transactions: state.transactions.filter(t => !transactionsToRemoveIds.includes(t.id)),
          accounts: newAccounts,
          goals: newGoals
        });

        // Sync with Cloud
        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          transactionsToRemoveIds.forEach(tId => {
            deleteTransactionFromFirestore(user.id!, tId).catch(console.error);
          });
          newAccounts.forEach(acc => {
            saveAccountToFirestore(user.id!, acc).catch(console.error);
          });
        }
      },

      editTransaction: (id: number, updatedTx: Partial<Omit<Transaction, 'id'>>) => {
        const state = get();
        const oldTx = state.transactions.find(t => t.id === id);
        if (!oldTx) return;

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

            const finalTx1 = {
              ...oldTx,
              amount: newAmount,
              date: newDate,
              method: newMethod,
              recurring: newRecurring,
              frequency: newRecurring ? newFrequency : undefined,
              account: newAccountTx1,
              category: newCategory,
              description: newDescriptionTx1,
            };

            const finalTx2 = {
              ...partnerTx,
              amount: newAmount,
              date: newDate,
              method: newMethod,
              recurring: newRecurring,
              frequency: newRecurring ? newFrequency : undefined,
              account: newAccountTx2,
              category: newCategory,
              description: newDescriptionTx2,
            };

            set({
              accounts: tempAccounts,
              transactions: state.transactions.map(t => {
                if (t.id === oldTx.id) return finalTx1;
                if (t.id === partnerTx.id) return finalTx2;
                return t;
              })
            });

            const user = state.user;
            if (user?.id && !user.id.startsWith('off_')) {
              saveTransactionToFirestore(user.id, finalTx1).catch(console.error);
              saveTransactionToFirestore(user.id, finalTx2).catch(console.error);
            }
            return;
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

        const mergedTx = { ...oldTx, ...updatedTx };

        set({
          transactions: state.transactions.map(t => t.id === id ? mergedTx : t),
          accounts: newAccounts,
          goals: newGoals
        });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveTransactionToFirestore(user.id, mergedTx).catch(console.error);
        }
      },

      deleteGoal: (id) => {
        const state = get();
        set({
          goals: state.goals.filter(g => g.id !== id)
        });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          deleteGoalFromFirestore(user.id, id).catch(console.error);
        }
      },

      editGoal: (id, updatedGoal) => {
        const state = get();
        const oldGoal = state.goals.find(g => g.id === id);
        if (!oldGoal) return;
        const mergedGoal = { ...oldGoal, ...updatedGoal };

        set({
          goals: state.goals.map(g => g.id === id ? mergedGoal : g)
        });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveGoalToFirestore(user.id, mergedGoal).catch(console.error);
        }
      },

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
          const updatedGoal = { ...goal, current: goal.current + amount };
          set((state) => ({
            goals: state.goals.map(g => g.id === id ? updatedGoal : g)
          }));
          const user = get().user;
          if (user?.id && !user.id.startsWith('off_')) {
            saveGoalToFirestore(user.id, updatedGoal).catch(console.error);
          }
        }
      },

      setCurrency: (currency) => {
        set({ currency });
        const user = get().user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveUserProfileToFirestore(user.id, { currency }).catch(console.error);
        }
      },
      setLanguage: (language) => {
        set({ language });
        const user = get().user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveUserProfileToFirestore(user.id, { language }).catch(console.error);
        }
      },
      setNotificationSettings: (newSettings) => set((state) => ({
        notifications: { ...state.notifications, ...newSettings }
      })),
      setThemePalette: (themePalette) => {
        set({ themePalette });
        const user = get().user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveUserProfileToFirestore(user.id, { themePalette }).catch(console.error);
        }
      },
      setThemeMode: (themeMode) => {
        set({ 
          themeMode,
          darkMode: themeMode === 'dark' ? true : themeMode === 'light' ? false : (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
        });
        const user = get().user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveUserProfileToFirestore(user.id, { themeMode }).catch(console.error);
        }
      },
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
      addAccount: (name: string, initialBalance = 0) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const newAccount: Account = {
          id: 'acc_' + Date.now(),
          name: cleanName,
          balance: Number(initialBalance) || 0,
          isDefault: false
        };
        const state = get();
        const updatedAccounts = [...state.accounts, newAccount];
        set({ accounts: updatedAccounts });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          saveAccountToFirestore(user.id, newAccount).catch(console.error);
        }
      },

      deleteAccount: (id: string) => {
        const state = get();
        const accToDelete = state.accounts.find(a => a.id === id);
        if (!accToDelete || accToDelete.isDefault) return;

        const updatedAccounts = state.accounts.filter(a => a.id !== id);
        set({ accounts: updatedAccounts });

        const user = state.user;
        if (user?.id && !user.id.startsWith('off_')) {
          deleteAccountFromFirestore(user.id, id).catch(console.error);
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
        const isLoggedOut = !ps.user || !ps.isLoggedIn;
        const defaultAccounts = [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }];

        return {
          ...currentState,
          ...ps,
          registeredUsers: Array.isArray(ps.registeredUsers) ? ps.registeredUsers : (currentState.registeredUsers || []),
          registeredEmails: Array.isArray(ps.registeredEmails) ? ps.registeredEmails : (currentState.registeredEmails || []),
          offlineDataByEmail: (ps.offlineDataByEmail && typeof ps.offlineDataByEmail === 'object') ? ps.offlineDataByEmail : {},
          accounts: isLoggedOut 
            ? defaultAccounts 
            : (Array.isArray(ps.accounts) && ps.accounts.length > 0 ? ps.accounts : defaultAccounts),
          transactions: isLoggedOut 
            ? [] 
            : (Array.isArray(ps.transactions) ? ps.transactions : []),
          goals: isLoggedOut 
            ? [] 
            : (Array.isArray(ps.goals) ? ps.goals : []),
          expenseCategories: Array.isArray(ps.expenseCategories) ? ps.expenseCategories : currentState.expenseCategories,
          incomeCategories: Array.isArray(ps.incomeCategories) ? ps.incomeCategories : currentState.incomeCategories,
          language: ps.language || currentState.language || 'en',
          currency: ps.currency || currentState.currency || 'TZS',
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
