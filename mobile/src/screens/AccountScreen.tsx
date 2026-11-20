import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { authService, UserSession } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

interface AccountScreenProps {
  onBack: () => void;
  onRefreshData?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onBack,
  onRefreshData,
}) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Mode
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadSession = async () => {
    const s = await authService.getSession();
    setSession(s);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Email dan password wajib diisi');
      return;
    }
    if (isRegister && !name.trim()) {
      Alert.alert('Perhatian', 'Nama wajib diisi untuk pendaftaran');
      return;
    }

    setLoading(true);
    try {
      let res: UserSession;
      if (isRegister) {
        res = await authService.register(name.trim(), email.trim(), password);
        Alert.alert('Sukses', `Selamat datang, ${res.user.name}! Akun Anda berhasil dibuat.`);
      } else {
        res = await authService.login(email.trim(), password);
        Alert.alert('Sukses', `Selamat datang kembali, ${res.user.name}!`);
      }
      setSession(res);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kesalahan saat otentikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          setSession(null);
          Alert.alert('Informasi', 'Anda kembali ke Mode Tamu. Data keuangan lokal Anda tetap aman di HP.');
        },
      },
    ]);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      await authService.backupToCloud();
      Alert.alert('Sukses', 'Seluruh data keuangan lokal Anda berhasil dicadangkan ke cloud dengan aman!');
    } catch (err: any) {
      Alert.alert('Gagal Cadangkan', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Konfirmasi Pemulihan',
      'Apakah Anda ingin memulihkan cadangan cloud? Data di HP akan disinkronkan dengan cadangan terakhir Anda.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Pulihkan',
          onPress: async () => {
            setLoading(true);
            try {
              await authService.restoreFromCloud();
              Alert.alert('Sukses', 'Data cadangan berhasil dipulihkan ke HP Anda!');
              if (onRefreshData) onRefreshData();
            } catch (err: any) {
              Alert.alert('Gagal Pulihkan', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Akun & Privasi"
        subtitle="Kelola akun & pencadangan cloud Anda"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Guarantee Banner */}
        <View style={styles.privacyBanner}>
          <View style={styles.privacyIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>Privasi Finansial Terjamin 100%</Text>
            <Text style={styles.privacyDesc}>
              Aplikasi ini menganut arsitektur <Text style={{ fontWeight: '700' }}>Local-First</Text>. Seluruh saldo dan transaksi Anda disimpan aman secara lokal di HP Anda dan tidak pernah dibaca oleh server.
            </Text>
          </View>
        </View>

        {session ? (
          /* ================= SUDAH LOGIN ================= */
          <View>
            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{session.user.name}</Text>
                <Text style={styles.userEmail}>{session.user.email}</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{session.user.tier} MEMBER</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Pencadangan Cloud Pribadi</Text>
            <View style={styles.cardContainer}>
              <Text style={styles.cardDesc}>
                Cadangkan data keuangan lokal Anda ke akun cloud pribadi agar aman jika Anda berpindah HP.
              </Text>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleBackup}
                disabled={loading}
              >
                <Ionicons name="cloud-upload" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Cadangkan Data ke Cloud</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }]}
                onPress={handleRestore}
                disabled={loading}
              >
                <Ionicons name="cloud-download-outline" size={18} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Pulihkan Cadangan Terakhir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.expense} />
              <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= BELUM LOGIN (MODE TAMU) ================= */
          <View>
            <View style={styles.guestCard}>
              <View style={styles.guestIconWrap}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>Mode Tamu (Aktif)</Text>
                <Text style={styles.guestDesc}>
                  Aplikasi dapat digunakan bebas tanpa akun. Login hanya diperlukan jika Anda ingin menggunakan fitur pencadangan cloud.
                </Text>
              </View>
            </View>

            {/* Auth Form Card */}
            <View style={styles.cardContainer}>
              {/* Tab Toggle: Masuk vs Daftar */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, !isRegister && styles.tabBtnActive]}
                  onPress={() => setIsRegister(false)}
                >
                  <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Masuk Akun</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, isRegister && styles.tabBtnActive]}
                  onPress={() => setIsRegister(true)}
                >
                  <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Daftar Baru</Text>
                </TouchableOpacity>
              </View>

              {isRegister && (
                <>
                  <Text style={styles.inputLabel}>Nama Lengkap</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Budi Santoso"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Alamat Email</Text>
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAuthSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Akun'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  privacyBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  privacyDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  guestCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  guestDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  logoutBtnText: {
    color: colors.expense,
    fontSize: 13,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
