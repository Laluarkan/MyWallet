import { Platform } from 'react-native';
import { localStorage } from './localStorage';

// =========================================================================
// KONFIGURASI MODE ARSITEKTUR
// =========================================================================
// Jika ingin menggunakan backend cloud (Render), masukkan URL Anda di sini:
// Contoh: 'https://project-wallet-api.onrender.com/api'
export const RENDER_BACKEND_URL = '';

// Jika RENDER_BACKEND_URL kosong, aplikasi OTOMATIS berjalan dalam mode:
// "LOCAL-FIRST / OFFLINE-FIRST" (Semua data tersimpan permanen di HP Anda tanpa server)
export const USE_CLOUD_BACKEND = Boolean(RENDER_BACKEND_URL);

export const DEV_MACHINE_IP = '192.168.23.26';

export const API_BASE_URL = RENDER_BACKEND_URL
  ? RENDER_BACKEND_URL
  : Platform.select({
      web: 'http://localhost:5000/api',
      default: `http://${DEV_MACHINE_IP}:5000/api`,
    });

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (
      error.name === 'AbortError' ||
      error.message?.toLowerCase().includes('aborted') ||
      error.message?.toLowerCase().includes('canceled')
    ) {
      throw new Error(
        `Koneksi ke server (${API_BASE_URL}) terputus atau waktu habis. Pastikan backend aktif.`
      );
    }
    throw error;
  }
}

export const api = {
  // Overview & Reports
  getOverview: async () => {
    if (!USE_CLOUD_BACKEND) return localStorage.getOverview();
    try {
      return await request<any>('/reports/dashboard-overview');
    } catch {
      return localStorage.getOverview();
    }
  },

  getCategoryBreakdown: async (month?: number, year?: number) => {
    if (!USE_CLOUD_BACKEND) return localStorage.getCategoryBreakdown();
    try {
      const query = month && year ? `?month=${month}&year=${year}` : '';
      return await request<any>(`/reports/category-breakdown${query}`);
    } catch {
      return localStorage.getCategoryBreakdown();
    }
  },

  getMonthlyTrend: async () => {
    if (!USE_CLOUD_BACKEND) return localStorage.getMonthlyTrend();
    try {
      return await request<any>('/reports/monthly-trend');
    } catch {
      return localStorage.getMonthlyTrend();
    }
  },

  // Wallets
  getWallets: async () => {
    if (!USE_CLOUD_BACKEND) return localStorage.getWallets();
    try {
      const res = await request<any>('/wallets');
      return res.wallets;
    } catch {
      return localStorage.getWallets();
    }
  },

  createWallet: async (data: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.createWallet(data);
    try {
      return await request<any>('/wallets', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return localStorage.createWallet(data);
    }
  },

  adjustWalletBalance: async (id: string, actualBalance: number, notes?: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.adjustWalletBalance(id, actualBalance, notes);
    try {
      return await request<any>(`/wallets/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ actualBalance, notes }),
      });
    } catch {
      return localStorage.adjustWalletBalance(id, actualBalance, notes);
    }
  },

  resetAllFunds: async (options?: { clearTransactions?: boolean; resetGoals?: boolean; resetDebts?: boolean }) => {
    if (!USE_CLOUD_BACKEND) {
      await localStorage.resetAll(options);
      return { success: true, message: 'Seluruh saldo dana lokal berhasil direset ke Rp 0' };
    }
    try {
      return await request<any>('/wallets/reset-all', {
        method: 'POST',
        body: JSON.stringify(options || { clearTransactions: true }),
      });
    } catch {
      await localStorage.resetAll(options);
      return { success: true, message: 'Seluruh saldo dana lokal berhasil direset ke Rp 0' };
    }
  },

  // Categories
  getCategories: async (type?: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.getCategories(type);
    try {
      const query = type ? `?type=${type}` : '';
      return await request<any>(`/categories${query}`);
    } catch {
      return localStorage.getCategories(type);
    }
  },

  // Transactions
  getTransactions: async (params?: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.getTransactions(params);
    try {
      const searchParams = new URLSearchParams(params || {}).toString();
      const query = searchParams ? `?${searchParams}` : '';
      const res = await request<any>(`/transactions${query}`);
      return res.transactions;
    } catch {
      return localStorage.getTransactions(params);
    }
  },

  createTransaction: async (data: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.createTransaction(data);
    try {
      return await request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return localStorage.createTransaction(data);
    }
  },

  deleteTransaction: async (id: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.deleteTransaction(id);
    try {
      return await request<any>(`/transactions/${id}`, { method: 'DELETE' });
    } catch {
      return localStorage.deleteTransaction(id);
    }
  },

  // Budgets
  getBudgets: async () => {
    if (!USE_CLOUD_BACKEND) return localStorage.getBudgets();
    try {
      return await request<any[]>('/budgets');
    } catch {
      return localStorage.getBudgets();
    }
  },

  createBudget: async (data: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.createBudget(data);
    try {
      return await request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return localStorage.createBudget(data);
    }
  },

  deleteBudget: async (id: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.deleteBudget(id);
    try {
      return await request<any>(`/budgets/${id}`, { method: 'DELETE' });
    } catch {
      return localStorage.deleteBudget(id);
    }
  },

  // Debts & Loans
  getDebts: async (type?: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.getDebts(type);
    try {
      const query = type ? `?type=${type}` : '';
      return await request<any>(`/debts${query}`);
    } catch {
      return localStorage.getDebts(type);
    }
  },

  createDebt: async (data: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.createDebt(data);
    try {
      return await request<any>('/debts', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return localStorage.createDebt(data);
    }
  },

  payDebt: async (id: string, amount: number, walletId: string, notes?: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.payDebt(id, amount, walletId, notes);
    try {
      return await request<any>(`/debts/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount, walletId, notes }),
      });
    } catch {
      return localStorage.payDebt(id, amount, walletId, notes);
    }
  },

  // Savings Goals
  getGoals: async () => {
    if (!USE_CLOUD_BACKEND) return localStorage.getGoals();
    try {
      return await request<any[]>('/goals');
    } catch {
      return localStorage.getGoals();
    }
  },

  createGoal: async (data: any) => {
    if (!USE_CLOUD_BACKEND) return localStorage.createGoal(data);
    try {
      return await request<any>('/goals', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return localStorage.createGoal(data);
    }
  },

  depositGoal: async (id: string, amount: number, walletId: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.depositGoal(id, amount, walletId);
    try {
      return await request<any>(`/goals/${id}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount, walletId }),
      });
    } catch {
      return localStorage.depositGoal(id, amount, walletId);
    }
  },

  withdrawGoal: async (id: string, amount: number, walletId: string) => {
    if (!USE_CLOUD_BACKEND) return localStorage.withdrawGoal(id, amount, walletId);
    try {
      return await request<any>(`/goals/${id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ amount, walletId }),
      });
    } catch {
      return localStorage.withdrawGoal(id, amount, walletId);
    }
  },
};
