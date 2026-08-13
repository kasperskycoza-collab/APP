import { AppLanguage } from './types';

export interface CurrencyInfo {
  code: string;
  nameEn: string;
  nameSw: string;
  symbol: string;
  flag?: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'TZS', nameEn: 'Tanzanian Shilling', nameSw: 'Shilingi ya Tanzania', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'USD', nameEn: 'US Dollar', nameSw: 'Dola ya Marekani', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', nameEn: 'Euro', nameSw: 'Yuro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', nameEn: 'British Pound', nameSw: 'Pauni ya Uingereza', symbol: '£', flag: '🇬🇧' },
  { code: 'KES', nameEn: 'Kenyan Shilling', nameSw: 'Shilingi ya Kenya', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'UGX', nameEn: 'Ugandan Shilling', nameSw: 'Shilingi ya Uganda', symbol: 'USh', flag: '🇺🇬' },
  { code: 'RWF', nameEn: 'Rwandan Franc', nameSw: 'Faranga ya Rwanda', symbol: 'FRw', flag: '🇷🇼' },
  { code: 'ZAR', nameEn: 'South African Rand', nameSw: 'Randi ya Afrika Kusini', symbol: 'R', flag: '🇿🇦' },
  { code: 'NGN', nameEn: 'Nigerian Naira', nameSw: 'Naira ya Nigeria', symbol: '₦', flag: '🇳🇬' },
  { code: 'INR', nameEn: 'Indian Rupee', nameSw: 'Rupia ya India', symbol: '₹', flag: '🇮🇳' },
  { code: 'CAD', nameEn: 'Canadian Dollar', nameSw: 'Dola ya Kanada', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', nameEn: 'Australian Dollar', nameSw: 'Dola ya Australia', symbol: 'A$', flag: '🇦🇺' },
  { code: 'AED', nameEn: 'UAE Dirham', nameSw: 'Dirham ya Falme za Kiarabu', symbol: 'AED', flag: '🇦🇪' },
  { code: 'CNY', nameEn: 'Chinese Yuan', nameSw: 'Yuan ya China', symbol: '¥', flag: '🇨🇳' },
  { code: 'JPY', nameEn: 'Japanese Yen', nameSw: 'Yeni ya Japani', symbol: '¥', flag: '🇯🇵' },
];

export const getCurrencyFullName = (code: string, lang: AppLanguage = 'en'): string => {
  const found = CURRENCIES.find(c => c.code.toUpperCase() === (code || '').toUpperCase());
  if (!found) return code;
  return lang === 'sw' 
    ? `${found.code} - ${found.nameSw}` 
    : `${found.code} - ${found.nameEn}`;
};

export const translations = {
  en: {
    // Navigation
    navDashboard: 'Dashboard',
    navTransactions: 'Transactions',
    navGoals: 'Goals',
    navAudit: 'Audit',
    navProfile: 'Profile',
    navAdd: 'Add',

    // App headers
    dashboardOverview: 'Financial Overview',
    cashBookRegister: 'Cash Book Register',
    auditAnalytics: 'Audit & Analytics',
    savingsGoalsManager: 'Savings Goals Manager',

    // Dashboard
    totalBalance: 'Total Balance',
    totalSavingsBalance: 'Total Savings Balance',
    totalSavingsTarget: 'Total Goals Savings Target',
    totalInflow: 'Total Inflow',
    totalOutflow: 'Total Outflow',
    transactions: 'Transactions',
    netSavings: 'Net Savings',
    todaySummary: "Today's Summary",
    todayIncome: "Today's Income",
    todayExpense: "Today's Expense",
    todayNet: "Today's Net",
    cashFlowTrends: 'Cash Flow Trends',
    cashFlowDesc: 'Monthly income vs expense overview',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    noRecentTransactions: 'No recent transactions recorded.',
    addYourFirstTransaction: 'Add your first transaction to start tracking.',
    addNewTransaction: 'Add Transaction',
    addTransaction: 'Add Transaction',
    targetProgress: 'Target Progress',
    savingsProgress: 'Savings Goals Progress',
    goal: 'Goal',
    all: 'All',

    // Transactions
    allTransactions: 'All Transactions',
    filterBy: 'Filter',
    searchTransactions: 'Search by description or category...',
    searchPlaceholder: 'Search description, category, or notes...',
    allAccounts: 'All Accounts',
    allCategories: 'All Categories',
    allTypes: 'All Types',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    description: 'Description',
    account: 'Account',
    paymentMethod: 'Payment Method',
    notes: 'Description / Notes',
    noTransactionsFound: 'No transactions found.',
    dailyBreakdown: 'Daily Breakdown',
    monthlyLedger: 'Monthly Ledger',
    inflow: 'Inflow',
    outflow: 'Outflow',
    net: 'Net',
    edit: 'Edit',
    delete: 'Delete',

    // Goals
    savingsGoals: 'Savings Goals',
    mySavingsGoals: 'My Savings Goals',
    addGoal: 'Add Goal',
    createGoal: 'Create Savings Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    currentSaved: 'Current Saved',
    deadline: 'Target Deadline',
    fundGoal: 'Fund Goal',
    allocateSavings: 'Allocate Funds',
    noGoalsYet: 'No savings goals set yet.',
    noGoalsSet: 'No savings goals set yet',
    startSavingNow: 'Set a target for your emergency fund, dream car, or house.',
    goalCompleted: 'Completed 🎉',
    goalRemaining: 'Remaining',
    allocateFromAccount: 'Fund from Account',

    // Analysis / Audit
    financialAudit: 'Financial Audit',
    auditSubtitle: 'Deep dive into your cash flows & habits',
    expenseBreakdown: 'Expense Breakdown',
    incomeBreakdown: 'Income Breakdown',
    periodAll: 'All Time',
    periodMonth: 'This Month',
    periodLastMonth: 'Last Month',
    periodYear: 'This Year',
    exportPdfReport: 'Export PDF Report',
    exportPdfSubtitle: 'Generate stamped PDF statement',
    topSpendingCategories: 'Top Spending Categories',
    auditOverview: 'Audit Overview',
    netProfitRate: 'Savings Rate',

    // Profile & Settings
    profileTitle: 'Profile & Settings',
    sectionFinancial: 'Financial & Account Management',
    sectionSecurityData: 'Security & Data Vault',
    sectionAppPreferences: 'Preferences & System Settings',
    userProfile: 'User Profile',
    offlineMode: 'Offline Mode',
    syncedAccount: 'Synced Account',
    themeVisualStyling: 'Theme & Visual Styling',
    themeDesc: 'Ubuntu 26.04 Orange or Classic Dream',
    myAccounts: 'My Accounts',
    myAccountsDesc: 'Manage multiple savings & bank accounts',
    budgetPlanning: 'Budget Planning',
    budgetPlanningDesc: 'Set monthly spending limits per category',
    currencySettings: 'Currency Settings',
    currencyDesc: 'Select active display currency',
    languageSettings: 'Language / Lugha',
    languageDesc: 'Choose English 🇬🇧 or Swahili 🇹🇿',
    manageCategories: 'Manage Categories',
    manageCategoriesDesc: 'Add, edit or delete income & expense categories',
    cloudSync: 'Cloud Backup',
    cloudSyncDesc: 'Backup securely to Google Cloud Sync',
    cloudRestore: 'Cloud Restore',
    cloudRestoreDesc: 'Restore latest cloud snapshot',
    darkThemeQuick: 'Dark Mode Quick Toggle',
    pinSecurity: 'PIN Security Lock',
    pinSecurityDesc: 'Protect your financial data with a 4-digit PIN',
    exportBackup: 'Export Backup',
    exportBackupDesc: 'Save data to a JSON backup file',
    importBackup: 'Import Backup',
    importBackupDesc: 'Restore data from a JSON backup file',
    notifications: 'Notifications & Alerts',
    notificationsDesc: 'Savings reminders, budget warnings & alerts',
    logout: 'Log Out',
    applyAndDone: 'Apply & Done',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',

    // Notifications Modal
    notificationSettingsTitle: 'Notification Settings',
    notificationsEnabled: 'Notifications Enabled',
    notificationsDisabled: 'Notifications Disabled',
    dailyReminders: 'Daily Savings Reminders',
    dailyRemindersDesc: 'Remind me to log daily expenses & save',
    goalAlerts: 'Goal Achievement Alerts',
    goalAlertsDesc: 'Notify when milestone or 100% target is reached',
    budgetAlerts: 'Budget Limit Warnings',
    budgetAlertsDesc: 'Alert immediately when nearing category budget limit',
    weeklySummary: 'Weekly Financial Summary',
    weeklySummaryDesc: 'Deliver weekly overview of savings progress',
    pushNotifications: 'Browser Push Notifications',
    pushNotificationsDesc: 'Allow system notifications on this device',
    sendTestNotification: 'Send Test Notification',
    testNotificationSent: 'Test notification triggered!',
    testNotificationBody: 'Your Simzy Expense & Savings notifications are working perfectly.',

    // Currency Modal
    selectCurrencyTitle: 'Select Currency',
    searchCurrency: 'Search currency by name or code...',

    // Language Modal
    selectLanguageTitle: 'Select Language / Chagua Lugha',
    englishBritain: 'English (United Kingdom)',
    swahiliTanzania: 'Kiswahili (Tanzania)',

    // Categories
    cat_food: 'Food & Dining',
    cat_transport: 'Transportation',
    cat_rent: 'Rent & Housing',
    cat_shopping: 'Shopping',
    cat_bills: 'Bills & Utilities',
    cat_health: 'Health & Medical',
    cat_education: 'Education',
    cat_salary: 'Salary & Wages',
    cat_freelance: 'Freelance & Business',
    cat_investments: 'Investments',
    cat_gifts: 'Gifts & Donations',
    cat_transfer: 'Account Transfer',
    cat_other: 'Other',

    // Payment Methods
    pm_cash: 'Cash',
    pm_bank: 'Bank Transfer',
    pm_mobile_money: 'Mobile Money (M-Pesa, etc.)',
    pm_mobile: 'Mobile Money',
    pm_card: 'Card',
    pm_other: 'Other',

    // Common Messages
    confirmDelete: 'Are you sure you want to delete this?',
    actionUndone: 'This action cannot be undone.',
    savedSuccessfully: 'Saved successfully!',
    deletedSuccessfully: 'Deleted successfully!',
    enterPin: 'Enter your 4-digit PIN',
    unlockApp: 'Unlock Financial Vault',
    incorrectPin: 'Incorrect PIN. Please try again.',
  },

  sw: {
    // Navigation
    navDashboard: 'Dashibodi',
    navTransactions: 'Miamala',
    navGoals: 'Malengo',
    navAudit: 'Ukaguzi',
    navProfile: 'Wasifu',
    navAdd: 'Weka',

    // App headers
    dashboardOverview: 'Muhtasari wa Fedha',
    cashBookRegister: 'Daftari la Fedha',
    auditAnalytics: 'Ukaguzi na Takwimu',
    savingsGoalsManager: 'Meneja wa Malengo ya Akiba',

    // Dashboard
    totalBalance: 'Salio Kamili la Fedha',
    totalSavingsBalance: 'Jumla ya Salio la Akiba',
    totalSavingsTarget: 'Jumla ya Malengo ya Akiba',
    totalInflow: 'Jumla Iliyoingia',
    totalOutflow: 'Jumla Iliyotoka',
    transactions: 'Miamala',
    netSavings: 'Akiba Halisi',
    todaySummary: 'Muhtasari wa Leo',
    todayIncome: 'Mapato ya Leo',
    todayExpense: 'Matumizi ya Leo',
    todayNet: 'Salio Halisi la Leo',
    cashFlowTrends: 'Mwenendo wa Fedha',
    cashFlowDesc: 'Mlinganisho wa mapato na matumizi ya mwezi',
    recentTransactions: 'Miamala ya Hivi Karibuni',
    viewAll: 'Tazama Yote',
    noRecentTransactions: 'Hakuna miamala ya hivi karibuni.',
    addYourFirstTransaction: 'Weka muamala wako wa kwanza kuanza kufuatilia fedha.',
    addNewTransaction: 'Weka Muamala',
    addTransaction: 'Weka Muamala',
    targetProgress: 'Maendeleo ya Lengo',
    savingsProgress: 'Maendeleo ya Malengo ya Akiba',
    goal: 'Lengo',
    all: 'Yote',

    // Transactions
    allTransactions: 'Miamala Yote',
    filterBy: 'Chuja',
    searchTransactions: 'Tafuta kwa maelezo au kundi...',
    searchPlaceholder: 'Tafuta maelezo, kundi, au vidokezo...',
    allAccounts: 'Akaunti Zote',
    allCategories: 'Makundi Yote',
    allTypes: 'Aina Zote',
    income: 'Mapato',
    expense: 'Matumizi',
    transfer: 'Uhamisho',
    amount: 'Kiasi',
    category: 'Kundi',
    date: 'Tarehe',
    description: 'Maelezo',
    account: 'Akaunti',
    paymentMethod: 'Njia ya Malipo',
    notes: 'Maelezo / Vidokezo',
    noTransactionsFound: 'Hakuna miamala iliyopatikana.',
    dailyBreakdown: 'Mchanganuo wa Kila Siku',
    monthlyLedger: 'Daftari la Mwezi',
    inflow: 'Kuingia',
    outflow: 'Kutoka',
    net: 'Halisi',
    edit: 'Hariri',
    delete: 'Futa',

    // Goals
    savingsGoals: 'Malengo ya Akiba',
    mySavingsGoals: 'Malengo Yangu ya Akiba',
    addGoal: 'Weka Lengo',
    createGoal: 'Unda Lengo Jipya la Akiba',
    goalName: 'Jina la Lengo',
    targetAmount: 'Kiasi Kinacholengwa',
    currentSaved: 'Kiasi Kilichohifadhiwa',
    deadline: 'Tarehe ya Ukomo',
    fundGoal: 'Weka Pesa kwenye Lengo',
    allocateSavings: 'Gawa Fedha',
    noGoalsYet: 'Bado hujaweka malengo ya akiba.',
    noGoalsSet: 'Bado hujaweka malengo ya akiba',
    startSavingNow: 'Weka lengo la dharura, ununuzi wa gari, au ujenzi wa nyumba.',
    goalCompleted: 'Lengo Limetimia 🎉',
    goalRemaining: 'Zilizobaki',
    allocateFromAccount: 'Weka kutoka Akaunti',

    // Analysis / Audit
    financialAudit: 'Ukaguzi na Uchambuzi wa Fedha',
    auditSubtitle: 'Tathmini ya kina ya mzunguko wa fedha na tabia za matumizi',
    expenseBreakdown: 'Mgawanyo wa Matumizi',
    incomeBreakdown: 'Mgawanyo wa Mapato',
    periodAll: 'Muda Wote',
    periodMonth: 'Mwezi Huu',
    periodLastMonth: 'Mwezi Uliopita',
    periodYear: 'Mwaka Huu',
    exportPdfReport: 'Pakua Ripoti ya PDF',
    exportPdfSubtitle: 'Tengeneza ripoti rasmi yenye mihuri ya kidijitali',
    topSpendingCategories: 'Makundi Yenye Matumizi Makubwa',
    auditOverview: 'Muhtasari wa Ukaguzi',
    netProfitRate: 'Kiwango cha Akiba',

    // Profile & Settings
    profileTitle: 'Wasifu na Mipangilio',
    sectionFinancial: 'Usimamizi wa Fedha na Akaunti',
    sectionSecurityData: 'Ulinzi na Uhifadhi wa Data',
    sectionAppPreferences: 'Mapendeleo na Muonekano',
    userProfile: 'Wasifu wa Mtumiaji',
    offlineMode: 'Hali ya Nje ya Mtandao',
    syncedAccount: 'Akaunti Iliyounganishwa',
    themeVisualStyling: 'Mandhari na Muonekano',
    themeDesc: 'Ubuntu 26.04 Chungwa au Dream Asilia',
    myAccounts: 'Akaunti Zangu',
    myAccountsDesc: 'Simamia akaunti zako mbalimbali za benki na akiba',
    budgetPlanning: 'Upangaji wa Bajeti',
    budgetPlanningDesc: 'Weka ukomo wa matumizi ya kila mwezi kwa makundi',
    currencySettings: 'Mipangilio ya Sarafu',
    currencyDesc: 'Chagua sarafu kuu ya kuonyesha',
    languageSettings: 'Lugha / Language',
    languageDesc: 'Chagua Kiswahili 🇹🇿 au Kiingereza 🇬🇧',
    manageCategories: 'Simamia Makundi',
    manageCategoriesDesc: 'Ongeza au rekebisha makundi ya mapato na matumizi',
    cloudSync: 'Hifadhi Nakala ya Wingu',
    cloudSyncDesc: 'Hifadhi nakala salama kupitia Google Cloud Sync',
    cloudRestore: 'Rejesha kutoka Wingu',
    cloudRestoreDesc: 'Rejesha data yako ya hivi karibuni kutoka wingu',
    darkThemeQuick: 'Badili Mandhari ya Giza',
    pinSecurity: 'Ulinzi wa PIN',
    pinSecurityDesc: 'Linda data zako za kifedha kwa PIN ya tarakimu 4',
    exportBackup: 'Pakua Nakala (JSON)',
    exportBackupDesc: 'Hifadhi data zako zote kwenye faili la JSON',
    importBackup: 'Rejesha Nakala (JSON)',
    importBackupDesc: 'Rejesha data kutoka kwenye faili la JSON',
    notifications: 'Arifa na Vikumbusho',
    notificationsDesc: 'Vikumbusho vya kuweka akiba, maonyo ya bajeti na arifa',
    logout: 'Ondoka',
    applyAndDone: 'Tumia na Maliza',
    close: 'Funga',
    save: 'Hifadhi',
    cancel: 'Ghairi',

    // Notifications Modal
    notificationSettingsTitle: 'Mipangilio ya Arifa',
    notificationsEnabled: 'Arifa Zimewashwa',
    notificationsDisabled: 'Arifa Zimezimwa',
    dailyReminders: 'Vikumbusho vya Akiba vya Kila Siku',
    dailyRemindersDesc: 'Nikumbushe kurekodi matumizi ya kila siku na kuweka akiba',
    goalAlerts: 'Arifa za Kufikia Malengo',
    goalAlertsDesc: 'Niarifu ninapofikia hatua muhimu au 100% ya lengo',
    budgetAlerts: 'Maonyo ya Ukomo wa Bajeti',
    budgetAlertsDesc: 'Niarifu mara moja ninapokaribia ukomo wa bajeti ya kundi',
    weeklySummary: 'Muhtasari wa Fedha wa Kila Wiki',
    weeklySummaryDesc: 'Nipatie muhtasari wa kila wiki wa maendeleo ya akiba',
    pushNotifications: 'Arifa za Kivinjari (Push)',
    pushNotificationsDesc: 'Ruhusu arifa za mfumo kwenye kifaa hiki',
    sendTestNotification: 'Tuma Arifa ya Majaribio',
    testNotificationSent: 'Arifa ya majaribio imetumwa!',
    testNotificationBody: 'Taarifa zako za Simzy Expense & Savings zinafanya kazi kikamilifu.',

    // Currency Modal
    selectCurrencyTitle: 'Chagua Sarafu',
    searchCurrency: 'Tafuta sarafu kwa jina au herufi...',

    // Language Modal
    selectLanguageTitle: 'Chagua Lugha / Select Language',
    englishBritain: 'English (Uingereza) 🇬🇧',
    swahiliTanzania: 'Kiswahili (Tanzania) 🇹🇿',

    // Categories
    cat_food: 'Chakula na Vinywaji',
    cat_transport: 'Usafiri na Safari',
    cat_rent: 'Kodi ya Nyumba & Makazi',
    cat_shopping: 'Manunuzi',
    cat_bills: 'Bili na Huduma za Umma',
    cat_health: 'Afya na Matibabu',
    cat_education: 'Elimu na Mafunzo',
    cat_salary: 'Mshahara na Mapato',
    cat_freelance: 'Kazi Binafsi & Biashara',
    cat_investments: 'Uwekezaji & Faida',
    cat_gifts: 'Zawadi na Ruzuku',
    cat_transfer: 'Uhamisho wa Akaunti',
    cat_other: 'Mengineyo',

    // Payment Methods
    pm_cash: 'Fedha Taslimu (Cash)',
    pm_bank: 'Benki (Bank Transfer)',
    pm_mobile_money: 'Pesa ya Simu (M-Pesa / Tigo / Airtel)',
    pm_mobile: 'Pesa ya Simu',
    pm_card: 'Kadi ya Benki (Card)',
    pm_other: 'Njia Nyingine',

    // Common Messages
    confirmDelete: 'Je, una uhakika unataka kufuta hii?',
    actionUndone: 'Kitendo hiki hakiwezi kubatilishwa.',
    savedSuccessfully: 'Imehifadhiwa kikamilifu!',
    deletedSuccessfully: 'Imefutwa kikamilifu!',
    enterPin: 'Weka PIN yako ya tarakimu 4',
    unlockApp: 'Fungua Sanduku la Fedha',
    incorrectPin: 'PIN siyo sahihi. Tafadhali jaribu tena.',
  }
};

export const getCategoryTranslation = (cat: string, lang: AppLanguage = 'en'): string => {
  const t = translations[lang] as Record<string, string>;
  const key = `cat_${cat.toLowerCase().trim()}`;
  if (t[key]) return t[key];
  return cat;
};

export const getPaymentMethodTranslation = (pm: string, lang: AppLanguage = 'en'): string => {
  const t = translations[lang] as Record<string, string>;
  const key = `pm_${pm.toLowerCase().trim().replace(/[\s-]+/g, '_')}`;
  if (t[key]) return t[key];
  return pm;
};
