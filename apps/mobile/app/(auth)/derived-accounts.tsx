/**
 * DerivedAccountsScreen - Search and import derived accounts across all networks
 *
 * This screen derives accounts (indexes 1-N) for every network the active account
 * has using BIP-44 gap scanning (gap limit = 20). Index 1 of each network is
 * always shown; subsequent indexes are only shown if they have balance.
 * The user can select which ones to import into their wallet.
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

import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@salmon/assets';
import {
  colors,
  componentSizes,
  contentPadding,
  deriveBlockchainAccount,
  getShortAddress,
  SATOSHIS_PER_BTC,
  WEI_PER_ETH_BIGINT,
  SolanaAccount,
  BitcoinAccount,
  spacing,
  useAccountsContext,
  type BlockchainAccount,
} from '@salmon/shared';
import { ethereum } from '@salmon/shared';
import {
  DerivedAccountCard,
  DerivedAccountCardSkeleton,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from '../../src/components';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// Constants
// ============================================================================

/**
 * BIP-44 standard gap limit for address discovery.
 * Stop scanning a network after finding this many consecutive empty accounts.
 * See: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#address-gap-limit
 */
const GAP_LIMIT = 20;

/**
 * Only scan networks that produce unique keypairs.
 * Solana devnet and Ethereum sepolia share keypairs with their mainnets,
 * so we skip them during scanning and auto-mirror on import.
 */
const SCAN_NETWORKS = [
  'solana-mainnet',
  'bitcoin-mainnet',
  'bitcoin-testnet',
  'ethereum-mainnet',
];

/**
 * Networks that share keypairs with a mainnet.
 * When importing a mainnet account, also derive and import its mirror.
 */
const MIRROR_NETWORKS: Record<string, string> = {
  'solana-mainnet': 'solana-devnet',
  'ethereum-mainnet': 'ethereum-sepolia',
};

const NETWORK_DISPLAY: Record<string, { symbol: string; name: string; blockchain: string }> = {
  'solana-mainnet': { symbol: 'SOL', name: 'Solana', blockchain: 'solana' },
  'solana-devnet': { symbol: 'SOL', name: 'Solana Devnet', blockchain: 'solana' },
  'bitcoin-mainnet': { symbol: 'BTC', name: 'Bitcoin', blockchain: 'bitcoin' },
  'bitcoin-testnet': { symbol: 'BTC', name: 'Bitcoin Testnet', blockchain: 'bitcoin' },
  'ethereum-mainnet': { symbol: 'ETH', name: 'Ethereum', blockchain: 'ethereum' },
  'ethereum-sepolia': { symbol: 'ETH', name: 'Ethereum Sepolia', blockchain: 'ethereum' },
};

// ============================================================================
// Types
// ============================================================================

interface DerivedAccountInfo {
  account: BlockchainAccount;
  address: string;
  path: string;
  index: number;
  networkId: string;
  networkName: string;
  balance: number;
  balanceFormatted: string;
  currencySymbol: string;
  selected: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Fetches the balance for any blockchain account, returning a human-readable amount.
 * Returns 0 on failure.
 */
async function getAccountBalance(
  account: BlockchainAccount,
  networkId: string,
): Promise<number> {
  const info = NETWORK_DISPLAY[networkId];
  if (!info) return 0;

  try {
    if (info.blockchain === 'solana') {
      const balanceInfo = await (account as SolanaAccount).getBalance();
      return balanceInfo.sol;
    }
    if (info.blockchain === 'bitcoin') {
      const satoshis = await (account as BitcoinAccount).getCredit();
      return satoshis / SATOSHIS_PER_BTC;
    }
    if (info.blockchain === 'ethereum') {
      const wei = await (account as ethereum.EthereumAccount).getCredit();
      return Number(wei) / Number(WEI_PER_ETH_BIGINT);
    }
  } catch {
    // RPC error — return 0
  }

  return 0;
}

function formatBalance(balance: number, symbol: string): string {
  if (balance === 0) return `0 ${symbol}`;
  if (balance < 0.0001) return `<0.0001 ${symbol}`;
  return `${balance.toFixed(4)} ${symbol}`;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <DerivedAccountCardSkeleton />
      <DerivedAccountCardSkeleton />
      <DerivedAccountCardSkeleton />
    </View>
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

  // Get mnemonic from params or active account
  const mnemonic = params.mnemonic || activeAccount?.mnemonic;

  /**
   * Search for derived accounts across scan networks only.
   * Skips devnet/sepolia since they share keypairs with mainnets.
   */
  useEffect(() => {
    const searchDerivedAccounts = async () => {
      if (!mnemonic || !activeAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Only scan networks that produce unique keypairs
      const networkIds = Object.keys(activeAccount.networksAccounts)
        .filter((id) => SCAN_NETWORKS.includes(id));

      // BIP-44 gap scanning: sequential per network, parallel across networks.
      // Scans until GAP_LIMIT consecutive empty accounts are found.
      // Index 1 is always included; indexes 2+ only if they have balance.
      const allResults = await Promise.all(
        networkIds.map(async (networkId) => {
          const networkAccounts: DerivedAccountInfo[] = [];
          const info = NETWORK_DISPLAY[networkId] ?? {
            symbol: '?',
            name: networkId,
            blockchain: 'unknown',
          };
          let consecutiveEmpty = 0;
          let index = 1;

          while (consecutiveEmpty < GAP_LIMIT) {
            // Yield to UI thread
            await new Promise((resolve) => setTimeout(resolve, 1));

            try {
              const account = await deriveBlockchainAccount(mnemonic, networkId, index);
              const address = account.getReceiveAddress();
              const balance = await getAccountBalance(account, networkId);

              const isFirstIndex = index === 1;
              const hasFunds = balance > 0;

              if (hasFunds) {
                consecutiveEmpty = 0;
              } else {
                consecutiveEmpty++;
              }

              // Always show index 1; for the rest, only show if funded
              if (isFirstIndex || hasFunds) {
                networkAccounts.push({
                  account,
                  address,
                  path: account.path,
                  index,
                  networkId,
                  networkName: info.name,
                  balance,
                  balanceFormatted: formatBalance(balance, info.symbol),
                  currencySymbol: info.symbol,
                  selected: hasFunds || isFirstIndex,
                });
              }
            } catch (error) {
              console.warn(`Error deriving ${networkId} index ${index}:`, error);
              consecutiveEmpty++;
            }

            index++;
          }

          return networkAccounts;
        }),
      );

      setAccounts(allResults.flat());
      setLoading(false);
    };

    searchDerivedAccounts();
  }, [mnemonic, activeAccount]);

  /**
   * Toggle account selection by composite key (networkId-index)
   */
  const handleToggleAccount = useCallback((key: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        `${acc.networkId}-${acc.index}` === key ? { ...acc, selected: !acc.selected } : acc,
      ),
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
   * Handle import selected accounts.
   * Also creates mirror accounts (devnet/sepolia) for mainnet selections.
   */
  const handleImport = useCallback(async () => {
    if (!activeAccount || !mnemonic) return;

    const selectedAccounts = accounts.filter((acc) => acc.selected);
    if (selectedAccounts.length === 0) {
      handleSkip();
      return;
    }

    setImporting(true);

    try {
      const newDerivedAccounts: BlockchainAccount[] = [];

      for (const acc of selectedAccounts) {
        newDerivedAccounts.push(acc.account);

        // Auto-create mirror account for devnet/sepolia
        const mirrorNetworkId = MIRROR_NETWORKS[acc.networkId];
        if (mirrorNetworkId && activeAccount.networksAccounts[mirrorNetworkId]) {
          try {
            const mirrorAccount = await deriveBlockchainAccount(
              mnemonic,
              mirrorNetworkId,
              acc.index,
            );
            newDerivedAccounts.push(mirrorAccount);
          } catch {
            // Mirror derivation failed — skip silently
          }
        }
      }

      await actions.editAccount(activeAccount.id, {
        newDerivedAccounts,
      });

      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('Failed to import derived accounts:', error);
      router.replace('/(app)/(tabs)');
    } finally {
      setImporting(false);
    }
  }, [accounts, activeAccount, actions, handleSkip, mnemonic]);

  /**
   * Get selected count
   */
  const selectedCount = accounts.filter((acc) => acc.selected).length;

  /**
   * Render content based on state
   */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Searching for accounts...</Text>
          <LoadingSkeleton />
        </View>
      );
    }

    if (accounts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={colors.text.placeholder} />
          <Text style={styles.emptyTitle}>No Derived Accounts Found</Text>
          <Text style={styles.emptySubtitle}>
            Could not derive additional accounts from your seed phrase.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.accountsContainer}>
        <Text style={styles.foundText}>
          Found {accounts.length} derived account{accounts.length !== 1 ? 's' : ''}
        </Text>
        <ScrollView
          style={styles.accountsList}
          contentContainerStyle={styles.accountsListContent}
          showsVerticalScrollIndicator={false}
        >
          {accounts.map((acc) => {
            const key = `${acc.networkId}-${acc.index}`;
            return (
              <DerivedAccountCard
                key={key}
                address={getShortAddress(acc.address, 6) ?? acc.address}
                networkName={acc.networkName}
                path={acc.path}
                balanceFormatted={acc.balanceFormatted}
                selected={acc.selected}
                dimmed={acc.balance === 0}
                blockchain={NETWORK_DISPLAY[acc.networkId]?.blockchain as 'solana' | 'bitcoin' | 'ethereum'}
                onToggle={() => handleToggleAccount(key)}
                testID={`derived-account-${key}`}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
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
            Search for additional accounts derived from your seed phrase.
          </Text>

          {/* Dynamic Content */}
          {renderContent()}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {accounts.length > 0 && (
              <PrimaryButton
                onPress={handleImport}
                disabled={loading || importing}
                loading={importing}
              >
                {`IMPORT SELECTED (${selectedCount})`}
              </PrimaryButton>
            )}

            <SecondaryButton
              onPress={handleSkip}
              disabled={importing}
            >
              {accounts.length === 0 ? 'CONTINUE' : 'SKIP'}
            </SecondaryButton>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
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

  // Skeleton
  skeletonContainer: {
    width: '100%',
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
});
