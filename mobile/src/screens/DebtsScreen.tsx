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
import { formatRupiah, formatDate, formatNumberWithDots, parseNumberFromDots } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

interface DebtsScreenProps {
  onBack?: () => void;
}

export const DebtsScreen: React.FC<DebtsScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'DEBT' | 'RECEIVABLE'>('DEBT');
  const [debts, setDebts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Modal Tambah Catatan
  const [showAddModal, setShowAddModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  // Modal Bayar Cicilan
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, walletList] = await Promise.all([
        api.getDebts(tab),
        api.getWallets(),
      ]);
      setDebts(res.debts || []);
      setSummary(res.summary || null);
      setWallets(walletList || []);
      if (walletList && walletList.length > 0) {
        setSelectedWalletId(walletList[0].id);
      }
    } catch (e) {
      console.log('Error loading debts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleCreateDebt = async () => {
    const totalAmount = parseNumberFromDots(amountStr);
    if (!personName.trim()) {
      Alert.alert('Perhatian', 'Nama pihak/orang wajib diisi');
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      Alert.alert('Perhatian', 'Nominal harus lebih dari 0');
      return;
    }

    try {
      await api.createDebt({
        personName: personName.trim(),
        type: tab,
        totalAmount,
        notes: notes.trim() || null,
      });

      setShowAddModal(false);
      setPersonName('');
      setAmountStr('');
      setNotes('');
      loadData();
      Alert.alert('Sukses', 'Catatan berhasil ditambahkan!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handlePayDebt = async () => {
    const amount = parseNumberFromDots(payAmountStr);
    if (!amount || amount <= 0) {
      Alert.alert('Perhatian', 'Nominal pembayaran harus lebih dari 0');
      return;
    }
    if (!selectedWalletId) {
      Alert.alert('Perhatian', 'Pilih dompet transaksi');
      return;
    }

    try {
      await api.payDebt(selectedDebt.id, amount, selectedWalletId);
      setShowPayModal(false);
      setSelectedDebt(null);
      setPayAmountStr('');
      loadData();
      Alert.alert('Sukses', 'Pembayaran berhasil dicatat!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Hutang & Piutang"
        subtitle="Pantau kewajiban dan tagihan Anda"
        onBack={onBack}
        rightActionIcon="add-circle"
        onRightAction={() => setShowAddModal(true)}
      />

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summarySub}>Total Hutang Saya</Text>
          <Text style={[styles.summaryVal, { color: colors.expense }]}>
            {formatRupiah(summary?.totalDebtRemaining || 0)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summarySub}>Total Piutang Saya</Text>
          <Text style={[styles.summaryVal, { color: colors.income }]}>
            {formatRupiah(summary?.totalReceivableRemaining || 0)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'DEBT' && styles.tabBtnActive]}
          onPress={() => setTab('DEBT')}
        >
          <Text style={[styles.tabText, tab === 'DEBT' && styles.tabTextActive]}>
            Hutang Saya (Kewajiban)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'RECEIVABLE' && styles.tabBtnActive]}
          onPress={() => setTab('RECEIVABLE')}
        >
          <Text style={[styles.tabText, tab === 'RECEIVABLE' && styles.tabTextActive]}>
            Piutang Saya (Tagihan)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={[colors.primary]} />}
      >
        {debts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Tidak Ada Catatan</Text>
            <Text style={styles.emptyDesc}>
              {`Tap (+) untuk mencatat ${tab === 'DEBT' ? 'hutang ke orang' : 'piutang orang ke Anda'}.`}
            </Text>
          </View>
        ) : (
          debts.map((d) => {
            const total = Number(d.totalAmount);
            const paid = Number(d.paidAmount);
            const remaining = total - paid;
            const isPaid = d.status === 'PAID';

            return (
              <View key={d.id} style={styles.debtCard}>
                <View style={styles.debtCardHeader}>
                  <View>
                    <Text style={styles.personName}>{d.personName}</Text>
                    <Text style={styles.debtDate}>{`Dicatat ${formatDate(d.createdAt)}`}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isPaid
                          ? colors.incomeLight
                          : paid > 0
                          ? colors.warningLight
                          : colors.expenseLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isPaid
                            ? colors.income
                            : paid > 0
                            ? colors.warning
                            : colors.expense,
                        },
                      ]}
                    >
                      {isPaid ? 'Lunas' : paid > 0 ? 'Sebagian' : 'Belum Lunas'}
                    </Text>
                  </View>
                </View>

                {d.notes ? <Text style={styles.debtNotes}>{d.notes}</Text> : null}

                <View style={styles.amountInfoRow}>
                  <View>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.totalAmountVal}>{formatRupiah(total)}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.amountLabel}>Terbayar</Text>
                    <Text style={styles.paidAmountVal}>{formatRupiah(paid)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountLabel}>Sisa</Text>
                    <Text style={[styles.remainingVal, { color: colors.expense }]}>
                      {formatRupiah(remaining)}
                    </Text>
                  </View>
                </View>

                {!isPaid && (
                  <TouchableOpacity
                    style={styles.payActionBtn}
                    onPress={() => {
                      setSelectedDebt(d);
                      setPayAmountStr(formatNumberWithDots(remaining));
                      setShowPayModal(true);
                    }}
                  >
                    <Ionicons name="cash-outline" size={16} color="#FFF" />
                    <Text style={styles.payActionText}>
                      {tab === 'DEBT' ? 'Bayar / Cicil' : 'Terima Pembayaran'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Tambah Catatan */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>
                Tambah {tab === 'DEBT' ? 'Hutang Baru' : 'Piutang Baru'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>
              {tab === 'DEBT' ? 'Nama Pemberi Pinjaman' : 'Nama Peminjam'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Budi, Kantor, Bank..."
              placeholderTextColor={colors.textMuted}
              value={personName}
              onChangeText={setPersonName}
            />

            <Text style={styles.formLabel}>Nominal (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Contoh: 500.000"
              placeholderTextColor={colors.textMuted}
              value={amountStr}
              onChangeText={(text) => setAmountStr(formatNumberWithDots(text))}
            />

            <Text style={styles.formLabel}>Catatan (Opsional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Keterangan..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateDebt}>
              <Text style={styles.saveBtnText}>Simpan Catatan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Bayar Cicilan */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>
                {tab === 'DEBT' ? 'Bayar Hutang' : 'Terima Pembayaran'}
              </Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Pilih Dompet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletPill,
                    selectedWalletId === w.id && styles.walletPillActive,
                  ]}
                  onPress={() => setSelectedWalletId(w.id)}
                >
                  <Text style={[styles.walletPillText, selectedWalletId === w.id && { color: '#FFF' }]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>Nominal Pembayaran (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={payAmountStr}
              onChangeText={(text) => setPayAmountStr(formatNumberWithDots(text))}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handlePayDebt}>
              <Text style={styles.saveBtnText}>Konfirmasi Pembayaran</Text>
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summarySub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
  },
  debtCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  debtCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  debtDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  debtNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  amountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalAmountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  paidAmountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.income,
    marginTop: 2,
  },
  remainingVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  payActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  payActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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
  walletPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  walletPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  walletPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
