import AsyncStorage from '@react-native-async-storage/async-storage';

const USD_RATE_KEY = '@wallet_usd_rate';
const USD_RATE_UPDATED_KEY = '@wallet_usd_rate_updated';
export const DEFAULT_USD_RATE = 16250;

export const currencyService = {
  // Ambil nilai kurs tersimpan (default: 16.250)
  getRate: async (): Promise<number> => {
    try {
      const stored = await AsyncStorage.getItem(USD_RATE_KEY);
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val > 0) return val;
      }
      return DEFAULT_USD_RATE;
    } catch {
      return DEFAULT_USD_RATE;
    }
  },

  // Ambil tanggal terakhir kurs diperbarui
  getLastUpdated: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(USD_RATE_UPDATED_KEY);
    } catch {
      return null;
    }
  },

  // Simpan nilai kurs secara manual
  setManualRate: async (rate: number): Promise<number> => {
    if (rate <= 0 || isNaN(rate)) throw new Error('Nilai kurs harus lebih dari 0');
    await AsyncStorage.setItem(USD_RATE_KEY, String(rate));
    await AsyncStorage.setItem(USD_RATE_UPDATED_KEY, new Date().toISOString());
    return rate;
  },

  // Perbarui kurs otomatis dari API publik gratis (open.er-api.com)
  fetchLiveRate: async (): Promise<number> => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Gagal mengambil kurs online');
      const data = await res.json();
      const liveRate = Math.round(data?.rates?.IDR || DEFAULT_USD_RATE);

      await AsyncStorage.setItem(USD_RATE_KEY, String(liveRate));
      await AsyncStorage.setItem(USD_RATE_UPDATED_KEY, new Date().toISOString());
      return liveRate;
    } catch (err: any) {
      console.warn('Gagal fetch live rate, gunakan kurs tersimpan:', err.message);
      return currencyService.getRate();
    }
  },

  // Konversi nominal ke Rupiah
  convertToIdr: (amount: number, currency: string = 'IDR', rate: number = DEFAULT_USD_RATE): number => {
    if (currency === 'USD') {
      return Math.round(amount * rate);
    }
    return amount;
  },
};
