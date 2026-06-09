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

export interface AppState {
  user: { id?: string; name: string; email: string; photoURL?: string } | null;
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
