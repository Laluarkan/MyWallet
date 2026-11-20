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
import { formatRupiah } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

export const GoalsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);

  // Modal Tambah Goal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [targetStr, setTargetStr] = useState('');

  // Modal Deposit / Withdraw
  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [actionAmountStr, setActionAmountStr] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');

  const loadGoals = async () => {
    setLoading(true);
    try {
      const [goalList, walletList] = await Promise.all([
        api.getGoals(),
        api.getWallets(),
      ]);
      setGoals(goalList || []);
      setWallets(walletList || []);
      if (walletList && walletList.length > 0) {
        setSelectedWalletId(walletList[0].id);
      }
    } catch (e) {
      console.log('Error loading goals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async () => {
    const target = parseFloat(targetStr);
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama target tabungan wajib diisi');
      return;
    }
    if (!target || target <= 0) {
      Alert.alert('Perhatian', 'Target nominal harus lebih dari 0');
      return;
    }

    try {
      await api.createGoal({
        name: name.trim(),
        targetAmount: target,
      });
      setShowAddModal(false);
      setName('');
      setTargetStr('');
      loadGoals();
      Alert.alert('Sukses', 'Target tabungan berhasil dibuat!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleConfirmAction = async () => {
    const amount = parseFloat(actionAmountStr);
    if (!amount || amount <= 0) {
      Alert.alert('Perhatian', 'Nominal harus lebih dari 0');
      return;
    }
    if (!selectedWalletId) {
      Alert.alert('Perhatian', 'Pilih dompet sumber / tujuan');
      return;
    }

    try {
      if (actionType === 'DEPOSIT') {
        await api.depositGoal(selectedGoal.id, amount, selectedWalletId);
        Alert.alert('Sukses', 'Berhasil menyisihkan uang ke celengan!');
      } else {
        await api.withdrawGoal(selectedGoal.id, amount, selectedWalletId);
        Alert.alert('Sukses', 'Berhasil menarik dana dari celengan ke dompet!');
      }
      setShowActionModal(false);
      setActionAmountStr('');
      setSelectedGoal(null);
      loadGoals();
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Target Tabungan"
        subtitle="Wujudkan impian & celengan dana darurat Anda"
        rightActionIcon="add-circle"
        onRightAction={() => setShowAddModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGoals} colors={[colors.primary]} />}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Target</Text>
            <Text style={styles.emptyDesc}>
              Tap (+) untuk membuat target tabungan baru (misal: Beli Laptop, Dana Darurat, Liburan).
            </Text>
          </View>
        ) : (
          goals.map((g) => {
            const current = Number(g.currentAmount);
            const target = Number(g.targetAmount);
            const isCompleted = g.isCompleted || current >= target;

            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleRow}>
                    <View style={[styles.goalIconWrap, { backgroundColor: g.color || colors.primary }]}>
                      <Ionicons name="flag" size={16} color="#FFF" />
                    </View>
                    <View>
                      <Text style={styles.goalName}>{g.name}</Text>
                      <Text style={styles.goalStatus}>
                        {isCompleted ? '🎉 Target Tercapai!' : `Sisa ${formatRupiah(g.remaining)} lagi`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.percentageText}>{g.percentage}%</Text>
                </View>

                {/* Progress Bar */}
                <View style={{ marginVertical: 12 }}>
                  <ProgressBar
                    percentage={g.percentage}
                    color={isCompleted ? colors.income : colors.primary}
                    height={10}
                  />
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.currentVal}>{formatRupiah(current)}</Text>
                  <Text style={styles.targetVal}>Target: {formatRupiah(target)}</Text>
                </View>

                {/* Tombol Nabung & Tarik */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setSelectedGoal(g);
                      setActionType('DEPOSIT');
                      setShowActionModal(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={16} color="#FFF" />
                    <Text style={styles.btnActionText}>Nabung</Text>
                  </TouchableOpacity>

                  {current > 0 && (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => {
                        setSelectedGoal(g);
                        setActionType('WITHDRAW');
                        setShowActionModal(true);
                      }}
                    >
                      <Ionicons name="arrow-up-circle-outline" size={16} color={colors.text} />
                      <Text style={[styles.btnActionText, { color: colors.text }]}>Tarik Dana</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Tambah Goal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Buat Target Tabungan</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Nama Impian / Target</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Dana Darurat, Beli Motor, Umroh..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Target Nominal (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Contoh: 10000000"
              placeholderTextColor={colors.textMuted}
              value={targetStr}
              onChangeText={setTargetStr}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGoal}>
              <Text style={styles.saveBtnText}>Simpan Target</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Nabung / Tarik */}
      <Modal visible={showActionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>
                {actionType === 'DEPOSIT'
                  ? `Nabung ke ${selectedGoal?.name}`
                  : `Tarik Dana dari ${selectedGoal?.name}`}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>
              {actionType === 'DEPOSIT' ? 'Dari Dompet Sumber' : 'Ke Dompet Tujuan'}
            </Text>
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

            <Text style={styles.formLabel}>Nominal (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={actionAmountStr}
              onChangeText={setActionAmountStr}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmAction}>
              <Text style={styles.saveBtnText}>
                {actionType === 'DEPOSIT' ? 'Konfirmasi Menabung' : 'Konfirmasi Penarikan'}
              </Text>
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
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  goalStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  currentVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  targetVal: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  btnActionText: {
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
