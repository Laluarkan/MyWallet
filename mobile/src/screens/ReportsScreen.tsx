import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

export const ReportsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [breakdown, trend] = await Promise.all([
        api.getCategoryBreakdown(),
        api.getMonthlyTrend(),
      ]);
      setBreakdownData(breakdown || null);
      setTrendData(trend || []);
    } catch (e) {
      console.log('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const totalExpense = breakdownData?.totalExpense || 0;
  const categories = breakdownData?.breakdown || [];

  return (
    <View style={styles.container}>
      <Header title="Laporan Keuangan" subtitle="Analisis pola pengeluaran & tren arus kas" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReports} colors={[colors.primary]} />}
      >
        {/* Total Pengeluaran Bulan Ini */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Pengeluaran Bulan Ini</Text>
          <Text style={styles.totalValue}>{formatRupiah(totalExpense)}</Text>
        </View>

        {/* 1. Pengeluaran Per Kategori */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Proporsi Pengeluaran Kategori</Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada data pengeluaran bulan ini</Text>
          </View>
        ) : (
          <View style={styles.categoryCardList}>
            {categories.map((c: any, idx: number) => (
              <View key={idx} style={styles.catItem}>
                <View style={styles.catRowTop}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: c.color || colors.primary }]} />
                    <Text style={styles.catName}>{c.name}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmount}>{formatRupiah(c.total)}</Text>
                    <Text style={styles.catPercentage}>{c.percentage}%</Text>
                  </View>
                </View>

                <View style={{ marginTop: 6 }}>
                  <ProgressBar percentage={c.percentage} color={c.color || colors.primary} height={6} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 2. Tren 6 Bulan Terakhir */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Tren 6 Bulan Terakhir</Text>
        </View>

        {trendData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trending-up-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada data tren bulanan</Text>
          </View>
        ) : (
          <View style={styles.trendList}>
            {trendData.map((m, idx) => (
              <View key={idx} style={styles.trendRow}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthText}>{m.month}</Text>
                </View>

                <View style={styles.trendBarsContainer}>
                  <View style={styles.trendBarRow}>
                    <Text style={styles.trendBarLabel}>Masuk</Text>
                    <Text style={[styles.trendBarVal, { color: colors.income }]}>
                      {formatRupiah(m.income)}
                    </Text>
                  </View>

                  <View style={styles.trendBarRow}>
                    <Text style={styles.trendBarLabel}>Keluar</Text>
                    <Text style={[styles.trendBarVal, { color: colors.expense }]}>
                      {formatRupiah(m.expense)}
                    </Text>
                  </View>
                </View>

                <View style={styles.netFlowContainer}>
                  <Text style={styles.netLabel}>Arus Kas</Text>
                  <Text
                    style={[
                      styles.netVal,
                      { color: m.net >= 0 ? colors.income : colors.expense },
                    ]}
                  >
                    {m.net >= 0 ? '+' : ''}{formatRupiah(m.net)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
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
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  totalValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  categoryCardList: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catItem: {
    marginBottom: 14,
  },
  catRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  trendList: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  monthBadge: {
    width: 44,
    height: 36,
    backgroundColor: colors.cardAlt,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  trendBarsContainer: {
    flex: 1,
    gap: 4,
  },
  trendBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendBarLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  trendBarVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  netFlowContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  netLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  netVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
});
