export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCurrency(amount: number | string, currency: string = 'IDR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return formatRupiah(num);
}

/**
 * Format string atau number dengan pemisah ribuan berupa titik (.)
 * Contoh: '20000' -> '20.000', '1500000' -> '1.500.000'
 */
export function formatNumberWithDots(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse string dengan titik ribuan kembali menjadi number murni
 * Contoh: '20.000' -> 20000
 */
export function parseNumberFromDots(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/\./g, '').trim();
  return parseFloat(clean) || 0;
}

/**
 * Format input untuk mata uang USD ($)
 * Mengubah koma (,) menjadi titik (.) dan hanya memperbolehkan maksimal 1 titik desimal.
 * Contoh: '25,50' -> '25.50'
 */
export function formatUsdInput(val: string | null | undefined): string {
  if (!val) return '';
  // Ubah koma menjadi titik
  let clean = String(val).replace(/,/g, '.');
  // Hanya simpan angka dan titik
  clean = clean.replace(/[^0-9.]/g, '');
  // Batasi hanya satu titik desimal
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  // Batasi maksimal 2 digit di belakang desimal jika ada
  if (parts.length === 2 && parts[1].length > 2) {
    clean = parts[0] + '.' + parts[1].substring(0, 2);
  }
  return clean;
}

/**
 * Parse input USD menjadi float number
 */
export function parseUsdInput(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
}

export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

