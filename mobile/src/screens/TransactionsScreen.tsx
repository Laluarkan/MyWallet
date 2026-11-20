import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah, formatDate } from '../utils/format';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';

export const TransactionsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (search.trim()) params.search = search.trim();

      const data = await api.getTransactions(params);
      setTransactions(data || []);
    } catch (e) {
      console.log('Error loading transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filterType]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Saldo dompet akan dikembalikan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteTransaction(id);
              loadTransactions();
            } catch (err: any) {
              Alert.alert('Gagal', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Riwayat Transaksi" subtitle="Kelola dan pantau arus keluar masuk uang" />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari catatan transaksi..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadTransactions}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); loadTransactions(); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map((t) => {
          const label =
            t === 'ALL'
              ? 'Semua'
              : t === 'EXPENSE'
              ? 'Pengeluaran'
              : t === 'INCOME'
              ? 'Pemasukan'
              : 'Transfer';
          const active = filterType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setFilterType(t)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transaction FlatList */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Tidak ada transaksi</Text>
            <Text style={styles.emptyDesc}>Belum ada catatan yang sesuai dengan filter.</Text>
          </View>
        }
        renderItem={({ item: tx }) => {
          const isExpense = tx.type === 'EXPENSE';
          const isIncome = tx.type === 'INCOME';

          return (
            <View style={styles.txCard}>
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
                  size={20}
                  color={
                    isExpense
                      ? colors.expense
                      : isIncome
                      ? colors.income
                      : colors.transfer
                  }
                />
              </View>

              <View style={styles.txDetails}>
                <Text style={styles.txCategory}>
                  {tx.category?.name || (tx.type === 'TRANSFER' ? 'Transfer Saldo' : 'Lain-lain')}
                </Text>
                <Text style={styles.txWalletDate}>
                  {`${tx.sourceWallet?.name || 'Dompet'}${tx.destinationWallet ? ` ➔ ${tx.destinationWallet.name}` : ''} • ${formatDate(tx.transactionDate)}`}
                </Text>
                {tx.notes ? <Text style={styles.txNotes}>{tx.notes}</Text> : null}
              </View>

              <View style={styles.txRight}>
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
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(tx.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  txCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  txWalletDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txNotes: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
