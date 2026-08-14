import { 
  db, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType,
  writeBatch
} from './firebase';
import { Transaction, Goal, Account, AppLanguage, ThemePalette, ThemeMode } from './types';

export interface CloudUserData {
  profile?: {
    userId: string;
    email: string;
    name?: string;
    firstName?: string;
    surname?: string;
    currency?: string;
    language?: AppLanguage;
    themePalette?: ThemePalette;
    themeMode?: ThemeMode;
    pinLock?: boolean;
    pin?: string;
    updatedAt?: string;
  };
  transactions: Transaction[];
  goals: Goal[];
  accounts: Account[];
}

export function subscribeToUserData(
  userId: string,
  onData: (data: Partial<CloudUserData>) => void
): () => void {
  if (!userId || !db) return () => {};

  const unsubscribes: (() => void)[] = [];

  // 1. User Profile Listener
  const userDocRef = doc(db, 'users', userId);
  const unsubProfile = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData({
          profile: {
            userId,
            email: data.email || '',
            name: data.name,
            firstName: data.firstName,
            surname: data.surname,
            currency: data.currency,
            language: data.language,
            themePalette: data.themePalette,
            themeMode: data.themeMode,
            pinLock: data.pinLock,
            pin: data.pin,
            updatedAt: data.updatedAt
          }
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  );
  unsubscribes.push(unsubProfile);

  // 2. Transactions Listener
  const txColRef = collection(db, 'users', userId, 'transactions');
  const unsubTx = onSnapshot(
    txColRef,
    (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        transactions.push({
          id: Number(d.id) || Number(docSnap.id) || Date.now(),
          type: d.type as 'income' | 'expense',
          amount: Number(d.amount) || 0,
          category: d.category || 'other',
          date: d.date || new Date().toISOString().split('T')[0],
          description: d.description || '',
          method: d.method || 'cash',
          account: d.account || 'default',
          recurring: Boolean(d.recurring),
          frequency: d.frequency,
          goalId: d.goalId !== undefined ? Number(d.goalId) : undefined,
          transferGroupId: d.transferGroupId
        });
      });
      onData({ transactions });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/transactions`);
    }
  );
  unsubscribes.push(unsubTx);

  // 3. Goals Listener
  const goalsColRef = collection(db, 'users', userId, 'goals');
  const unsubGoals = onSnapshot(
    goalsColRef,
    (snapshot) => {
      const goals: Goal[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        goals.push({
          id: Number(d.id) || Number(docSnap.id) || Date.now(),
          name: d.name || 'Savings Goal',
          target: Number(d.target) || 0,
          current: Number(d.current) || 0,
          deadline: d.deadline || new Date().toISOString().split('T')[0],
          description: d.description || ''
        });
      });
      onData({ goals });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/goals`);
    }
  );
  unsubscribes.push(unsubGoals);

  // 4. Accounts Listener
  const accountsColRef = collection(db, 'users', userId, 'accounts');
  const unsubAccounts = onSnapshot(
    accountsColRef,
    (snapshot) => {
      const accounts: Account[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        accounts.push({
          id: String(d.id || docSnap.id),
          name: d.name || 'Main Account',
          balance: Number(d.balance) || 0,
          isDefault: Boolean(d.isDefault)
        });
      });
      if (accounts.length > 0) {
        onData({ accounts });
      } else {
        // New user has no account records yet in Firestore - supply a clean zero-balance default account
        onData({ accounts: [{ id: 'default', name: 'Main Account', balance: 0, isDefault: true }] });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/accounts`);
    }
  );
  unsubscribes.push(unsubAccounts);

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

export async function saveUserProfileToFirestore(userId: string, profileData: Record<string, any>) {
  if (!userId || !db) return;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(
      docRef,
      {
        userId,
        ...profileData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveTransactionToFirestore(userId: string, tx: Transaction) {
  if (!userId || !db) return;
  const txIdStr = String(tx.id);
  const path = `users/${userId}/transactions/${txIdStr}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', txIdStr);
    const cleanPayload: Record<string, any> = {
      id: txIdStr,
      userId,
      type: tx.type,
      amount: Number(tx.amount),
      category: String(tx.category || 'other'),
      date: String(tx.date),
      description: String(tx.description || ''),
      method: String(tx.method || 'cash'),
      account: String(tx.account || 'default'),
      recurring: Boolean(tx.recurring),
      updatedAt: new Date().toISOString()
    };
    if (tx.frequency) cleanPayload.frequency = String(tx.frequency);
    if (tx.goalId !== undefined) cleanPayload.goalId = Number(tx.goalId);
    if (tx.transferGroupId) cleanPayload.transferGroupId = String(tx.transferGroupId);

    await setDoc(docRef, cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFromFirestore(userId: string, txId: number) {
  if (!userId || !db) return;
  const txIdStr = String(txId);
  const path = `users/${userId}/transactions/${txIdStr}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txIdStr));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGoalToFirestore(userId: string, goal: Goal) {
  if (!userId || !db) return;
  const goalIdStr = String(goal.id);
  const path = `users/${userId}/goals/${goalIdStr}`;
  try {
    const docRef = doc(db, 'users', userId, 'goals', goalIdStr);
    const cleanPayload: Record<string, any> = {
      id: goalIdStr,
      userId,
      name: String(goal.name),
      target: Number(goal.target),
      current: Number(goal.current),
      deadline: String(goal.deadline),
      updatedAt: new Date().toISOString()
    };
    if (goal.description) cleanPayload.description = String(goal.description);

    await setDoc(docRef, cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGoalFromFirestore(userId: string, goalId: number) {
  if (!userId || !db) return;
  const goalIdStr = String(goalId);
  const path = `users/${userId}/goals/${goalIdStr}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalIdStr));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAccountToFirestore(userId: string, account: Account) {
  if (!userId || !db) return;
  const accIdStr = String(account.id);
  const path = `users/${userId}/accounts/${accIdStr}`;
  try {
    const docRef = doc(db, 'users', userId, 'accounts', accIdStr);
    await setDoc(docRef, {
      id: accIdStr,
      userId,
      name: String(account.name),
      balance: Number(account.balance),
      isDefault: Boolean(account.isDefault),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccountFromFirestore(userId: string, accountId: string) {
  if (!userId || !db) return;
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function uploadLocalDataToFirestore(
  userId: string,
  localData: {
    transactions: Transaction[];
    goals: Goal[];
    accounts: Account[];
    profile: {
      email: string;
      name?: string;
      firstName?: string;
      surname?: string;
      currency?: string;
      language?: AppLanguage;
      themePalette?: ThemePalette;
      themeMode?: ThemeMode;
    };
  }
) {
  if (!userId || !db) return;
  try {
    await saveUserProfileToFirestore(userId, localData.profile);

    for (const acc of localData.accounts) {
      await saveAccountToFirestore(userId, acc);
    }
    for (const g of localData.goals) {
      await saveGoalToFirestore(userId, g);
    }
    for (const tx of localData.transactions) {
      await saveTransactionToFirestore(userId, tx);
    }
  } catch (e) {
    console.error('Error uploading local data to Firestore:', e);
  }
}
