/**
 * DerivedAccountsScreen - Search and import derived accounts with balance
 *
 * This screen searches for derived accounts (indexes 1-9) that have a balance > 0.
 * It allows users to select which accounts to import into their wallet.
 *
 * Design: Dark gradient background with loading skeleton during search,
 * list of accounts with checkboxes, import and skip buttons.
 *
 * Navigation:
 * - Comes from: password screen or success screen
 * - Goes to: main app (tabs)
 *
 * Params:
 * - mnemonic: The seed phrase to derive accounts from
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@salmon/assets';
import {
  colors,
  spacing,
  componentSizes,
  contentPadding,
  borderRadius,
  useAccountsContext,
  createSolanaAccount,
  SOLANA_NETWORKS,
  getShortAddress,
  type SolanaAccount,
} from '@salmon/shared';
import {
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
} from '@salmon/ui';

// ============================================================================
// Types
// ============================================================================

interface DerivedAccountInfo {
  account: SolanaAccount;
  address: string;
  path: string;
  index: number;
  balance: number;
  balanceSol: number;
  selected: boolean;
}

// ============================================================================
// Skeleton Component
// ============================================================================

function AccountSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonCheckbox} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonAddress} />
        <View style={styles.skeletonPath} />
      </View>
      <View style={styles.skeletonBalance} />
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <AccountSkeleton />
      <AccountSkeleton />
      <AccountSkeleton />
    </View>
  );
}

// ============================================================================
// Account Card Component
// ============================================================================

interface AccountCardProps {
  accountInfo: DerivedAccountInfo;
  onToggle: (index: number) => void;
}

function AccountCard({ accountInfo, onToggle }: AccountCardProps) {
  const { address, path, balanceSol, index, selected } = accountInfo;
  const shortAddress = getShortAddress(address, 6) ?? address;

  return (
    <TouchableOpacity
      style={[styles.accountCard, selected && styles.accountCardSelected]}
      onPress={() => onToggle(index)}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={16} color={colors.text.primary} />}
      </View>

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <Text style={styles.accountAddress}>{shortAddress}</Text>
        <Text style={styles.accountPath}>{path}</Text>
      </View>

      {/* Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceValue}>{balanceSol.toFixed(4)}</Text>
        <Text style={styles.balanceCurrency}>SOL</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function DerivedAccountsScreen() {
  const params = useLocalSearchParams<{ mnemonic: string }>();
  const [{ activeAccount }, actions] = useAccountsContext();

  // State
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<DerivedAccountInfo[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);

  // Get mnemonic from params or active account
  const mnemonic = params.mnemonic || activeAccount?.mnemonic;

  /**
   * Search for derived accounts with balance
   */
  useEffect(() => {
    const searchDerivedAccounts = async () => {
      if (!mnemonic) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearchProgress(0);

      const foundAccounts: DerivedAccountInfo[] = [];
      const network = SOLANA_NETWORKS['mainnet-beta'];

      // Search indexes 1-9 (index 0 is the main account)
      for (let i = 1; i <= 9; i++) {
        try {
          setSearchProgress(i);

          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 100));

          // Create derived account
          const account = await createSolanaAccount({
            network,
            mnemonic,
            index: i,
          });

          const address = account.getReceiveAddress();

          // Check balance using account's built-in method
          const balanceInfo = await account.getBalance();

          if (balanceInfo.sol > 0) {
            foundAccounts.push({
              account,
              address,
              path: account.path,
              index: i,
              balance: Number(balanceInfo.lamports),
              balanceSol: balanceInfo.sol,
              selected: true, // Selected by default
            });
          }

          // Disconnect the account if it won't be used to free resources
          if (balanceInfo.sol <= 0) {
            await account.disconnect();
          }
        } catch (error) {
          console.warn(`Error checking account index ${i}:`, error);
          // Continue searching other indexes
        }
      }

      setAccounts(foundAccounts);
      setLoading(false);
    };

    searchDerivedAccounts();
  }, [mnemonic]);

  /**
   * Toggle account selection
   */
  const handleToggleAccount = useCallback((index: number) => {
    setAccounts(prev =>
      prev.map(acc =>
        acc.index === index ? { ...acc, selected: !acc.selected } : acc
      )
    );
  }, []);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  /**
   * Handle skip - go directly to main app
   */
  const handleSkip = useCallback(() => {
    router.replace('/(app)/(tabs)');
  }, []);

  /**
   * Handle import selected accounts
   */
  const handleImport = useCallback(async () => {
    if (!activeAccount) return;

    const selectedAccounts = accounts.filter(acc => acc.selected);
    if (selectedAccounts.length === 0) {
      // Nothing selected, just skip
      handleSkip();
      return;
    }

    setImporting(true);

    try {
      // Get the derived SolanaAccount instances
      const newDerivedAccounts = selectedAccounts.map(acc => acc.account);

      // Add derived accounts to the active account
      await actions.editAccount(activeAccount.id, {
        newDerivedAccounts,
      });

      // Navigate to main app
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Failed to import derived accounts:', error);
      // Still navigate even on error
      router.replace('/(app)/(tabs)');
    } finally {
      setImporting(false);
    }
  }, [accounts, activeAccount, actions, handleSkip]);

  /**
   * Get selected count
   */
  const selectedCount = accounts.filter(acc => acc.selected).length;

  /**
   * Render content based on state
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>
            Searching for accounts... ({searchProgress}/9)
          </Text>
          <LoadingSkeleton />
        </View>
      );
    }

    if (accounts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={colors.text.placeholder} />
          <Text style={styles.emptyTitle}>No Additional Accounts Found</Text>
          <Text style={styles.emptySubtitle}>
            We searched indexes 1-9 but found no accounts with balance.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.accountsContainer}>
        <Text style={styles.foundText}>
          Found {accounts.length} account{accounts.length !== 1 ? 's' : ''} with balance
        </Text>
        <ScrollView
          style={styles.accountsList}
          contentContainerStyle={styles.accountsListContent}
          showsVerticalScrollIndicator={false}
        >
          {accounts.map(acc => (
            <AccountCard
              key={acc.index}
              accountInfo={acc}
              onToggle={handleToggleAccount}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <ScreenHeader
          onBack={handleBack}
          backDisabled={loading || importing}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Derived Accounts</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Search for additional accounts with balance derived from your seed phrase.
          </Text>

          {/* Dynamic Content */}
          {renderContent()}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Import Button - Only show if accounts found */}
            {accounts.length > 0 && (
              <PrimaryButton
                onPress={handleImport}
                disabled={loading || importing}
                loading={importing}
              >
                {selectedCount > 0
                  ? `IMPORT SELECTED (${selectedCount})`
                  : 'SKIP'}
              </PrimaryButton>
            )}

            {/* Skip Button */}
            <SecondaryButton
              onPress={handleSkip}
              disabled={importing}
            >
              {accounts.length === 0 ? 'CONTINUE' : 'SKIP'}
            </SecondaryButton>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: contentPadding.screen,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: componentSizes.logoSizeSmall,
    height: componentSizes.logoSizeSmall,
  },
  title: {
    color: colors.text.primary,
    fontFamily: 'DMSansBold',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  loadingText: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['5xl'],
  },
  emptyTitle: {
    color: colors.text.primary,
    fontFamily: 'DMSansRegular',
    fontSize: 16,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },

  // Accounts list
  accountsContainer: {
    flex: 1,
    width: '100%',
  },
  foundText: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  accountsList: {
    flex: 1,
    width: '100%',
  },
  accountsListContent: {
    paddingBottom: spacing.lg,
  },

  // Account card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.card.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  accountCardSelected: {
    borderColor: colors.card.borderActive,
  },
  checkbox: {
    width: componentSizes.checkboxSize,
    height: componentSizes.checkboxSize,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary,
  },
  accountInfo: {
    flex: 1,
  },
  accountAddress: {
    color: colors.text.primary,
    fontFamily: 'DMSansRegular',
    fontSize: 16,
  },
  accountPath: {
    color: colors.text.placeholder,
    fontFamily: 'DMSansMedium',
    fontSize: 12,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    color: colors.text.primary,
    fontFamily: 'DMSansRegular',
    fontSize: 16,
  },
  balanceCurrency: {
    color: colors.text.placeholder,
    fontFamily: 'DMSansMedium',
    fontSize: 12,
    marginTop: 2,
  },

  // Skeleton
  skeletonContainer: {
    width: '100%',
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonCheckbox: {
    width: componentSizes.checkboxSize,
    height: componentSizes.checkboxSize,
    borderRadius: 6,
    backgroundColor: colors.skeleton.highlight,
    marginRight: spacing.lg,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonAddress: {
    width: '60%',
    height: 18,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.skeleton.highlight,
  },
  skeletonPath: {
    width: '40%',
    height: 14,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.skeleton.highlight,
    marginTop: 6,
  },
  skeletonBalance: {
    width: 60,
    height: 18,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.skeleton.highlight,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
});
