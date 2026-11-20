import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  formatRupiah,
  formatNumberWithDots,
  parseNumberFromDots,
  formatUsdInput,
  parseUsdInput,
} from '../utils/format';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

interface AddTransactionScreenProps {
  initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({
  initialType = 'EXPENSE',
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [feeStr, setFeeStr] = useState('');

  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedDestWalletId, setSelectedDestWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, [type]);

  const loadOptions = async () => {
    try {
      const [walletList, categoryList] = await Promise.all([
        api.getWallets(),
        type !== 'TRANSFER' ? api.getCategories(type) : Promise.resolve([]),
      ]);

      setWallets(walletList || []);
      if (walletList && walletList.length > 0 && !selectedWalletId) {
        setSelectedWalletId(walletList[0].id);
        if (walletList.length > 1) setSelectedDestWalletId(walletList[1].id);
      }

      setCategories(categoryList || []);
      if (categoryList && categoryList.length > 0) {
        setSelectedCategoryId(categoryList[0].id);
      }
    } catch (e) {
      console.log('Error loading options:', e);
    }
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const isUsd = selectedWallet?.currency === 'USD';

  const handleAddQuickAmount = (val: number) => {
    if (isUsd) {
      const current = parseUsdInput(amountStr);
      const updated = current + val;
      setAmountStr(updated % 1 === 0 ? String(updated) : updated.toFixed(2));
    } else {
      const current = parseNumberFromDots(amountStr);
      setAmountStr(formatNumberWithDots(current + val));
    }
  };

  const handleSubmit = async () => {
    const amount = isUsd ? parseUsdInput(amountStr) : parseNumberFromDots(amountStr);
    if (!amount || amount <= 0) {
      Alert.alert('Perhatian', 'Masukkan nominal yang valid');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Perhatian', 'Pilih dompet sumber transaksi');
      return;
    }

    if (type === 'TRANSFER' && !selectedDestWalletId) {
      Alert.alert('Perhatian', 'Pilih dompet tujuan transfer');
      return;
    }

    if (type === 'TRANSFER' && selectedWalletId === selectedDestWalletId) {
      Alert.alert('Perhatian', 'Dompet sumber dan tujuan tidak boleh sama');
      return;
    }

    const feeAmount = isUsd ? parseUsdInput(feeStr) : parseNumberFromDots(feeStr);

    setLoading(true);
    try {
      await api.createTransaction({
        type,
        amount,
        feeAmount,
        sourceWalletId: selectedWalletId,
        destinationWalletId: type === 'TRANSFER' ? selectedDestWalletId : null,
        categoryId: type !== 'TRANSFER' ? selectedCategoryId : null,
        notes: notes.trim() || null,
        transactionDate: new Date().toISOString(),
      });

      Alert.alert('Sukses', 'Transaksi berhasil disimpan!');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const rawAmount = isUsd ? parseUsdInput(amountStr) : parseNumberFromDots(amountStr);

  return (
    <View style={styles.container}>
      {/* Modal Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Catat Transaksi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* 1. Segmented Control: Expense, Income, Transfer */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              type === 'EXPENSE' && { backgroundColor: colors.expense },
            ]}
            onPress={() => setType('EXPENSE')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'EXPENSE' && styles.segmentTextActive,
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              type === 'INCOME' && { backgroundColor: colors.income },
            ]}
            onPress={() => setType('INCOME')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'INCOME' && styles.segmentTextActive,
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              type === 'TRANSFER' && { backgroundColor: colors.transfer },
            ]}
            onPress={() => setType('TRANSFER')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'TRANSFER' && styles.segmentTextActive,
              ]}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Amount Input Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            Nominal Transaksi ({isUsd ? 'USD $' : 'IDR Rp'})
          </Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>{isUsd ? '$' : 'Rp'}</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType={isUsd ? 'decimal-pad' : 'numeric'}
              placeholder={isUsd ? '0.00' : '0'}
              placeholderTextColor="#CBD5E1"
              value={amountStr}
              onChangeText={(text) =>
                setAmountStr(isUsd ? formatUsdInput(text) : formatNumberWithDots(text))
              }
              autoFocus
            />
          </View>
          {isUsd && (
            <View style={styles.usdHintRow}>
              <Ionicons name="information-circle-outline" size={14} color="#1E40AF" />
              <Text style={styles.usdHintText}>
                Untuk dolar, gunakan tanda titik (.) untuk sen/desimal, contoh: 12.50 (bukan koma).
              </Text>
            </View>
          )}
          {rawAmount > 0 ? (
            <Text style={styles.amountFormatted}>
              {isUsd
                ? `$ ${rawAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : formatRupiah(rawAmount)}
            </Text>
          ) : null}

          {/* Quick Amount Pills */}
          <View style={styles.quickAmountRow}>
            {isUsd ? (
              <>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(1)}>
                  <Text style={styles.quickPillText}>+$1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(5)}>
                  <Text style={styles.quickPillText}>+$5</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(10)}>
                  <Text style={styles.quickPillText}>+$10</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(50)}>
                  <Text style={styles.quickPillText}>+$50</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(10000)}>
                  <Text style={styles.quickPillText}>+10rb</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(50000)}>
                  <Text style={styles.quickPillText}>+50rb</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(100000)}>
                  <Text style={styles.quickPillText}>+100rb</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickPill} onPress={() => handleAddQuickAmount(500000)}>
                  <Text style={styles.quickPillText}>+500rb</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 3. Dompet Sumber */}
        <Text style={styles.fieldLabel}>
          {type === 'TRANSFER' ? 'Dari Dompet (Sumber)' : 'Dompet / Akun'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {wallets.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.optionPill,
                selectedWalletId === w.id && styles.optionPillActive,
              ]}
              onPress={() => setSelectedWalletId(w.id)}
            >
              <Ionicons
                name="wallet"
                size={14}
                color={selectedWalletId === w.id ? '#FFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionPillText,
                  selectedWalletId === w.id && styles.optionPillTextActive,
                ]}
              >
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 4. Dompet Tujuan (Khusus Transfer) */}
        {type === 'TRANSFER' && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ke Dompet (Tujuan)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.optionPill,
                    selectedDestWalletId === w.id && { backgroundColor: colors.transfer, borderColor: colors.transfer },
                  ]}
                  onPress={() => setSelectedDestWalletId(w.id)}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={14}
                    color={selectedDestWalletId === w.id ? '#FFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.optionPillText,
                      selectedDestWalletId === w.id && styles.optionPillTextActive,
                    ]}
                  >
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Biaya Transfer / Admin ({isUsd ? '$ USD' : 'Rp IDR'}) (Opsional)
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType={isUsd ? 'decimal-pad' : 'numeric'}
              placeholder={isUsd ? '0.00 (misal: 1.50)' : '0 (misal: 2.500 atau 6.500)'}
              placeholderTextColor={colors.textMuted}
              value={feeStr}
              onChangeText={(text) =>
                setFeeStr(isUsd ? formatUsdInput(text) : formatNumberWithDots(text))
              }
            />
          </>
        )}

        {/* 5. Kategori (Hanya untuk Expense & Income) */}
        {type !== 'TRANSFER' && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Kategori</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && {
                        borderColor: type === 'EXPENSE' ? colors.expense : colors.income,
                        backgroundColor: type === 'EXPENSE' ? '#FEF2F2' : '#F0FDF4',
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: cat.color || colors.primary },
                      ]}
                    >
                      <Ionicons name="pricetag" size={14} color="#FFF" />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.catName,
                        isSelected && { fontWeight: '700', color: colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 6. Catatan */}
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Catatan (Opsional)</Text>
        <TextInput
          style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Contoh: Makan siang bareng teman, bayar wifi..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        {/* 7. Tombol Simpan */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor:
                type === 'EXPENSE'
                  ? colors.expense
                  : type === 'INCOME'
                  ? colors.income
                  : colors.transfer,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Simpan Transaksi</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  amountCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  amountFormatted: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 4,
  },
  usdHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  usdHintText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 15,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickPill: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  optionsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  optionPillTextActive: {
    color: '#FFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  catIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
