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
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah, formatNumberWithDots, parseNumberFromDots } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { BudgetAllocationModal } from '../components/BudgetAllocationModal';

export const BudgetsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  // Form State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [limitStr, setLimitStr] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const [data, walletList] = await Promise.all([
        api.getBudgets(),
        api.getWallets(),
      ]);
      setBudgets(data || []);
      setWallets(walletList || []);
    } catch (e) {
      console.log('Error loading budgets:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories('EXPENSE');
      setCategories(data || []);
      if (data && data.length > 0) setSelectedCatId(data[0].id);
    } catch (e) {
      console.log('Error loading categories:', e);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const handleCreateBudget = async () => {
    const limit = parseNumberFromDots(limitStr);
    if (!limit || limit <= 0) {
      Alert.alert('Perhatian', 'Masukkan batas anggaran yang valid');
      return;
    }
    if (!selectedCatId) {
      Alert.alert('Perhatian', 'Pilih kategori pengeluaran');
      return;
    }

    try {
      await api.createBudget({
        categoryId: selectedCatId,
        limitAmount: limit,
        period: 'MONTHLY',
      });
      setShowAddModal(false);
      setLimitStr('');
      loadBudgets();
      Alert.alert('Sukses', 'Anggaran bulanan berhasil disimpan!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleDeleteBudget = (id: string) => {
    Alert.alert('Hapus Anggaran', 'Apakah Anda yakin ingin menghapus anggaran ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBudget(id);
            loadBudgets();
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  };

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.limitAmount), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + Number(b.totalSpent), 0);
  const overallPercentage = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  return (
    <View style={styles.container}>
      <Header
        title="Anggaran Bulanan"
        subtitle="Kendalikan pengeluaran agar tidak boros"
        rightActionIcon="add-circle"
        onRightAction={() => setShowAddModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBudgets} colors={[colors.primary]} />}
      >
        {/* Ringkasan Total Budget */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Anggaran Aktif</Text>
          <View style={styles.summaryAmounts}>
            <Text style={styles.summarySpent}>{formatRupiah(totalBudgetSpent)}</Text>
            <Text style={styles.summaryLimit}> / {formatRupiah(totalBudgetLimit)}</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <ProgressBar percentage={overallPercentage} height={10} />
          </View>
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>{overallPercentage}% terpakai</Text>
            <Text style={styles.summaryFooterText}>
              Sisa {formatRupiah(Math.max(totalBudgetLimit - totalBudgetSpent, 0))}
            </Text>
          </View>
        </View>

        {/* Banner Smart Alokasi Dana (Aturan 50/30/20) */}
        <TouchableOpacity
          style={styles.allocationBanner}
          onPress={() => setShowAllocationModal(true)}
        >
          <View style={styles.allocationBannerLeft}>
            <View style={styles.allocationIconWrap}>
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.allocationBannerTitle}>Rekomendasi Alokasi Ideal</Text>
                <View style={styles.badge503020}>
                  <Text style={styles.badge503020Text}>50/30/20</Text>
                </View>
              </View>
              <Text style={styles.allocationBannerSub}>
                Hitung persentase makan, transport, tabungan dari dana likuid Anda & terapkan 1 klik
              </Text>
            </View>
          </View>
          <View style={styles.allocationBadge}>
            <Text style={styles.allocationBadgeText}>Hitung</Text>
            <Ionicons name="chevron-forward" size={12} color="#7C3AED" />
          </View>
        </TouchableOpacity>

        {/* List Budget Per Kategori */}
        <Text style={styles.sectionTitle}>Batas Per Kategori</Text>

        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Anggaran</Text>
            <Text style={styles.emptyDesc}>
              Tap tombol (+) di kanan atas untuk membuat batasan anggaran kategori baru.
            </Text>
          </View>
        ) : (
          budgets.map((b) => (
            <View key={b.id} style={styles.budgetCard}>
              <View style={styles.budgetCardHeader}>
                <View style={styles.budgetCatInfo}>
                  <View style={[styles.catIconWrap, { backgroundColor: b.category?.color || colors.primary }]}>
                    <Ionicons name="pricetag" size={16} color="#FFF" />
                  </View>
                  <View>
                    <Text style={styles.budgetCatName}>{b.category?.name}</Text>
                    <Text style={styles.budgetPeriod}>Bulan ini</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDeleteBudget(b.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.progressSection}>
                <ProgressBar percentage={b.percentage} />
                <View style={styles.progressDetails}>
                  <Text style={styles.spentText}>
                    Terpakai: <Text style={{ fontWeight: '700' }}>{formatRupiah(b.totalSpent)}</Text>
                  </Text>
                  <Text style={styles.limitText}>
                    Limit: {formatRupiah(b.limitAmount)}
                  </Text>
                </View>
              </View>

              {b.isOverBudget ? (
                <View style={styles.overBudgetWarning}>
                  <Ionicons name="alert-circle" size={14} color={colors.expense} />
                  <Text style={styles.overBudgetText}>
                    Melebihi anggaran sebesar {formatRupiah(b.totalSpent - b.limitAmount)}!
                  </Text>
                </View>
              ) : (
                <Text style={styles.remainingText}>
                  Sisa anggaran: {formatRupiah(b.remaining)}
                </Text>
              )}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Tambah Anggaran */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Atur Anggaran Kategori</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Pilih Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catPill,
                    selectedCatId === c.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCatId(c.id)}
                >
                  <Text style={[styles.catPillText, selectedCatId === c.id && { color: '#FFF' }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>Batas Anggaran Bulanan (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Contoh: 2.000.000"
              placeholderTextColor={colors.textMuted}
              value={limitStr}
              onChangeText={(text) => setLimitStr(formatNumberWithDots(text))}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateBudget}>
              <Text style={styles.saveBtnText}>Simpan Anggaran</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Alokasi Dana Ideal */}
      <BudgetAllocationModal
        visible={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        wallets={wallets}
        onApplied={loadBudgets}
      />
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
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  summarySpent: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLimit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryFooterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  allocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  allocationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  allocationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },
  badge503020: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badge503020Text: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C3AED',
  },
  allocationBannerSub: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 2,
    lineHeight: 15,
  },
  allocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  allocationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  budgetCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCatName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  budgetPeriod: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressSection: {
    marginVertical: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  spentText: {
    fontSize: 12,
    color: colors.text,
  },
  limitText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  overBudgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.expenseLight,
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  overBudgetText: {
    fontSize: 11,
    color: colors.expense,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
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
