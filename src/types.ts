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

export type ThemePalette = 'dream' | 'ubuntu';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'sw';

export interface NotificationSettings {
  reminders: boolean;
  goalAlerts: boolean;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  pushEnabled: boolean;
}

export interface UserScopedData {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  currency?: string;
  language?: AppLanguage;
}

export interface AppState {
  user: { id?: string; name: string; email: string; firstName?: string; surname?: string; photoURL?: string } | null;
  registeredUsers: RegisteredUser[];
  registeredEmails: string[];
  offlineDataByEmail?: Record<string, UserScopedData>;
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  currency: string;
  language: AppLanguage;
  notifications: NotificationSettings;
  isLoggedIn: boolean;
  pinLock: boolean;
  pin: string;
  darkMode: boolean;
  themePalette: ThemePalette;
  themeMode: ThemeMode;
  expenseCategories: string[];
  incomeCategories: string[];
}
