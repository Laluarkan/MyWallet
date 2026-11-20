import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah, formatCurrency } from '../utils/format';
import { api } from '../services/api';
import { currencyService, DEFAULT_USD_RATE } from '../services/currency';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

interface WalletsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const WalletsScreen: React.FC<WalletsScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState<number>(DEFAULT_USD_RATE);
  const [fetchingRate, setFetchingRate] = useState(false);

  // Modal Tambah Dompet
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');

  // Modal Sesuaikan Saldo (Adjustment)
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [actualBalanceStr, setActualBalanceStr] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Modal Edit Kurs Manual
  const [showRateModal, setShowRateModal] = useState(false);
  const [manualRateStr, setManualRateStr] = useState('');

  const loadWallets = async () => {
    setLoading(true);
    try {
      const [data, rate] = await Promise.all([
        api.getWallets(),
        currencyService.getRate(),
      ]);
      setWallets(data || []);
      setUsdRate(rate);
    } catch (e) {
      console.log('Error loading wallets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleFetchLiveRate = async () => {
    setFetchingRate(true);
    try {
      const liveRate = await currencyService.fetchLiveRate();
      setUsdRate(liveRate);
      Alert.alert('Sukses', `Kurs USD berhasil diperbarui:\n$1 USD = ${formatRupiah(liveRate)}`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal mengambil kurs online');
    } finally {
      setFetchingRate(false);
    }
  };

  const handleSaveManualRate = async () => {
    const val = parseFloat(manualRateStr);
    if (!val || val <= 0) {
      Alert.alert('Perhatian', 'Masukkan nilai kurs yang valid (misal: 16500)');
      return;
    }

    try {
      await currencyService.setManualRate(val);
      setUsdRate(val);
      setShowRateModal(false);
      setManualRateStr('');
      Alert.alert('Sukses', `Kurs manual disimpan:\n$1 USD = ${formatRupiah(val)}`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleCreateWallet = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama dompet wajib diisi');
      return;
    }

    try {
      await api.createWallet({
        name: name.trim(),
        type,
        currency,
        initialBalance: parseFloat(initialBalanceStr) || 0,
      });

      setShowAddModal(false);
      setName('');
      setInitialBalanceStr('');
      setCurrency('IDR');
      loadWallets();
      Alert.alert('Sukses', 'Dompet baru berhasil dibuat!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleAdjustBalance = async () => {
    const actual = parseFloat(actualBalanceStr);
    if (isNaN(actual)) {
      Alert.alert('Perhatian', 'Masukkan saldo riil yang valid');
      return;
    }

    try {
      await api.adjustWalletBalance(selectedWallet.id, actual, adjustNotes.trim());
      setShowAdjustModal(false);
      setSelectedWallet(null);
      setActualBalanceStr('');
      setAdjustNotes('');
      loadWallets();
      Alert.alert('Sukses', 'Saldo dompet berhasil disesuaikan!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  // Akumulasikan seluruh dompet dalam Rupiah (termasuk USD yang dikonversi)
  const totalBalanceInIdr = wallets.reduce((acc, w) => {
    const bal = Number(w.currentBalance || 0);
    const inIdr = w.currency === 'USD' ? Math.round(bal * usdRate) : bal;
    return acc + inIdr;
  }, 0);

  const hasUsdWallet = wallets.some((w) => w.currency === 'USD');

  return (
    <View style={styles.container}>
      <Header
        title="Kelola Dompet"
        subtitle="Akun bank, e-wallet, uang tunai & mata uang"
        onBack={onBack}
        rightActionIcon="add-circle"
        onRightAction={() => setShowAddModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWallets} colors={[colors.primary]} />}
      >
        {/* Total Net Worth Card (Akumulasi dalam Rupiah) */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Akumulasi Seluruh Dompet (IDR)</Text>
          <Text style={styles.totalValue}>{formatRupiah(totalBalanceInIdr)}</Text>
          {hasUsdWallet && (
            <View style={styles.totalUsdNote}>
              <Ionicons name="information-circle" size={14} color="#94A3B8" />
              <Text style={styles.totalUsdNoteText}>
                Termasuk konversi saldo USD ($1 = {formatRupiah(usdRate)})
              </Text>
            </View>
          )}
        </View>

        {/* Card Kurs USD ke IDR */}
        <View style={styles.exchangeCard}>
          <View style={styles.exchangeHeader}>
            <View style={styles.exchangeIconWrap}>
              <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exchangeTitle}>Kurs Dollar Amerika (USD ➔ IDR)</Text>
              <Text style={styles.exchangeRateVal}>
                $1.00 USD = <Text style={{ fontWeight: '800', color: colors.text }}>{formatRupiah(usdRate)}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.exchangeActionsRow}>
            <TouchableOpacity
              style={styles.exchangeBtn}
              onPress={handleFetchLiveRate}
              disabled={fetchingRate}
            >
              {fetchingRate ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="sync" size={14} color={colors.primary} />
                  <Text style={styles.exchangeBtnText}>Perbarui Otomatis (Live)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exchangeBtn, { backgroundColor: colors.cardAlt }]}
              onPress={() => {
                setManualRateStr(String(usdRate));
                setShowRateModal(true);
              }}
            >
              <Ionicons name="create-outline" size={14} color={colors.text} />
              <Text style={[styles.exchangeBtnText, { color: colors.text }]}>Ubah Manual</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daftar Dompet */}
        <Text style={styles.sectionTitle}>Daftar Dompet Aktif</Text>

        {wallets.map((w) => {
          const isUsd = w.currency === 'USD';
          const bal = Number(w.currentBalance || 0);
          const convertedIdr = isUsd ? Math.round(bal * usdRate) : bal;

          return (
            <View key={w.id} style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <View style={styles.walletInfo}>
                  <View style={[styles.walletIconWrap, { backgroundColor: w.color || colors.primary }]}>
                    <Ionicons name={isUsd ? 'logo-usd' : 'wallet'} size={18} color="#FFF" />
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.walletName}>{w.name}</Text>
                      <View style={[styles.currencyBadge, isUsd && { backgroundColor: '#DBEAFE' }]}>
                        <Text style={[styles.currencyBadgeText, isUsd && { color: '#1E40AF' }]}>
                          {isUsd ? 'USD ($)' : 'IDR (Rp)'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.walletType}>{w.type}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.walletBalance}>
                    {isUsd ? `$ ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : formatRupiah(bal)}
                  </Text>
                  {isUsd && (
                    <Text style={styles.walletConvertedText}>
                      ≈ {formatRupiah(convertedIdr)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.walletFooter}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => {
                    setSelectedWallet(w);
                    setActualBalanceStr(String(w.currentBalance));
                    setShowAdjustModal(true);
                  }}
                >
                  <Ionicons name="options-outline" size={14} color={colors.primary} />
                  <Text style={styles.adjustBtnText}>Sesuaikan Saldo</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Zona Mulai Ulang / Reset Dana */}
        <View style={styles.resetSectionCard}>
          <View style={styles.resetSectionTop}>
            <View style={styles.resetIconWrap}>
              <Ionicons name="refresh-circle" size={24} color={colors.expense} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resetSectionTitle}>Mulai Ulang Dana</Text>
              <Text style={styles.resetSectionDesc}>
                Ingin mulai mencatat dari awal? Reset seluruh saldo dompet dan transaksi ke Rp 0.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.resetNavBtn}
            onPress={() => onNavigate && onNavigate('reset')}
          >
            <Text style={styles.resetNavBtnText}>Buka Halaman Reset Dana</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.expense} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Tambah Dompet */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Tambah Dompet Baru</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Pilihan Mata Uang: IDR vs USD */}
            <Text style={styles.formLabel}>Mata Uang Dompet</Text>
            <View style={styles.currencyToggleRow}>
              <TouchableOpacity
                style={[styles.currencyPill, currency === 'IDR' && styles.currencyPillActive]}
                onPress={() => setCurrency('IDR')}
              >
                <Text style={[styles.currencyPillText, currency === 'IDR' && styles.currencyPillTextActive]}>
                  🇮🇩 IDR (Rupiah Rp)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.currencyPill, currency === 'USD' && styles.currencyPillActive]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={[styles.currencyPillText, currency === 'USD' && styles.currencyPillTextActive]}>
                  🇺🇸 USD (Dollar $)
                </Text>
              </TouchableOpacity>
            </View>

            {currency === 'USD' && (
              <View style={styles.usdNoticeBox}>
                <Ionicons name="bulb-outline" size={16} color="#1E40AF" />
                <Text style={styles.usdNoticeText}>
                  Saldo dompet ini akan disimpan dalam satuan USD ($), dan otomatis diakumulasikan ke total kekayaan bersih dalam Rupiah (1 USD = {formatRupiah(usdRate)}).
                </Text>
              </View>
            )}

            <Text style={styles.formLabel}>Nama Dompet / Akun</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={currency === 'USD' ? 'Contoh: PayPal, Payoneer, Dompet USD...' : 'Contoh: BCA Utama, Mandiri, GoPay...'}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Tipe Akun</Text>
            <View style={styles.typeRow}>
              {['BANK', 'EWALLET', 'CASH', 'INVESTMENT'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, type === t && styles.typePillActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typePillText, type === t && { color: '#FFF' }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>
              Saldo Awal ({currency === 'USD' ? '$ USD' : 'Rp IDR'})
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder={currency === 'USD' ? '0.00 (misal: 100)' : '0 (misal: 500000)'}
              placeholderTextColor={colors.textMuted}
              value={initialBalanceStr}
              onChangeText={setInitialBalanceStr}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateWallet}>
              <Text style={styles.saveBtnText}>Simpan Dompet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Sesuaikan Saldo */}
      <Modal visible={showAdjustModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Sesuaikan Saldo {selectedWallet?.name}</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formDesc}>
              Masukkan jumlah saldo fisik/nyata saat ini. Aplikasi akan otomatis membuat catatan penyesuaian selisihnya.
            </Text>

            <Text style={styles.formLabel}>
              Saldo Aktual Saat Ini ({selectedWallet?.currency === 'USD' ? '$ USD' : 'Rp IDR'})
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={actualBalanceStr}
              onChangeText={setActualBalanceStr}
            />

            <Text style={styles.formLabel}>Alasan / Keterangan (Opsional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Keterangan..."
              placeholderTextColor={colors.textMuted}
              value={adjustNotes}
              onChangeText={setAdjustNotes}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdjustBalance}>
              <Text style={styles.saveBtnText}>Terapkan Saldo Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ubah Kurs Manual */}
      <Modal visible={showRateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Ubah Kurs USD Manual</Text>
              <TouchableOpacity onPress={() => setShowRateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formDesc}>
              Atur nilai tukar 1 USD terhadap Rupiah (IDR) sesuai kurs yang Anda inginkan.
            </Text>

            <Text style={styles.formLabel}>Nilai 1 USD dalam Rupiah (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Contoh: 16500"
              placeholderTextColor={colors.textMuted}
              value={manualRateStr}
              onChangeText={setManualRateStr}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveManualRate}>
              <Text style={styles.saveBtnText}>Simpan Kurs Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  totalUsdNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  totalUsdNoteText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  exchangeCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exchangeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  exchangeRateVal: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exchangeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  exchangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  exchangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  currencyBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  currencyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  walletType: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  walletConvertedText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 12,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  resetSectionCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 10,
    marginBottom: 20,
  },
  resetSectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  resetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239',
  },
  resetSectionDesc: {
    fontSize: 12,
    color: '#BE123C',
    marginTop: 2,
    lineHeight: 16,
  },
  resetNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  resetNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.expense,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  currencyToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  currencyPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  currencyPillTextActive: {
    color: '#FFF',
  },
  usdNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  usdNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
    flex: 1,
  },
  formDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
