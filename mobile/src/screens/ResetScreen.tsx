import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

interface ResetScreenProps {
  onBack: () => void;
  onResetSuccess: () => void;
}

export const ResetScreen: React.FC<ResetScreenProps> = ({
  onBack,
  onResetSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [overview, setOverview] = useState<any>(null);

  // Opsi Reset
  const [clearTransactions, setClearTransactions] = useState(true);
  const [resetGoals, setResetGoals] = useState(false);
  const [resetDebts, setResetDebts] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getOverview();
      setOverview(data);
    } catch (e) {
      console.log('Error loading data for reset:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteReset = () => {
    Alert.alert(
      '⚠️ Konfirmasi Reset Dana',
      'Apakah Anda benar-benar yakin ingin mereset saldo dana Anda agar dimulai dari Rp 0?\n\nTindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Reset ke 0',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await api.resetAllFunds({
                clearTransactions,
                resetGoals,
                resetDebts,
              });

              Alert.alert('Sukses', 'Seluruh saldo dana telah berhasil direset ke Rp 0!');
              onResetSuccess();
              onBack();
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Terjadi kesalahan saat mereset data');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const totalNetWorth = overview?.totalNetWorth || 0;
  const wallets = overview?.wallets || [];
  const recentTransactions = overview?.recentTransactions || [];

  return (
    <View style={styles.container}>
      <Header
        title="Reset & Mulai Ulang"
        subtitle="Mulai pencatatan keuangan Anda dari Rp 0"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Perhatian Sebelum Mereset</Text>
            <Text style={styles.warningDesc}>
              Fitur ini digunakan jika Anda ingin mereset seluruh nominal uang dan memulai pembukuan dari angka nol tanpa perlu membuat akun baru.
            </Text>
          </View>
        </View>

        {/* Ringkasan Data Saat Ini */}
        <Text style={styles.sectionTitle}>Data Saat Ini</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Saldo Saat Ini</Text>
            <Text style={styles.infoValHighlight}>{formatRupiah(totalNetWorth)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jumlah Dompet Terdaftar</Text>
            <Text style={styles.infoVal}>{wallets.length} Akun / Dompet</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catatan Transaksi</Text>
            <Text style={styles.infoVal}>{recentTransactions.length > 0 ? 'Tersedia' : 'Kosong'}</Text>
          </View>
        </View>

        {/* Opsi Reset */}
        <Text style={styles.sectionTitle}>Opsi Pengaturan Reset</Text>
        <View style={styles.optionsCard}>
          {/* Opsi 1: Set Saldo ke 0 (Wajib) */}
          <View style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Nolkan Semua Saldo Dompet</Text>
              <Text style={styles.optionDesc}>
                Saldo kas tunai, bank, dan e-wallet akan diubah menjadi Rp 0.
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>

          <View style={styles.divider} />

          {/* Opsi 2: Bersihkan Transaksi */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setClearTransactions(!clearTransactions)}
          >
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Bersihkan Riwayat Transaksi</Text>
              <Text style={styles.optionDesc}>
                Hapus catatan pemasukan, pengeluaran & transfer agar arus kas bersih dimulai dari 0.
              </Text>
            </View>
            <Ionicons
              name={clearTransactions ? 'checkbox' : 'square-outline'}
              size={24}
              color={clearTransactions ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Opsi 3: Reset Celengan Tabungan */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setResetGoals(!resetGoals)}
          >
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Kosongkan Tabungan Celengan</Text>
              <Text style={styles.optionDesc}>
                Nolkan saldo yang terkumpul di target tabungan impian Anda.
              </Text>
            </View>
            <Ionicons
              name={resetGoals ? 'checkbox' : 'square-outline'}
              size={24}
              color={resetGoals ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Opsi 4: Reset Hutang Piutang */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setResetDebts(!resetDebts)}
          >
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Reset Catatan Hutang & Piutang</Text>
              <Text style={styles.optionDesc}>
                Reset riwayat cicilan dan kembalikan status hutang/piutang ke awal.
              </Text>
            </View>
            <Ionicons
              name={resetDebts ? 'checkbox' : 'square-outline'}
              size={24}
              color={resetDebts ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Tombol Eksekusi Reset */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleExecuteReset}
          disabled={resetting}
        >
          {resetting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="refresh-circle" size={22} color="#FFF" />
              <Text style={styles.resetBtnText}>Mulai Ulang Dana dari Rp 0</Text>
            </>
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
  content: {
    padding: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  warningDesc: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  infoValHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.expense,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  optionsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    backgroundColor: colors.expense,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.expense,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  resetBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
