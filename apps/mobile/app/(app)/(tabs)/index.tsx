/**
 * HomeScreen - Main wallet overview screen
 *
 * Displays:
 * - WalletHeader: Account name, address, settings navigation
 * - BalanceCard: Total USD balance with 24h change
 * - ActionButtonRow: Send, Receive, Activity buttons
 * - TokenList: List of token holdings
 *
 * Features:
 * - Pull-to-refresh for balance updates
 * - Balance visibility toggle (privacy mode)
 * - Navigation to token detail, send, receive, and activity screens
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

import {
  useAccounts,
  useBalance,
  useUserConfig,
  SOLANA_NETWORKS,
  getStashedPassword,
} from '@salmon/shared';
import {
  WalletHeader,
  BalanceCard,
  ActionButtonRow,
  TokenList,
  type Token,
} from '@salmon/ui';
import { SettingsSheet } from '../../../components/SettingsSheet';
import { WalletSwitcherSheet } from '../../../components/WalletSwitcherSheet';

/**
 * Convert TokenBalanceWithPrice to Token for TokenList
 */
function mapBalanceToToken(
  item: {
    address: string;
    symbol: string;
    name: string;
    logo: string | null;
    uiAmount: number;
    usdBalance?: number;
    priceChange24h?: number;
  }
): Token {
  return {
    address: item.address,
    symbol: item.symbol,
    name: item.name,
    logo: item.logo || undefined,
    uiAmount: item.uiAmount,
    usdBalance: item.usdBalance || null,
    last24HoursChange: item.priceChange24h !== undefined
      ? { perc: item.priceChange24h }
      : null,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Settings sheet visibility
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Wallet switcher sheet visibility
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  // Get account state and actions
  const [accountState, accountActions] = useAccounts();
  const {
    ready,
    accounts,
    accountId,
    activeAccount,
    activeBlockchainAccount,
    networkId,
  } = accountState;

  // User configuration (developer networks toggle)
  // Build a mock activeBlockchainAccount for useUserConfig when not available
  const userConfigAccount = activeBlockchainAccount
    ? {
        network: {
          environment: (networkId || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet',
          blockchain: 'solana',
        },
      }
    : {
        network: {
          environment: 'mainnet-beta' as const,
          blockchain: 'solana',
        },
      };
  const { developerNetworks, toggleDeveloperNetworks } = useUserConfig({
    activeBlockchainAccount: userConfigAccount,
  });

  // Get balance data
  const {
    tokens,
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    refreshing,
    refresh,
    hiddenBalance,
    toggleHidden,
  } = useBalance({
    account: activeBlockchainAccount,
    networkId: networkId as 'mainnet-beta' | 'devnet' | undefined,
    skip: !ready || !activeBlockchainAccount,
  });

  // Get network info
  const network = useMemo(() => {
    const netId = networkId || 'mainnet-beta';
    const networkConfig = SOLANA_NETWORKS[netId];
    return {
      id: netId,
      name: networkConfig?.name || 'Solana',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    };
  }, [networkId]);

  // Map balance tokens to TokenList format
  const tokenListItems = useMemo(() => {
    return tokens.map(mapBalanceToToken);
  }, [tokens]);

  // Handlers
  const handleCopyAddress = useCallback(async () => {
    if (activeBlockchainAccount) {
      const address = activeBlockchainAccount.getReceiveAddress();
      await Clipboard.setStringAsync(address);
      // TODO: Show toast notification
    }
  }, [activeBlockchainAccount]);

  const handleSettingsPress = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const handleSendPress = useCallback(() => {
    router.push('/(app)/token-send');
  }, [router]);

  const handleReceivePress = useCallback(() => {
    router.push('/(app)/token-receive');
  }, [router]);

  const handleActivityPress = useCallback(() => {
    router.push('/(app)/transactions');
  }, [router]);

  const handleTokenPress = useCallback((token: Token) => {
    router.push({
      pathname: '/(app)/token-detail',
      params: { address: token.address },
    });
  }, [router]);

  const handleNetworkPress = useCallback(() => {
    // TODO: Open network selector modal
    console.log('Network selector pressed');
  }, []);

  const handleSettingsNavigate = useCallback((screen: string) => {
    setSettingsVisible(false);
    // Navigate to specific settings screen if needed
    router.push(`/(app)/settings/${screen}` as any);
  }, [router]);

  const handleSettingsClose = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  // Wallet Switcher handlers
  const handleWalletPress = useCallback(() => {
    setWalletSwitcherVisible(true);
  }, []);

  const handleWalletSwitcherClose = useCallback(() => {
    setWalletSwitcherVisible(false);
  }, []);

  const handleSelectAccount = useCallback(async (id: string) => {
    await accountActions.changeAccount(id);
    setWalletSwitcherVisible(false);
  }, [accountActions]);

  const handleAddAccount = useCallback(() => {
    setWalletSwitcherVisible(false);
    // Navigate to auth flow to add a new account
    router.push('/(auth)');
  }, [router]);

  const handleEditAccount = useCallback((id: string) => {
    setWalletSwitcherVisible(false);
    // Navigate to account edit screen
    router.push({
      pathname: '/(app)/settings/account-edit',
      params: { id },
    } as any);
  }, [router]);

  const handleDeleteAccount = useCallback(async (id: string) => {
    // The WalletSwitcherSheet already shows a confirmation dialog
    // and handles closing itself, so we just need to call removeAccount
    await accountActions.removeAccount(id);
  }, [accountActions]);

  /**
   * Handle remove all wallets action from SettingsSheet
   * Shows confirmation dialog before removing all accounts
   */
  const handleRemoveAllWallets = useCallback(() => {
    Alert.alert(
      t('settings.remove_all_title'),
      t('settings.wallets.remove_all_wallets_description'),
      [
        {
          text: t('actions.cancel'),
          style: 'cancel',
        },
        {
          text: t('actions.remove_all'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove all accounts
              await accountActions.removeAllAccounts();

              // Navigate to onboarding/auth flow
              router.replace('/(auth)');
            } catch (error) {
              console.error('Failed to remove all wallets:', error);
              Alert.alert(
                t('general.error'),
                'Failed to remove wallets. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [accountActions, router, t]);

  /**
   * Handle remove current wallet action from SettingsSheet
   * Shows confirmation dialog and verifies password if required
   */
  const handleRemoveWallet = useCallback(async () => {
    const { requiredLock, accounts } = accountState;
    const currentAccount = activeAccount;

    if (!currentAccount) return;

    // Check if this is the last account
    if (accounts.length <= 1) {
      // If it's the last account, redirect to remove all wallets flow
      handleRemoveAllWallets();
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      t('settings.remove_wallet_title'),
      t('settings.wallets.remove_wallet_description'),
      [
        {
          text: t('actions.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.confirm_remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              // If password is required, get it from stash
              let password: string | undefined;
              if (requiredLock) {
                password = await getStashedPassword();
              }

              // Remove the account
              await accountActions.removeAccount(currentAccount.id, password);

              // Account actions will automatically switch to another account
              // No need to navigate, the UI will update
            } catch (error) {
              console.error('Failed to remove wallet:', error);
              Alert.alert(
                t('general.error'),
                'Failed to remove wallet. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [accountState, activeAccount, accountActions, handleRemoveAllWallets, t]);

  // Loading state - wait for hook to be ready
  // Note: If we're on this screen, the LockScreenOverlay has been dismissed,
  // which means unlock succeeded and accounts should be loaded
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  // No account state (only show if accounts array is empty)
  if (!activeAccount || !activeBlockchainAccount) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>No account found</Text>
      </View>
    );
  }

  const accountName = activeAccount.name || 'Account';
  const address = activeBlockchainAccount.getReceiveAddress();
  const hasTokens = tokenListItems.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <WalletHeader
        accountName={accountName}
        address={address}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={handleSettingsPress}
        onWalletPress={handleWalletPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#ff5c45"
            colors={['#ff5c45']}
          />
        }
      >
        {/* Balance Card */}
        <BalanceCard
          network={network}
          usdTotal={usdTotal}
          changePercent={changePercent}
          changeAmount={changeAmount}
          hiddenBalance={hiddenBalance}
          onToggleVisibility={toggleHidden}
          onNetworkPress={handleNetworkPress}
          loading={loading && !refreshing}
          style={styles.balanceCard}
        />

        {/* Action Buttons */}
        <ActionButtonRow
          onSendPress={handleSendPress}
          onReceivePress={handleReceivePress}
          onActivityPress={handleActivityPress}
          style={styles.actionRow}
        />

        {/* Token List */}
        <View style={styles.tokenListContainer}>
          <Text style={styles.sectionTitle}>Assets</Text>
          {hasTokens ? (
            <TokenList
              tokens={tokenListItems}
              loading={loading && tokenListItems.length === 0}
              onTokenPress={handleTokenPress}
              hiddenBalance={hiddenBalance}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {loading ? 'Loading tokens...' : 'No tokens found'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Your tokens will appear here once you receive some
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Settings Sheet */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={handleSettingsClose}
        onNavigate={handleSettingsNavigate}
        developerNetworksEnabled={developerNetworks}
        onDeveloperNetworksToggle={toggleDeveloperNetworks}
        onRemoveWallet={handleRemoveWallet}
        onRemoveAllWallets={handleRemoveAllWallets}
      />

      {/* Wallet Switcher Sheet */}
      <WalletSwitcherSheet
        visible={walletSwitcherVisible}
        onClose={handleWalletSwitcherClose}
        accounts={accounts}
        activeAccountId={accountId ?? ''}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  balanceCard: {
    marginTop: 16,
  },
  actionRow: {
    marginTop: 8,
  },
  tokenListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});
