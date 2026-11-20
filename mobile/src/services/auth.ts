import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, USE_CLOUD_BACKEND } from './api';
import { localStorage } from './localStorage';

const AUTH_STORAGE_KEY = '@wallet_auth_session';

export interface UserSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tier: string;
  };
}

export const authService = {
  // Ambil sesi login lokal saat ini (null jika mode tamu / belum login)
  getSession: async (): Promise<UserSession | null> => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Simpan sesi login ke storage lokal
  saveSession: async (session: UserSession) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },

  // Logout / Keluar
  logout: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Login akun
  login: async (email: string, password: string): Promise<UserSession> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal login ke server');
    }

    const session: UserSession = {
      token: data.data.token,
      user: data.data.user,
    };

    await authService.saveSession(session);
    return session;
  },

  // Registrasi akun baru
  register: async (name: string, email: string, password: string): Promise<UserSession> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal registrasi akun');
    }

    const session: UserSession = {
      token: data.data.token,
      user: data.data.user,
    };

    await authService.saveSession(session);
    return session;
  },

  // Cadangkan data keuangan lokal HP ke akun cloud (hanya jika login)
  backupToCloud: async () => {
    const session = await authService.getSession();
    if (!session) throw new Error('Silakan login terlebih dahulu untuk mencadangkan data');

    // Ambil seluruh data lokal
    const [wallets, categories, transactions, budgets, debts, goals] = await Promise.all([
      localStorage.getWallets(),
      localStorage.getCategories(),
      localStorage.getTransactions(),
      localStorage.getBudgets(),
      localStorage.getDebts(),
      localStorage.getGoals(),
    ]);

    const backupPayload = {
      wallets,
      categories,
      transactions,
      budgets,
      debts,
      goals,
      exportedAt: new Date().toISOString(),
    };

    const res = await fetch(`${API_BASE_URL}/backup/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        payload: backupPayload,
        backupName: `Cadangan ${new Date().toLocaleDateString('id-ID')}`,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mencadangkan data');
    return data;
  },

  // Pulihkan data dari cloud ke HP
  restoreFromCloud: async () => {
    const session = await authService.getSession();
    if (!session) throw new Error('Silakan login terlebih dahulu untuk memulihkan cadangan');

    const res = await fetch(`${API_BASE_URL}/backup/latest`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Tidak ada cadangan ditemukan');

    const payload = data.data.payload;
    if (payload.wallets) await AsyncStorage.setItem('@wallet_wallets', JSON.stringify(payload.wallets));
    if (payload.categories) await AsyncStorage.setItem('@wallet_categories', JSON.stringify(payload.categories));
    if (payload.transactions) await AsyncStorage.setItem('@wallet_transactions', JSON.stringify(payload.transactions));
    if (payload.budgets) await AsyncStorage.setItem('@wallet_budgets', JSON.stringify(payload.budgets));
    if (payload.debts) await AsyncStorage.setItem('@wallet_debts', JSON.stringify(payload.debts));
    if (payload.goals) await AsyncStorage.setItem('@wallet_goals', JSON.stringify(payload.goals));

    return data.data;
  },
};
