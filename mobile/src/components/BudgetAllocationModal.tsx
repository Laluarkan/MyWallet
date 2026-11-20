import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatRupiah, formatNumberWithDots, parseNumberFromDots } from '../utils/format';
import { api } from '../services/api';

export interface AllocationItem {
  id: string; // ID kategori atau unique key
  categoryId?: string; // ID kategori pengeluaran jika terhubung
  name: string;
  percent: number;
  icon: string;
  color: string;
  desc?: string;
  isSaving?: boolean;
}

const DEFAULT_ALLOCATION_ITEMS: AllocationItem[] = [
  {
    id: 'c_food',
    categoryId: 'c_food',
    name: 'Makanan & Minuman',
    percent: 25,
    icon: 'restaurant',
    color: '#EF4444',
    desc: 'Kebutuhan makan harian, belanja dapur, sembako',
  },
  {
    id: 'c_bills',
    categoryId: 'c_bills',
    name: 'Tagihan & Utilitas',
    percent: 15,
    icon: 'receipt',
    color: '#8B5CF6',
    desc: 'Listrik PLN, air, internet/wifi, pulsa, kos/sewa',
  },
  {
    id: 'c_transport',
    categoryId: 'c_transport',
    name: 'Transportasi & Bensin',
    percent: 10,
    icon: 'car',
    color: '#F59E0B',
    desc: 'Bensin kendaraan, ojol, tol, servis bulanan',
  },
  {
    id: 'savings',
    name: 'Ditabung / Dana Darurat',
    percent: 20,
    icon: 'shield-checkmark',
    color: '#10B981',
    desc: 'Disisihkan di awal untuk dana darurat & tabungan impian',
    isSaving: true,
  },
  {
    id: 'c_shopping',
    categoryId: 'c_shopping',
    name: 'Belanja & Hiburan',
    percent: 15,
    icon: 'cart',
    color: '#EC4899',
    desc: 'Keperluan personal, pakaian, refreshing, hobi',
  },
  {
    id: 'social',
    name: 'Sedekah / Donasi & Cadangan',
    percent: 10,
    icon: 'heart',
    color: '#06B6D4',
    desc: 'Zakat, infaq, amal sosial, atau cadangan tak terduga',
  },
  {
    id: 'c_health',
    categoryId: 'c_health',
    name: 'Kesehatan & Obat',
    percent: 5,
    icon: 'medkit',
    color: '#14B8A6',
    desc: 'Vitamin, obat-obatan, asuransi/BPJS mandiri',
  },
];

interface BudgetAllocationModalProps {
  visible: boolean;
  onClose: () => void;
  wallets: any[];
  usdRate?: number;
  onApplied?: () => void;
}

export const BudgetAllocationModal: React.FC<BudgetAllocationModalProps> = ({
  visible,
  onClose,
  wallets,
  usdRate = 16500,
  onApplied,
}) => {
  // Hanya ambil dompet likuid: CASH, EWALLET, BANK. Dompet INVESTMENT tidak diikutsertakan.
  const liquidWallets = wallets.filter((w) =>
    ['CASH', 'EWALLET', 'BANK'].includes(w.type?.toUpperCase())
  );

  const totalLiquidCalculated = liquidWallets.reduce((acc, w) => {
    const bal = Number(w.currentBalance || 0);
    const inIdr = w.currency === 'USD' ? Math.round(bal * usdRate) : bal;
    return acc + Math.max(inIdr, 0);
  }, 0);

  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [loading, setLoading] = useState(false);

  // Daftar item alokasi yang bebas diedit oleh pengguna
  const [items, setItems] = useState<AllocationItem[]>(DEFAULT_ALLOCATION_ITEMS);

  // Kategori pengeluaran dari sistem
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pickingTargetId, setPickingTargetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await api.getCategories('EXPENSE');
        setAvailableCategories(cats || []);
      } catch (e) {
        console.log('Error loading categories for allocation:', e);
      }
    };
    fetchCats();
  }, []);

  const baseAmount = useCustomAmount
    ? parseNumberFromDots(customAmountStr)
    : totalLiquidCalculated;

  // Hitung total persentase saat ini
  const totalPercent = items.reduce((sum, it) => sum + (Number(it.percent) || 0), 0);

  // Ubah persentase dengan tombol +/-
  const handleAdjustPercent = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = Math.max(0, Math.min(100, (Number(it.percent) || 0) + delta));
          return { ...it, percent: updated };
        }
        return it;
      })
    );
  };

  // Ketik persentase langsung secara bebas
  const handleDirectPercentChange = (id: string, text: string) => {
    const cleanNum = parseInt(text.replace(/\D/g, ''), 10);
    const val = isNaN(cleanNum) ? 0 : Math.min(100, cleanNum);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, percent: val } : it))
    );
  };

  // Hapus pos alokasi
  const handleDeleteRow = (id: string) => {
    if (items.length <= 1) {
      Alert.alert('Perhatian', 'Minimal harus ada 1 pos alokasi keuangan.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Tambah pos alokasi baru
  const handleAddNewRow = () => {
    const newId = 'custom_' + Date.now();
    const newItem: AllocationItem = {
      id: newId,
      name: 'Pos Alokasi Baru',
      percent: 0,
      icon: 'bookmark',
      color: '#6366F1',
      desc: 'Kategori kustom',
    };
    setItems((prev) => [...prev, newItem]);
    // Buka pemilih kategori langsung untuk pos baru
    setPickingTargetId(newId);
    setShowCategoryPicker(true);
  };

  // Reset ke Rekomendasi Default 50/30/20
  const handleResetToDefault = () => {
    setItems(DEFAULT_ALLOCATION_ITEMS);
    Alert.alert('Sukses', 'Persentase dikembalikan ke rekomendasi standar 50/30/20.');
  };

  // Buka Pemilih Kategori untuk item tertentu
  const handleOpenCatPicker = (id: string) => {
    setPickingTargetId(id);
    setShowCategoryPicker(true);
  };

  // Pilih kategori untuk item yang sedang diedit
  const handleSelectCategory = (cat: any) => {
    if (!pickingTargetId) return;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === pickingTargetId) {
          return {
            ...it,
            categoryId: cat.id,
            name: cat.name,
            icon: cat.icon || 'pricetag',
            color: cat.color || '#3B82F6',
            desc: `Terhubung dengan kategori ${cat.name}`,
            isSaving: false,
          };
        }
        return it;
      })
    );
    setShowCategoryPicker(false);
    setPickingTargetId(null);
  };

  // Pilih kategori khusus Tabungan / Celengan
  const handleSelectSavings = () => {
    if (!pickingTargetId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === pickingTargetId) {
          return {
            ...it,
            categoryId: undefined,
            name: 'Ditabung / Dana Darurat',
            icon: 'shield-checkmark',
            color: '#10B981',
            desc: 'Disisihkan untuk dana darurat & tabungan impian',
            isSaving: true,
          };
        }
        return it;
      })
    );
    setShowCategoryPicker(false);
    setPickingTargetId(null);
  };

  // Terapkan alokasi ke anggaran bulanan
  const handleApplyToBudgets = async () => {
    if (baseAmount <= 0) {
      Alert.alert(
        'Perhatian',
        'Nominal dana harus lebih dari Rp 0 untuk menerapkan anggaran.'
      );
      return;
    }

    if (totalPercent > 100) {
      Alert.alert(
        'Peringatan',
        `Total persentase saat ini adalah ${totalPercent}%, melebihi 100%. Harap sesuaikan kembali persentase agar tidak melebihi 100%.`
      );
      return;
    }

    setLoading(true);
    try {
      // Ambil pos yang memiliki keterhubungan dengan kategori pengeluaran aplikasi
      const targets = items
        .filter((it) => it.categoryId && it.percent > 0)
        .map((it) => ({
          categoryId: it.categoryId as string,
          limitAmount: Math.round(baseAmount * (it.percent / 100)),
        }));

      if (targets.length === 0) {
        Alert.alert(
          'Informasi',
          'Tidak ada pos kategori pengeluaran aktif yang dapat diterapkan ke batas anggaran.'
        );
        return;
      }

      await api.applyBulkBudgets(targets);

      const savingItem = items.find((it) => it.isSaving && it.percent > 0);
      const savingNote = savingItem
        ? `\n\n💰 Pos Tabungan (${savingItem.percent}%): ${formatRupiah(
            baseAmount * (savingItem.percent / 100)
          )} siap disisihkan ke celengan/rekening tabungan.`
        : '';

      Alert.alert(
        'Berhasil Diterapkan!',
        `Batas anggaran untuk ${targets.length} kategori pengeluaran berhasil diperbarui sesuai kustomisasi Anda.${savingNote}`
      );

      if (onApplied) onApplied();
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kesalahan saat menerapkan anggaran.');
    } finally {
      setLoading(false);
    }
  };

  // Status visual total persentase
  const isPerfect100 = totalPercent === 100;
  const isOver100 = totalPercent > 100;
  const remainingPercent = 100 - totalPercent;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.title}>Atur Alokasi Dana (%)</Text>
                <View
                  style={[
                    styles.totalBadge,
                    isPerfect100 && { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
                    isOver100 && { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' },
                  ]}
                >
                  <Text
                    style={[
                      styles.totalBadgeText,
                      isPerfect100 && { color: '#059669' },
                      isOver100 && { color: colors.expense },
                    ]}
                  >
                    Total: {totalPercent}%
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Bebas ubah persentase & pilih kategori sesuai rencana keuangan Anda
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Sumber Dana Card */}
            <View style={styles.sourceCard}>
              <View style={styles.sourceTop}>
                <View style={styles.sourceIconWrap}>
                  <Ionicons name="wallet" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sourceLabel}>
                    {useCustomAmount ? 'Basis Nominal Kustom' : 'Total Dana Likuid Tersedia'}
                  </Text>
                  <Text style={styles.sourceValue}>{formatRupiah(baseAmount)}</Text>
                </View>
              </View>

              {/* Rincian Dompet Likuid */}
              <View style={styles.sourceNoteBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.sourceNoteText}>
                    Sumber: Uang Tunai (Cash), Bank, dan E-Wallet
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <Ionicons name="close-circle" size={14} color="#F59E0B" />
                  <Text style={styles.sourceNoteText}>
                    Dompet Investasi dikecualikan (aset jangka panjang tidak untuk konsumsi)
                  </Text>
                </View>
              </View>

              {/* Toggle Pakai Saldo Dompet vs Input Gaji Kustom */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !useCustomAmount && styles.toggleBtnActive]}
                  onPress={() => setUseCustomAmount(false)}
                >
                  <Text
                    style={[styles.toggleBtnText, !useCustomAmount && styles.toggleBtnTextActive]}
                  >
                    Saldo Dompet ({formatRupiah(totalLiquidCalculated)})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, useCustomAmount && styles.toggleBtnActive]}
                  onPress={() => setUseCustomAmount(true)}
                >
                  <Text
                    style={[styles.toggleBtnText, useCustomAmount && styles.toggleBtnTextActive]}
                  >
                    Input Gaji Kustom
                  </Text>
                </TouchableOpacity>
              </View>

              {useCustomAmount && (
                <View style={styles.customInputWrap}>
                  <Text style={styles.customInputLabel}>
                    Masukkan Penghasilan / Gaji Bulanan (Rp):
                  </Text>
                  <TextInput
                    style={styles.customInput}
                    keyboardType="numeric"
                    placeholder="Contoh: 5.000.000"
                    placeholderTextColor={colors.textMuted}
                    value={customAmountStr}
                    onChangeText={(text) => setCustomAmountStr(formatNumberWithDots(text))}
                  />
                </View>
              )}
            </View>

            {/* Status Total Alokasi Banner */}
            <View
              style={[
                styles.allocationStatusBox,
                isPerfect100 && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                isOver100 && { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' },
              ]}
            >
              <Ionicons
                name={
                  isPerfect100
                    ? 'checkmark-circle'
                    : isOver100
                    ? 'alert-circle'
                    : 'information-circle'
                }
                size={18}
                color={isPerfect100 ? '#10B981' : isOver100 ? colors.expense : '#F59E0B'}
              />
              <Text
                style={[
                  styles.allocationStatusText,
                  isPerfect100 && { color: '#047857' },
                  isOver100 && { color: '#B91C1C' },
                ]}
              >
                {isPerfect100
                  ? 'Total alokasi tepat 100%! Rencana keuangan seimbang.'
                  : isOver100
                  ? `Total alokasi ${totalPercent}% (kelebihan ${totalPercent - 100}%). Harap kurangi persentase pos lain.`
                  : `Total teralokasi ${totalPercent}%. Masih ada sisa ${remainingPercent}% yang belum dialokasikan.`}
              </Text>
            </View>

            {/* Segmented Visual Proportion Bar */}
            <View style={styles.ratioBarContainer}>
              <View style={styles.ratioBarWrap}>
                {items
                  .filter((it) => it.percent > 0)
                  .map((it) => (
                    <View
                      key={it.id}
                      style={{
                        flex: it.percent,
                        backgroundColor: it.color || colors.primary,
                        height: '100%',
                      }}
                    />
                  ))}
              </View>
            </View>

            {/* Tombol Aksi Cepat Tambah & Reset */}
            <View style={styles.actionRowTop}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetToDefault}>
                <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                <Text style={styles.resetBtnText}>Reset ke 50/30/20</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addPosBtn} onPress={handleAddNewRow}>
                <Ionicons name="add-circle" size={16} color={colors.primary} />
                <Text style={styles.addPosBtnText}>Tambah Pos Kategori</Text>
              </TouchableOpacity>
            </View>

            {/* Daftar Pos Alokasi yang Dapat Diedit */}
            <View style={styles.itemsCard}>
              {items.map((item) => {
                const itemNominal = Math.round(baseAmount * ((item.percent || 0) / 100));

                return (
                  <View key={item.id} style={styles.editableItemRow}>
                    {/* Ikon Kategori */}
                    <TouchableOpacity
                      style={[styles.itemIconWrap, { backgroundColor: item.color || colors.primary }]}
                      onPress={() => handleOpenCatPicker(item.id)}
                    >
                      <Ionicons name={(item.icon as any) || 'pricetag'} size={16} color="#FFF" />
                    </TouchableOpacity>

                    {/* Informasi Pos & Tombol Ganti Kategori */}
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemHeaderLine}>
                        <TouchableOpacity
                          style={styles.categoryNameBtn}
                          onPress={() => handleOpenCatPicker(item.id)}
                        >
                          <Text style={styles.categoryNameText} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Ionicons name="create-outline" size={12} color={colors.primary} />
                        </TouchableOpacity>

                        <Text style={styles.itemNominalText}>
                          {formatRupiah(itemNominal)}
                        </Text>
                      </View>

                      {/* Kontrol Persentase: Tombol [-] [ Input % ] [+] [ Hapus ] */}
                      <View style={styles.controlRow}>
                        <View style={styles.percentStepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => handleAdjustPercent(item.id, -5)}
                          >
                            <Ionicons name="remove" size={14} color={colors.text} />
                          </TouchableOpacity>

                          <View style={styles.percentInputWrap}>
                            <TextInput
                              style={styles.percentInput}
                              keyboardType="numeric"
                              value={String(item.percent)}
                              onChangeText={(text) => handleDirectPercentChange(item.id, text)}
                              maxLength={3}
                            />
                            <Text style={styles.percentSymbol}>%</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => handleAdjustPercent(item.id, 5)}
                          >
                            <Ionicons name="add" size={14} color={colors.text} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteRowBtn}
                          onPress={() => handleDeleteRow(item.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Tombol Terapkan */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.applyBtn, isOver100 && { backgroundColor: '#94A3B8' }]}
              onPress={handleApplyToBudgets}
              disabled={loading || isOver100}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
              <Text style={styles.applyBtnText}>
                {loading
                  ? 'Menerapkan...'
                  : isOver100
                  ? 'Total % Melebihi 100%'
                  : 'Terapkan ke Batas Anggaran'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Pemilih Kategori */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <View style={styles.catPickerOverlay}>
          <View style={styles.catPickerCard}>
            <View style={styles.catPickerHeader}>
              <Text style={styles.catPickerTitle}>Pilih Kategori Alokasi</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {/* Opsi Tabungan Khusus */}
              <TouchableOpacity
                style={styles.catOptionItem}
                onPress={handleSelectSavings}
              >
                <View style={[styles.catOptionIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catOptionName}>Ditabung / Dana Darurat</Text>
                  <Text style={styles.catOptionSub}>Pos tabungan & celengan masa depan</Text>
                </View>
              </TouchableOpacity>

              {/* Daftar Kategori Pengeluaran */}
              {availableCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.catOptionItem}
                  onPress={() => handleSelectCategory(c)}
                >
                  <View
                    style={[
                      styles.catOptionIcon,
                      { backgroundColor: c.color || colors.primary },
                    ]}
                  >
                    <Ionicons name={(c.icon as any) || 'pricetag'} size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catOptionName}>{c.name}</Text>
                    <Text style={styles.catOptionSub}>Kategori anggaran pengeluaran</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  totalBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  sourceCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sourceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  sourceNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sourceNoteText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  customInputWrap: {
    marginTop: 12,
  },
  customInputLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  customInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  allocationStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allocationStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  ratioBarContainer: {
    marginTop: 12,
    marginBottom: 10,
  },
  ratioBarWrap: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
  },
  actionRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addPosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  addPosBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  editableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  categoryNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  itemNominalText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  percentStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  percentInput: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    minWidth: 26,
    textAlign: 'center',
    padding: 0,
  },
  percentSymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 1,
  },
  deleteRowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  catPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  catPickerCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  catPickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  catOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  catOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
