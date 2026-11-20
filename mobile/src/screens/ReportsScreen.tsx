import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/format';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { ProgressBar } from '../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const ReportsScreen = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [showMonthModal, setShowMonthModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [loading, setLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [breakdown, trend] = await Promise.all([
        api.getCategoryBreakdown(selectedMonth, selectedYear),
        api.getMonthlyTrend(selectedMonth, selectedYear),
      ]);
      setReportData(breakdown || null);
      setTrendData(trend || []);
    } catch (e) {
      console.log('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedMonth, selectedYear]);

  // Navigasi Bulan: Mundur / Maju
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const totalExpense = reportData?.totalExpense || 0;
  const totalIncome = reportData?.totalIncome || 0;
  const netCashFlow = reportData?.netCashFlow || 0;
  const savingRate = reportData?.savingRate || 0;
  const txCount = reportData?.txCount || 0;

  const expenseBreakdown = reportData?.expenseBreakdown || [];
  const incomeBreakdown = reportData?.incomeBreakdown || [];

  const activeBreakdown =
    activeTab === 'EXPENSE' ? expenseBreakdown : incomeBreakdown;
  const activeTotal = activeTab === 'EXPENSE' ? totalExpense : totalIncome;
  const topCategory = activeBreakdown.length > 0 ? activeBreakdown[0] : null;

  // Evaluasi Rasio Tabungan
  const getSavingRateBadge = () => {
    if (totalIncome === 0 && totalExpense > 0) {
      return { text: 'Perlu Penghematan', color: colors.expense, bg: '#FEE2E2' };
    }
    if (savingRate >= 30) {
      return { text: 'Sangat Sehat 🌟', color: '#059669', bg: '#D1FAE5' };
    }
    if (savingRate >= 15) {
      return { text: 'Cukup Sehat 👍', color: '#0284C7', bg: '#E0F2FE' };
    }
    if (savingRate > 0) {
      return { text: 'Waspada ⚠️', color: '#D97706', bg: '#FEF3C7' };
    }
    return { text: 'Defisit 🚨', color: colors.expense, bg: '#FEE2E2' };
  };

  const healthBadge = getSavingRateBadge();

  return (
    <View style={styles.container}>
      <Header
        title="Laporan & Analisis"
        subtitle="Dashboard keuangan, proporsi & tren arus kas"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadReports}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Bar Navigasi Periode & Bulan */}
        <View style={styles.periodBar}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.periodArrowBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.periodCenterBtn}
            onPress={() => setShowMonthModal(true)}
          >
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.periodText}>
              {`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.periodArrowBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!isCurrentMonth ? (
          <TouchableOpacity
            style={styles.currentMonthPill}
            onPress={handleResetToCurrentMonth}
          >
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={styles.currentMonthPillText}>
              {'Kembali ke Bulan Ini'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* 2. Hero Card: Ringkasan Arus Kas & Kesehatan Keuangan */}
        <View style={styles.heroSummaryCard}>
          {/* Top: Arus Kas Bersih & Rasio Tabungan */}
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroSubLabel}>{'Sisa Arus Kas / Tabungan'}</Text>
              <Text
                style={[
                  styles.heroNetValue,
                  { color: netCashFlow >= 0 ? '#10B981' : colors.expense },
                ]}
              >
                {`${netCashFlow >= 0 ? '+' : ''}${formatRupiah(netCashFlow)}`}
              </Text>
            </View>

            <View style={[styles.healthBadgeWrap, { backgroundColor: healthBadge.bg }]}>
              <Text style={[styles.healthBadgeText, { color: healthBadge.color }]}>
                {healthBadge.text}
              </Text>
              <Text style={styles.savingRateSubText}>
                {`Rasio: ${savingRate}%`}
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          {/* Bottom: Pemasukan & Pengeluaran Berdampingan */}
          <View style={styles.heroCashflowCols}>
            {/* Pemasukan */}
            <View style={styles.heroFlowCol}>
              <View style={styles.flowIconAndLabel}>
                <View style={[styles.miniFlowDot, { backgroundColor: colors.income }]} />
                <Text style={styles.flowLabelText}>{'Pemasukan'}</Text>
              </View>
              <Text style={[styles.flowAmountText, { color: colors.income }]}>
                {formatRupiah(totalIncome)}
              </Text>
            </View>

            <View style={styles.heroVerticalDivider} />

            {/* Pengeluaran */}
            <View style={styles.heroFlowCol}>
              <View style={styles.flowIconAndLabel}>
                <View style={[styles.miniFlowDot, { backgroundColor: colors.expense }]} />
                <Text style={styles.flowLabelText}>{'Pengeluaran'}</Text>
              </View>
              <Text style={[styles.flowAmountText, { color: colors.expense }]}>
                {formatRupiah(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Segmented Tab Switcher (Pengeluaran vs Pemasukan) */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'EXPENSE' && styles.tabSwitchBtnExpenseActive,
            ]}
            onPress={() => setActiveTab('EXPENSE')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={15}
              color={activeTab === 'EXPENSE' ? '#FFF' : colors.expense}
            />
            <Text
              style={[
                styles.tabSwitchBtnText,
                activeTab === 'EXPENSE' && styles.tabSwitchBtnTextActive,
              ]}
            >
              {`Pengeluaran (${formatRupiah(totalExpense)})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'INCOME' && styles.tabSwitchBtnIncomeActive,
            ]}
            onPress={() => setActiveTab('INCOME')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={15}
              color={activeTab === 'INCOME' ? '#FFF' : colors.income}
            />
            <Text
              style={[
                styles.tabSwitchBtnText,
                activeTab === 'INCOME' && styles.tabSwitchBtnTextActive,
              ]}
            >
              {`Pemasukan (${formatRupiah(totalIncome)})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Donut & Visual Segmented Proportion Chart */}
        <View style={styles.cardSection}>
          <View style={styles.cardSectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeaderTitle}>
                {activeTab === 'EXPENSE'
                  ? 'Distribusi Pengeluaran Kategori'
                  : 'Distribusi Sumber Pemasukan'}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                {`${activeBreakdown.length} kategori tercatat pada periode ini`}
              </Text>
            </View>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>
                {`${txCount} Transaksi`}
              </Text>
            </View>
          </View>

          {activeBreakdown.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{'Belum Ada Transaksi'}</Text>
              <Text style={styles.emptySub}>
                {`Tidak ada data ${
                  activeTab === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'
                } pada ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`}
              </Text>
            </View>
          ) : (
            <>
              {/* Donut Chart Visual Representation */}
              <View style={styles.donutMeterWrapper}>
                <View
                  style={[
                    styles.donutRingOuter,
                    {
                      borderColor:
                        activeBreakdown[0]?.color ||
                        (activeTab === 'EXPENSE' ? colors.expense : colors.income),
                    },
                  ]}
                >
                  <View style={styles.donutRingInner}>
                    <Text style={styles.donutCoreLabel}>
                      {`Total ${activeTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}`}
                    </Text>
                    <Text style={styles.donutCoreAmount}>
                      {formatRupiah(activeTotal)}
                    </Text>
                    <View style={styles.donutCoreBadge}>
                      <Text style={styles.donutCoreBadgeText}>
                        {`${activeBreakdown.length} Kategori`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Segmented Multi-Color Distribution Bar */}
              <View style={styles.multiColorBarWrap}>
                <View style={styles.multiColorBar}>
                  {activeBreakdown.map((item: any, idx: number) => {
                    const pct = Math.max(Number(item.percentage) || 1, 1);
                    return (
                      <View
                        key={`bar_${idx}`}
                        style={{
                          flex: pct,
                          backgroundColor: item.color || colors.primary,
                          height: '100%',
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Pos Terbesar Callout Banner */}
              {topCategory ? (
                <View style={styles.topPosCard}>
                  <View style={styles.topPosIconWrap}>
                    <Ionicons name="trophy" size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topPosTitle}>
                      {`Pos Terbesar: ${topCategory.name}`}
                    </Text>
                    <Text style={styles.topPosSub}>
                      {`Porsi ${topCategory.percentage}% (${formatRupiah(topCategory.total)}) dari total.`}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Daftar Kategori Terperinci */}
              <View style={styles.catDetailsList}>
                {activeBreakdown.map((item: any, idx: number) => (
                  <View key={`cat_${idx}`} style={styles.catItemRow}>
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: item.color || colors.primary },
                      ]}
                    >
                      <Ionicons
                        name={(item.icon as any) || 'pricetag'}
                        size={15}
                        color="#FFF"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.catInfoTopLine}>
                        <Text style={styles.catInfoName}>{item.name}</Text>
                        <View style={styles.catAmountRow}>
                          <Text style={styles.catAmountVal}>
                            {formatRupiah(item.total)}
                          </Text>
                          <View
                            style={[
                              styles.catPercentPill,
                              { backgroundColor: `${item.color || colors.primary}20` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.catPercentPillText,
                                { color: item.color || colors.primary },
                              ]}
                            >
                              {`${item.percentage}%`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.progressBarWrapper}>
                        <ProgressBar
                          percentage={item.percentage}
                          color={item.color || colors.primary}
                          height={7}
                        />
                      </View>

                      <Text style={styles.catTxCounter}>
                        {`${item.count} transaksi dicatat`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* 5. Grafik Tren Arus Kas 6 Bulan Terakhir */}
        <View style={styles.cardSection}>
          <View style={styles.cardSectionHeader}>
            <View>
              <Text style={styles.sectionHeaderTitle}>
                {'Tren Arus Kas 6 Bulan Terakhir'}
              </Text>
              <Text style={styles.sectionHeaderSub}>
                {'Perbandingan pemasukan vs pengeluaran antar bulan'}
              </Text>
            </View>
          </View>

          {trendData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trending-up-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptySub}>
                {'Belum ada data tren perbandingan.'}
              </Text>
            </View>
          ) : (
            <View style={styles.trendRowList}>
              {trendData.map((m: any, idx: number) => {
                const maxVal = Math.max(
                  ...trendData.map((t) => Math.max(t.income, t.expense, 1))
                );
                const incPct = Math.min(Math.round((m.income / maxVal) * 100), 100);
                const expPct = Math.min(Math.round((m.expense / maxVal) * 100), 100);
                const isSelected =
                  m.monthIndex === selectedMonth && m.year === selectedYear;

                return (
                  <View
                    key={`trend_${idx}`}
                    style={[
                      styles.trendItemCard,
                      isSelected && styles.trendItemCardActive,
                    ]}
                  >
                    <View style={styles.trendMonthInfo}>
                      <Text
                        style={[
                          styles.trendMonthLabel,
                          isSelected && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        {m.month}
                      </Text>
                      <Text style={styles.trendYearLabel}>{`${m.year}`}</Text>
                    </View>

                    <View style={styles.trendBarCluster}>
                      {/* Bar Masuk */}
                      <View style={styles.barCompareItem}>
                        <View style={styles.barTrackBackground}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${Math.max(incPct, 4)}%`,
                                backgroundColor: colors.income,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barAmountText, { color: colors.income }]}>
                          {formatRupiah(m.income)}
                        </Text>
                      </View>

                      {/* Bar Keluar */}
                      <View style={styles.barCompareItem}>
                        <View style={styles.barTrackBackground}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${Math.max(expPct, 4)}%`,
                                backgroundColor: colors.expense,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barAmountText, { color: colors.expense }]}>
                          {formatRupiah(m.expense)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.trendNetSummary}>
                      <Text style={styles.trendNetTitle}>{'Sisa'}</Text>
                      <Text
                        style={[
                          styles.trendNetAmount,
                          { color: m.net >= 0 ? colors.income : colors.expense },
                        ]}
                      >
                        {`${m.net >= 0 ? '+' : ''}${formatRupiah(m.net)}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Pemilih Periode Bulan & Tahun */}
      <Modal visible={showMonthModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.monthPickerBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>{'Pilih Periode Laporan'}</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Pengatur Tahun */}
            <View style={styles.yearNavigator}>
              <TouchableOpacity
                onPress={() => setSelectedYear((y) => y - 1)}
                style={styles.yearNavBtn}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.yearDisplayVal}>{`${selectedYear}`}</Text>
              <TouchableOpacity
                onPress={() => setSelectedYear((y) => y + 1)}
                style={styles.yearNavBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Grid 12 Bulan */}
            <View style={styles.monthOptionsGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = selectedMonth === idx;
                const isCurrent =
                  idx === now.getMonth() && selectedYear === now.getFullYear();

                return (
                  <TouchableOpacity
                    key={`m_${idx}`}
                    style={[
                      styles.monthOptionCell,
                      isSelected && styles.monthOptionCellSelected,
                      isCurrent && !isSelected && styles.monthOptionCellCurrent,
                    ]}
                    onPress={() => {
                      setSelectedMonth(idx);
                      setShowMonthModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthOptionCellText,
                        isSelected && styles.monthOptionCellTextSelected,
                        isCurrent && !isSelected && { color: colors.primary, fontWeight: '800' },
                      ]}
                    >
                      {name.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  periodArrowBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
  },
  periodCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  currentMonthPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  currentMonthPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  heroSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  heroNetValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  healthBadgeWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  savingRateSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  heroCashflowCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroFlowCol: {
    flex: 1,
  },
  flowIconAndLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  miniFlowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flowLabelText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  flowAmountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  heroVerticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabSwitchBtnExpenseActive: {
    backgroundColor: colors.expense,
  },
  tabSwitchBtnIncomeActive: {
    backgroundColor: colors.income,
  },
  tabSwitchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabSwitchBtnTextActive: {
    color: '#FFF',
  },
  cardSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeCount: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  donutMeterWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  donutRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
  },
  donutRingInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  donutCoreLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  donutCoreAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginTop: 2,
  },
  donutCoreBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  donutCoreBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  multiColorBarWrap: {
    marginBottom: 14,
  },
  multiColorBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
  },
  topPosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  topPosIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPosTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  topPosSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  catDetailsList: {
    gap: 12,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  catIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfoTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catInfoName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catAmountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  catPercentPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  catPercentPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarWrapper: {
    marginTop: 5,
    marginBottom: 3,
  },
  catTxCounter: {
    fontSize: 10,
    color: colors.textMuted,
  },
  trendRowList: {
    gap: 12,
  },
  trendItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
  },
  trendItemCardActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  trendMonthInfo: {
    width: 44,
    alignItems: 'center',
  },
  trendMonthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  trendYearLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  trendBarCluster: {
    flex: 1,
    gap: 6,
  },
  barCompareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barTrackBackground: {
    flex: 1,
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barAmountText: {
    fontSize: 10,
    fontWeight: '800',
    width: 80,
    textAlign: 'right',
  },
  trendNetSummary: {
    width: 72,
    alignItems: 'flex-end',
  },
  trendNetTitle: {
    fontSize: 9,
    color: colors.textMuted,
  },
  trendNetAmount: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  monthPickerBox: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  yearNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  yearNavBtn: {
    padding: 4,
  },
  yearDisplayVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  monthOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthOptionCell: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthOptionCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthOptionCellCurrent: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  monthOptionCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  monthOptionCellTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
});
