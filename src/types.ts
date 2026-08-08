export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  method: string;
  account: string;
  recurring: boolean;
  frequency?: string;
  goalId?: number;
  transferGroupId?: string;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline: string;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
}

export interface RegisteredUser {
  firstName: string;
  surname: string;
  email: string;
  registeredAt?: string;
}

export interface AppState {
  user: { id?: string; name: string; email: string; firstName?: string; surname?: string; photoURL?: string } | null;
  registeredUsers: RegisteredUser[];
  registeredEmails: string[];
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  currency: string;
  isLoggedIn: boolean;
  pinLock: boolean;
  pin: string;
  darkMode: boolean;
  expenseCategories: string[];
  incomeCategories: string[];
}
