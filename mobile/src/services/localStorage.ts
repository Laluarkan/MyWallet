import AsyncStorage from '@react-native-async-storage/async-storage';
import { currencyService } from './currency';

const STORAGE_KEYS = {
  WALLETS: '@wallet_wallets',
  CATEGORIES: '@wallet_categories',
  TRANSACTIONS: '@wallet_transactions',
  BUDGETS: '@wallet_budgets',
  DEBTS: '@wallet_debts',
  GOALS: '@wallet_goals',
  IS_INITIALIZED: '@wallet_initialized',
};

// Data Awal Bawaan (Default Seed Data)
export const DEFAULT_WALLETS = [
  { id: 'w_cash', name: 'Uang Tunai', type: 'CASH', currency: 'IDR', currentBalance: 100000, initialBalance: 100000, color: '#10B981', icon: 'cash' },
  { id: 'w_bank', name: 'BCA Utama', type: 'BANK', currency: 'IDR', currentBalance: 2500000, initialBalance: 2500000, color: '#3B82F6', icon: 'card' },
  { id: 'w_ewallet', name: 'GoPay', type: 'EWALLET', currency: 'IDR', currentBalance: 150000, initialBalance: 150000, color: '#06B6D4', icon: 'phone-portrait' },
];

export const DEFAULT_CATEGORIES = [
  { id: 'c_food', name: 'Makanan & Minuman', type: 'EXPENSE', icon: 'restaurant', color: '#EF4444' },
  { id: 'c_transport', name: 'Transportasi & Bensin', type: 'EXPENSE', icon: 'car', color: '#F59E0B' },
  { id: 'c_shopping', name: 'Belanja Kebutuhan', type: 'EXPENSE', icon: 'cart', color: '#EC4899' },
  { id: 'c_bills', name: 'Tagihan & Utilitas', type: 'EXPENSE', icon: 'receipt', color: '#8B5CF6' },
  { id: 'c_health', name: 'Kesehatan & Obat', type: 'EXPENSE', icon: 'medkit', color: '#10B981' },
  { id: 'c_salary', name: 'Gaji Pokok', type: 'INCOME', icon: 'briefcase', color: '#10B981' },
  { id: 'c_bonus', name: 'Bonus & THR', type: 'INCOME', icon: 'gift', color: '#059669' },
  { id: 'c_freelance', name: 'Freelance & Side Project', type: 'INCOME', icon: 'laptop', color: '#0284C7' },
];

export const localStorage = {
  // Inisialisasi awal jika baru pertama buka aplikasi
  initDefaults: async () => {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
      if (!initialized) {
        await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
        await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
      }
    } catch (e) {
      console.error('Error init storage:', e);
    }
  },

  // Wallets
  getWallets: async () => {
    await localStorage.initDefaults();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    return data ? JSON.parse(data) : DEFAULT_WALLETS;
  },

  saveWallets: async (wallets: any[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },

  createWallet: async (newWallet: any) => {
    const wallets = await localStorage.getWallets();
    const wallet = {
      id: 'w_' + Date.now(),
      name: newWallet.name,
      type: newWallet.type || 'BANK',
      currency: newWallet.currency || 'IDR',
      currentBalance: Number(newWallet.initialBalance || 0),
      initialBalance: Number(newWallet.initialBalance || 0),
      color: newWallet.color || '#10B981',
      icon: newWallet.icon || 'wallet',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    wallets.push(wallet);
    await localStorage.saveWallets(wallets);
    return wallet;
  },

  adjustWalletBalance: async (id: string, actualBalance: number, notes?: string) => {
    const wallets = await localStorage.getWallets();
    const wallet = wallets.find((w: any) => w.id === id);
    if (!wallet) throw new Error('Dompet tidak ditemukan');

    const current = Number(wallet.currentBalance || 0);
    const diff = actualBalance - current;
    wallet.currentBalance = actualBalance;
    await localStorage.saveWallets(wallets);

    if (diff !== 0) {
      await localStorage.createTransaction({
        type: diff > 0 ? 'INCOME' : 'EXPENSE',
        amount: Math.abs(diff),
        sourceWalletId: id,
        notes: notes || `Penyesuaian saldo (${diff > 0 ? '+' : ''}${diff})`,
        transactionDate: new Date().toISOString(),
        skipWalletUpdate: true,
      });
    }
  },

  // Categories
  getCategories: async (type?: string) => {
    await localStorage.initDefaults();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const categories: any[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    return type ? categories.filter((c) => c.type === type) : categories;
  },

  // Transactions
  getTransactions: async (params?: any) => {
    await localStorage.initDefaults();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: any[] = data ? JSON.parse(data) : [];

    if (params?.type && params.type !== 'ALL') {
      transactions = transactions.filter((t) => t.type === params.type);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      transactions = transactions.filter((t) => t.notes?.toLowerCase().includes(q) || t.category?.name?.toLowerCase().includes(q));
    }

    return transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  },

  createTransaction: async (data: any) => {
    const [wallets, categories, transactions] = await Promise.all([
      localStorage.getWallets(),
      localStorage.getCategories(),
      localStorage.getTransactions(),
    ]);

    const sourceWallet = wallets.find((w: any) => w.id === data.sourceWalletId);
    if (!sourceWallet) throw new Error('Dompet sumber tidak ditemukan');

    const destWallet = data.destinationWalletId
      ? wallets.find((w: any) => w.id === data.destinationWalletId)
      : null;

    const category = data.categoryId
      ? categories.find((c: any) => c.id === data.categoryId)
      : null;

    const amount = Number(data.amount);
    const feeAmount = Number(data.feeAmount || 0);

    // Update Saldo Dompet (hanya jika bukan penyesuaian saldo langsung)
    if (!data.skipWalletUpdate) {
      if (data.type === 'EXPENSE') {
        sourceWallet.currentBalance = Number(sourceWallet.currentBalance) - (amount + feeAmount);
      } else if (data.type === 'INCOME') {
        sourceWallet.currentBalance = Number(sourceWallet.currentBalance) + amount;
      } else if (data.type === 'TRANSFER' && destWallet) {
        sourceWallet.currentBalance = Number(sourceWallet.currentBalance) - (amount + feeAmount);
        destWallet.currentBalance = Number(destWallet.currentBalance) + amount;
      }
    }

    const newTx = {
      id: 'tx_' + Date.now(),
      type: data.type,
      amount,
      feeAmount,
      transactionDate: data.transactionDate || new Date().toISOString(),
      notes: data.notes || '',
      sourceWalletId: data.sourceWalletId,
      sourceWallet: { name: sourceWallet.name },
      destinationWalletId: data.destinationWalletId,
      destinationWallet: destWallet ? { name: destWallet.name } : null,
      categoryId: data.categoryId,
      category: category ? { name: category.name, icon: category.icon, color: category.color } : null,
    };

    transactions.unshift(newTx);

    await Promise.all([
      localStorage.saveWallets(wallets),
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)),
    ]);

    return newTx;
  },

  deleteTransaction: async (id: string) => {
    const [wallets, transactions] = await Promise.all([
      localStorage.getWallets(),
      localStorage.getTransactions(),
    ]);

    const txIndex = transactions.findIndex((t: any) => t.id === id);
    if (txIndex === -1) return;

    const tx = transactions[txIndex];
    const sourceWallet = wallets.find((w: any) => w.id === tx.sourceWalletId);
    const destWallet = tx.destinationWalletId ? wallets.find((w: any) => w.id === tx.destinationWalletId) : null;

    const amount = Number(tx.amount);
    const fee = Number(tx.feeAmount || 0);

    // Rollback Saldo
    if (sourceWallet) {
      if (tx.type === 'EXPENSE') sourceWallet.currentBalance += amount + fee;
      if (tx.type === 'INCOME') sourceWallet.currentBalance -= amount;
      if (tx.type === 'TRANSFER') sourceWallet.currentBalance += amount + fee;
    }
    if (destWallet && tx.type === 'TRANSFER') {
      destWallet.currentBalance -= amount;
    }

    transactions.splice(txIndex, 1);

    await Promise.all([
      localStorage.saveWallets(wallets),
      AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)),
    ]);
  },

  // Budgets
  getBudgets: async () => {
    await localStorage.initDefaults();
    const [data, transactions, categories] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
      localStorage.getTransactions(),
      localStorage.getCategories('EXPENSE'),
    ]);

    const budgets: any[] = data ? JSON.parse(data) : [];

    return budgets.map((b) => {
      const cat = categories.find((c: any) => c.id === b.categoryId);
      const spent = transactions
        .filter((t: any) => t.type === 'EXPENSE' && t.categoryId === b.categoryId)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const limit = Number(b.limitAmount);
      const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;

      return {
        ...b,
        category: cat || { name: 'Kategori', color: '#10B981' },
        totalSpent: spent,
        remaining: Math.max(limit - spent, 0),
        percentage,
        isOverBudget: spent > limit,
      };
    });
  },

  createBudget: async (data: any) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    const budgets: any[] = raw ? JSON.parse(raw) : [];
    const existingIndex = budgets.findIndex((b) => b.categoryId === data.categoryId);
    const newBudget = {
      id: existingIndex !== -1 ? budgets[existingIndex].id : 'b_' + Date.now(),
      categoryId: data.categoryId,
      limitAmount: Number(data.limitAmount),
      period: 'MONTHLY',
      createdAt: new Date().toISOString(),
    };
    if (existingIndex !== -1) {
      budgets[existingIndex] = newBudget;
    } else {
      budgets.push(newBudget);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return newBudget;
  },

  applyBulkBudgets: async (allocations: { categoryId: string; limitAmount: number }[]) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: any[] = raw ? JSON.parse(raw) : [];

    for (const item of allocations) {
      const idx = budgets.findIndex((b) => b.categoryId === item.categoryId);
      if (idx !== -1) {
        budgets[idx].limitAmount = Number(item.limitAmount);
      } else {
        budgets.push({
          id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          categoryId: item.categoryId,
          limitAmount: Number(item.limitAmount),
          period: 'MONTHLY',
          createdAt: new Date().toISOString(),
        });
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return budgets;
  },

  deleteBudget: async (id: string) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: any[] = raw ? JSON.parse(raw) : [];
    budgets = budgets.filter((b) => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  // Debts
  getDebts: async (type?: string) => {
    await localStorage.initDefaults();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    let debts: any[] = data ? JSON.parse(data) : [];
    if (type) debts = debts.filter((d) => d.type === type);

    let totalDebtRemaining = 0;
    let totalReceivableRemaining = 0;

    for (const d of debts) {
      const rem = Number(d.totalAmount) - Number(d.paidAmount || 0);
      if (d.type === 'DEBT') totalDebtRemaining += rem;
      if (d.type === 'RECEIVABLE') totalReceivableRemaining += rem;
    }

    return {
      summary: { totalDebtRemaining, totalReceivableRemaining, netPosition: totalReceivableRemaining - totalDebtRemaining },
      debts,
    };
  },

  createDebt: async (data: any) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
    const debts: any[] = raw ? JSON.parse(raw) : [];
    const newDebt = {
      id: 'd_' + Date.now(),
      personName: data.personName,
      type: data.type,
      totalAmount: Number(data.totalAmount),
      paidAmount: 0,
      status: 'UNPAID',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    debts.unshift(newDebt);
    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    return newDebt;
  },

  payDebt: async (id: string, amount: number, walletId: string, notes?: string) => {
    const [raw, wallets] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.DEBTS),
      localStorage.getWallets(),
    ]);

    const debts: any[] = raw ? JSON.parse(raw) : [];
    const debt = debts.find((d) => d.id === id);
    const wallet = wallets.find((w: any) => w.id === walletId);
    if (!debt || !wallet) throw new Error('Catatan hutang atau dompet tidak ditemukan');

    const payAmount = Number(amount);
    debt.paidAmount = Number(debt.paidAmount || 0) + payAmount;
    if (debt.paidAmount >= Number(debt.totalAmount)) {
      debt.status = 'PAID';
    } else {
      debt.status = 'PARTIALLY_PAID';
    }

    if (debt.type === 'DEBT') {
      wallet.currentBalance -= payAmount;
      await localStorage.createTransaction({
        type: 'EXPENSE',
        amount: payAmount,
        sourceWalletId: walletId,
        notes: `Bayar Hutang ke ${debt.personName} (${notes || ''})`,
      });
    } else {
      wallet.currentBalance += payAmount;
      await localStorage.createTransaction({
        type: 'INCOME',
        amount: payAmount,
        sourceWalletId: walletId,
        notes: `Terima Pelunasan Piutang dari ${debt.personName} (${notes || ''})`,
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    await localStorage.saveWallets(wallets);
  },

  // Goals
  getGoals: async () => {
    await localStorage.initDefaults();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: any[] = data ? JSON.parse(data) : [];

    return goals.map((g) => {
      const cur = Number(g.currentAmount || 0);
      const tar = Number(g.targetAmount);
      return {
        ...g,
        percentage: tar > 0 ? Math.min(Math.round((cur / tar) * 100), 100) : 0,
        remaining: Math.max(tar - cur, 0),
        isCompleted: cur >= tar,
      };
    });
  },

  createGoal: async (data: any) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: any[] = raw ? JSON.parse(raw) : [];
    const newGoal = {
      id: 'g_' + Date.now(),
      name: data.name,
      targetAmount: Number(data.targetAmount),
      currentAmount: 0,
      color: '#3B82F6',
      icon: 'flag',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return newGoal;
  },

  depositGoal: async (id: string, amount: number, walletId: string) => {
    const [raw, wallets] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.GOALS),
      localStorage.getWallets(),
    ]);

    const goals: any[] = raw ? JSON.parse(raw) : [];
    const goal = goals.find((g) => g.id === id);
    const wallet = wallets.find((w: any) => w.id === walletId);
    if (!goal || !wallet) throw new Error('Target tabungan atau dompet tidak ditemukan');

    const dep = Number(amount);
    wallet.currentBalance -= dep;
    goal.currentAmount = Number(goal.currentAmount || 0) + dep;

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),
      localStorage.saveWallets(wallets),
    ]);
  },

  withdrawGoal: async (id: string, amount: number, walletId: string) => {
    const [raw, wallets] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.GOALS),
      localStorage.getWallets(),
    ]);

    const goals: any[] = raw ? JSON.parse(raw) : [];
    const goal = goals.find((g) => g.id === id);
    const wallet = wallets.find((w: any) => w.id === walletId);
    if (!goal || !wallet) throw new Error('Target tabungan atau dompet tidak ditemukan');

    const wdr = Number(amount);
    wallet.currentBalance += wdr;
    goal.currentAmount = Math.max(Number(goal.currentAmount || 0) - wdr, 0);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),
      localStorage.saveWallets(wallets),
    ]);
  },

  // Reset Total ke 0
  resetAll: async (options?: { clearTransactions?: boolean; resetGoals?: boolean; resetDebts?: boolean }) => {
    const wallets = await localStorage.getWallets();
    for (const w of wallets) {
      w.currentBalance = 0;
      w.initialBalance = 0;
    }
    await localStorage.saveWallets(wallets);

    if (options?.clearTransactions !== false) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
    if (options?.resetGoals) {
      const goals = await localStorage.getGoals();
      for (const g of goals) {
        g.currentAmount = 0;
        g.isCompleted = false;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }
    if (options?.resetDebts) {
      await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
    }
  },

  // Overview Dashboard
  getOverview: async () => {
    const [wallets, transactions, debtsRes] = await Promise.all([
      localStorage.getWallets(),
      localStorage.getTransactions(),
      localStorage.getDebts(),
    ]);

    const usdRate = await currencyService.getRate();

    const totalNetWorth = wallets.reduce((sum: number, w: any) => {
      const bal = Number(w.currentBalance || 0);
      const inIdr = w.currency === 'USD' ? Math.round(bal * usdRate) : bal;
      return sum + inIdr;
    }, 0);

    // Bulan berjalan
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const d = new Date(t.transactionDate);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        if (t.type === 'INCOME') income += Number(t.amount);
        if (t.type === 'EXPENSE') expense += Number(t.amount) + Number(t.feeAmount || 0);
      }
    }

    return {
      totalNetWorth,
      monthly: {
        income,
        expense,
        netCashFlow: income - expense,
      },
      debts: {
        debtToPay: debtsRes.summary.totalDebtRemaining,
        receivableToCollect: debtsRes.summary.totalReceivableRemaining,
      },
      wallets,
      recentTransactions: transactions.slice(0, 5),
    };
  },

  // Category Breakdown for Reports
  getCategoryBreakdown: async (month?: number, year?: number) => {
    const transactions = await localStorage.getTransactions();
    const now = new Date();
    const curYear = year !== undefined ? year : now.getFullYear();
    const curMonth = month !== undefined ? month : now.getMonth();

    const catMap: { [key: string]: { name: string; color: string; icon: string; total: number; count: number } } = {};
    const incomeCatMap: { [key: string]: { name: string; color: string; icon: string; total: number; count: number } } = {};
    let totalExpense = 0;
    let totalIncome = 0;
    let txCount = 0;

    for (const t of transactions) {
      const d = new Date(t.transactionDate);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        txCount++;
        const amt = Number(t.amount);
        const fee = Number(t.feeAmount || 0);

        if (t.type === 'EXPENSE') {
          totalExpense += amt + fee;
          const catName = t.category?.name || 'Lain-lain';
          const catColor = t.category?.color || '#EF4444';
          const catIcon = t.category?.icon || 'pricetag';

          if (!catMap[catName]) {
            catMap[catName] = { name: catName, color: catColor, icon: catIcon, total: 0, count: 0 };
          }
          catMap[catName].total += amt + fee;
          catMap[catName].count++;
        } else if (t.type === 'INCOME') {
          totalIncome += amt;
          const catName = t.category?.name || 'Pemasukan Lain';
          const catColor = t.category?.color || '#10B981';
          const catIcon = t.category?.icon || 'cash';

          if (!incomeCatMap[catName]) {
            incomeCatMap[catName] = { name: catName, color: catColor, icon: catIcon, total: 0, count: 0 };
          }
          incomeCatMap[catName].total += amt;
          incomeCatMap[catName].count++;
        }
      }
    }

    const expenseBreakdown = Object.values(catMap)
      .map((c) => ({
        ...c,
        percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const incomeBreakdown = Object.values(incomeCatMap)
      .map((c) => ({
        ...c,
        percentage: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const netCashFlow = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? Math.max(Math.round((netCashFlow / totalIncome) * 100), 0) : 0;

    return {
      month: curMonth,
      year: curYear,
      totalExpense,
      totalIncome,
      netCashFlow,
      savingRate,
      txCount,
      breakdown: expenseBreakdown,
      expenseBreakdown,
      incomeBreakdown,
    };
  },

  // Monthly Trend for Reports
  getMonthlyTrend: async (refMonth?: number, refYear?: number) => {
    const transactions = await localStorage.getTransactions();
    const now = new Date();
    const baseYear = refYear !== undefined ? refYear : now.getFullYear();
    const baseMonth = refMonth !== undefined ? refMonth : now.getMonth();
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseYear, baseMonth - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();

      let inc = 0;
      let exp = 0;

      for (const t of transactions) {
        const txDate = new Date(t.transactionDate);
        if (txDate.getFullYear() === yr && txDate.getMonth() === mo) {
          if (t.type === 'INCOME') inc += Number(t.amount);
          if (t.type === 'EXPENSE') exp += Number(t.amount) + Number(t.feeAmount || 0);
        }
      }

      trend.push({
        month: d.toLocaleString('id-ID', { month: 'short' }),
        monthIndex: mo,
        year: yr,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    return trend;
  },
};
