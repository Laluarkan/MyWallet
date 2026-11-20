import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah, formatDate } from '../utils/format';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onOpenAddTransaction: (type?: 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenAddTransaction,
}) => {
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getOverview();
      setOverview(data);
    } catch (e) {
      console.log('Error loading overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalNetWorth = overview?.totalNetWorth || 0;
  const income = overview?.monthly?.income || 0;
  const expense = overview?.monthly?.expense || 0;
  const netCashFlow = overview?.monthly?.netCashFlow || 0;
  const wallets = overview?.wallets || [];
  const recentTransactions = overview?.recentTransactions || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Saldo Utama (Net Worth) */}
      <View style={styles.netWorthCard}>
        <View style={styles.netWorthHeader}>
          <Text style={styles.netWorthLabel}>Total Kekayaan Bersih</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('reset')}>
              <Ionicons
                name="refresh-circle-outline"
                size={22}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('account')}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.netWorthAmount}>
          {showBalance ? formatRupiah(totalNetWorth) : 'Rp ••••••••'}
        </Text>

        <View style={styles.cashFlowRow}>
          <View style={styles.cashFlowItem}>
            <View style={[styles.arrowBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="arrow-down" size={14} color="#34D399" />
            </View>
            <View>
              <Text style={styles.cashFlowSub}>Pemasukan Bulan Ini</Text>
              <Text style={styles.cashFlowVal}>
                {showBalance ? formatRupiah(income) : '••••••'}
              </Text>
            </View>
          </View>

          <View style={styles.dividerVertical} />

          <View style={styles.cashFlowItem}>
            <View style={[styles.arrowBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="arrow-up" size={14} color="#F87171" />
            </View>
            <View>
              <Text style={styles.cashFlowSub}>Pengeluaran Bulan Ini</Text>
              <Text style={styles.cashFlowVal}>
                {showBalance ? formatRupiah(expense) : '••••••'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Quick Action Buttons */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
      </View>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onOpenAddTransaction('EXPENSE')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.expenseLight }]}>
            <Ionicons name="arrow-up-circle" size={24} color={colors.expense} />
          </View>
          <Text style={styles.actionBtnText}>Pengeluaran</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onOpenAddTransaction('INCOME')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.incomeLight }]}>
            <Ionicons name="arrow-down-circle" size={24} color={colors.income} />
          </View>
          <Text style={styles.actionBtnText}>Pemasukan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onOpenAddTransaction('TRANSFER')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.transferLight }]}>
            <Ionicons name="swap-horizontal" size={24} color={colors.transfer} />
          </View>
          <Text style={styles.actionBtnText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('budgets')}>
          <View style={[styles.actionIconBg, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="pie-chart" size={24} color={colors.warning} />
          </View>
          <Text style={styles.actionBtnText}>Anggaran</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Dompet & Akun (Horizontal Scroll) */}
      <View style={[styles.sectionHeader, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>Dompet Saya</Text>
        <TouchableOpacity onPress={() => onNavigate('wallets')}>
          <Text style={styles.seeAllText}>Kelola</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
        {wallets.map((w: any) => (
          <View key={w.id} style={styles.walletCard}>
            <View style={styles.walletCardTop}>
              <View style={[styles.walletIconBg, { backgroundColor: w.color || colors.primary }]}>
                <Ionicons name="wallet-outline" size={16} color="#FFF" />
              </View>
              <Text style={styles.walletType}>{w.type}</Text>
            </View>
            <Text style={styles.walletName}>{w.name}</Text>
            <Text style={styles.walletBalance}>
              {showBalance ? formatRupiah(w.currentBalance) : '••••••'}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 4. Fitur Tambahan (Hutang & Target Tabungan Shortcut) */}
      <View style={styles.featureShortcutsRow}>
        <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('debts')}>
          <View style={[styles.shortcutIconBg, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="hand-left" size={18} color={colors.expense} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Hutang & Piutang</Text>
            <Text style={styles.shortcutDesc}>
              {overview?.debts?.debtToPay > 0
                ? `Hutang: ${formatRupiah(overview.debts.debtToPay)}`
                : 'Semua lunas'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shortcutCard} onPress={() => onNavigate('goals')}>
          <View style={[styles.shortcutIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="flag" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Target Tabungan</Text>
            <Text style={styles.shortcutDesc}>Celengan & impian</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 5. Transaksi Terkini */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Transaksi Terkini</Text>
        <TouchableOpacity onPress={() => onNavigate('transactions')}>
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionList}>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        ) : (
          recentTransactions.map((tx: any) => {
            const isExpense = tx.type === 'EXPENSE';
            const isIncome = tx.type === 'INCOME';

            return (
              <View key={tx.id} style={styles.txItem}>
                <View
                  style={[
                    styles.txIconBg,
                    {
                      backgroundColor: isExpense
                        ? colors.expenseLight
                        : isIncome
                        ? colors.incomeLight
                        : colors.transferLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isExpense
                        ? 'arrow-up'
                        : isIncome
                        ? 'arrow-down'
                        : 'swap-horizontal'
                    }
                    size={18}
                    color={
                      isExpense
                        ? colors.expense
                        : isIncome
                        ? colors.income
                        : colors.transfer
                    }
                  />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>
                    {tx.category?.name || (tx.type === 'TRANSFER' ? 'Transfer Saldo' : 'Lain-lain')}
                  </Text>
                  <Text style={styles.txMeta}>
                    {tx.sourceWallet?.name} • {formatDate(tx.transactionDate)}
                  </Text>
                  {tx.notes ? <Text style={styles.txNotes}>{tx.notes}</Text> : null}
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: isExpense
                        ? colors.expense
                        : isIncome
                        ? colors.income
                        : colors.transfer,
                    },
                  ]}
                >
                  {isExpense ? '- ' : isIncome ? '+ ' : ''}
                  {formatRupiah(tx.amount)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  netWorthCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  netWorthAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 12,
  },
  cashFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  cashFlowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  arrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashFlowSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  cashFlowVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  walletScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  walletCard: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletType: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  walletName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 4,
  },
  featureShortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  shortcutDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionList: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  txIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  txMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txNotes: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
});
