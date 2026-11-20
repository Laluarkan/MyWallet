import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { DebtsScreen } from './src/screens/DebtsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { WalletsScreen } from './src/screens/WalletsScreen';
import { ResetScreen } from './src/screens/ResetScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addInitialType, setAddInitialType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleOpenAdd = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER' = 'EXPENSE') => {
    setAddInitialType(type);
    setShowAddModal(true);
  };

  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            key={refreshKey}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenAddTransaction={handleOpenAdd}
          />
        );
      case 'transactions':
        return <TransactionsScreen key={refreshKey} />;
      case 'budgets':
        return <BudgetsScreen key={refreshKey} />;
      case 'debts':
        return <DebtsScreen key={refreshKey} onBack={() => setCurrentScreen('home')} />;
      case 'goals':
        return <GoalsScreen key={refreshKey} onBack={() => setCurrentScreen('home')} />;
      case 'reports':
        return <ReportsScreen key={refreshKey} />;
      case 'wallets':
        return (
          <WalletsScreen
            key={refreshKey}
            onBack={() => setCurrentScreen('home')}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'reset':
        return (
          <ResetScreen
            key={refreshKey}
            onBack={() => setCurrentScreen('home')}
            onResetSuccess={() => setRefreshKey((prev) => prev + 1)}
          />
        );
      case 'account':
        return (
          <AccountScreen
            key={refreshKey}
            onBack={() => setCurrentScreen('home')}
            onRefreshData={() => setRefreshKey((prev) => prev + 1)}
          />
        );
      default:
        return (
          <HomeScreen
            key={refreshKey}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenAddTransaction={handleOpenAdd}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Main Screen Content */}
      <View style={styles.mainContent}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentScreen('home')}
        >
          <Ionicons
            name={currentScreen === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentScreen === 'home' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === 'home' && styles.navTextActive,
            ]}
          >
            Beranda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentScreen('transactions')}
        >
          <Ionicons
            name={currentScreen === 'transactions' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={currentScreen === 'transactions' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === 'transactions' && styles.navTextActive,
            ]}
          >
            Transaksi
          </Text>
        </TouchableOpacity>

        {/* Center Floating Add Button */}
        <TouchableOpacity
          style={styles.centerAddBtn}
          onPress={() => handleOpenAdd('EXPENSE')}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentScreen('budgets')}
        >
          <Ionicons
            name={currentScreen === 'budgets' ? 'pie-chart' : 'pie-chart-outline'}
            size={22}
            color={currentScreen === 'budgets' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === 'budgets' && styles.navTextActive,
            ]}
          >
            Anggaran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentScreen('reports')}
        >
          <Ionicons
            name={currentScreen === 'reports' ? 'bar-chart' : 'bar-chart-outline'}
            size={22}
            color={currentScreen === 'reports' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === 'reports' && styles.navTextActive,
            ]}
          >
            Laporan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Modal Catat Transaksi */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <AddTransactionScreen
            initialType={addInitialType}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleTransactionSuccess}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    marginTop: 3,
    color: colors.textMuted,
    fontWeight: '600',
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  centerAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
