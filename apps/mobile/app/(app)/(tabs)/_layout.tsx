import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Tabs, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

import {
  useAccountsContext,
  useUserConfig,
  colors,
  componentSizes,
  getStashItem,
  STASH_KEYS,
} from '@salmon/shared';
import {
  GlassTabBar,
  WalletHeader,
  SettingsSheet,
  WalletSwitcherSheet,
  ScalesBackground,
} from '../../../src/components';

/**
 * Tab Layout for Salmon Wallet
 *
 * Renders shared chrome (header, background, gradient, sheets) once for all tabs.
 * Individual tab screens only render their own content.
 *
 * Shared chrome:
 * - WalletHeader (absolutely positioned, top)
 * - ScalesBackground (decorative pattern)
 * - Bottom fade gradient (smooth transition before tab bar)
 * - GlassTabBar (pill-shaped tab bar, bottom)
 * - SettingsSheet / WalletSwitcherSheet (modals)
 */
export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Shared UI state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  // Account context
  const [accountState, accountActions] = useAccountsContext();
  const {
    accounts,
    accountId,
    activeAccount,
    activeBlockchainAccount,
    networkId,
  } = accountState;

  // User configuration (developer networks toggle)
  const userConfigAccount = activeBlockchainAccount
    ? {
        network: {
          environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
          blockchain: 'solana',
        },
      }
    : {
        network: {
          environment: 'solana-mainnet' as const,
          blockchain: 'solana',
        },
      };
  const { developerNetworks, toggleDeveloperNetworks } = useUserConfig({
    activeBlockchainAccount: userConfigAccount,
  });

  // Derived values
  const accountName = activeAccount?.name || 'Account';
  const address = activeBlockchainAccount?.getReceiveAddress() || '';

  // -- Header handlers --

  const handleCopyAddress = useCallback(async () => {
    if (activeBlockchainAccount) {
      const addr = activeBlockchainAccount.getReceiveAddress();
      await Clipboard.setStringAsync(addr);
    }
  }, [activeBlockchainAccount]);

  const handleSettingsClose = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  const handleSettingsNavigate = useCallback((screen: string) => {
    setSettingsVisible(false);
    router.push(`/(app)/settings/${screen}` as Href);
  }, [router]);

  // -- Wallet Switcher handlers --

  const handleWalletSwitcherClose = useCallback(() => {
    setWalletSwitcherVisible(false);
  }, []);

  const handleSelectAccount = useCallback(async (id: string) => {
    await accountActions.changeAccount(id);
    setWalletSwitcherVisible(false);
  }, [accountActions]);

  const handleAddAccount = useCallback(() => {
    setWalletSwitcherVisible(false);
    router.push('/(auth)');
  }, [router]);

  const handleEditAccount = useCallback((id: string) => {
    setWalletSwitcherVisible(false);
    router.push({
      pathname: '/(app)/settings/account-edit',
      params: { id },
    } as unknown as Href);
  }, [router]);

  const handleDeleteAccount = useCallback(async (id: string) => {
    await accountActions.removeAccount(id);
  }, [accountActions]);

  // -- Settings: Remove wallet handlers --

  const handleRemoveAllWallets = useCallback(() => {
    Alert.alert(
      t('settings.remove_all_title'),
      t('settings.wallets.remove_all_wallets_description'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.remove_all'),
          style: 'destructive',
          onPress: async () => {
            try {
              await accountActions.removeAllAccounts();
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

  const handleRemoveWallet = useCallback(async () => {
    const { requiredLock, accounts } = accountState;
    const currentAccount = activeAccount;

    if (!currentAccount) return;

    if (accounts.length <= 1) {
      handleRemoveAllWallets();
      return;
    }

    Alert.alert(
      t('settings.remove_wallet_title'),
      t('settings.wallets.remove_wallet_description'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('settings.confirm_remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              let password: string | undefined;
              if (requiredLock) {
                password = await getStashItem<string>(STASH_KEYS.PASSWORD);
              }
              await accountActions.removeAccount(currentAccount.id, password);
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Layer 1: Solid background for status bar area and entire screen */}
      <View style={styles.solidBackground} />

      {/* Layer 2: Bottom fade gradient - rendered before scales so it's underneath */}
      <LinearGradient
        colors={['transparent', colors.background.primary]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />

      {/* Layer 3: Scales pattern background - starts below header */}
      <ScalesBackground topOffset={insets.top + componentSizes.headerHeight} />

      {/* Tab screens fill the remaining space */}
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="collectibles" options={{ title: 'Collectibles' }} />
        <Tabs.Screen name="swap" options={{ title: 'Swap' }} />
        <Tabs.Screen
          name="settings"
          options={{ href: null, title: 'Settings' }}
        />
      </Tabs>

      {/* Header - Absolutely positioned above content */}
      <WalletHeader
        accountName={accountName}
        address={address}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={() => setSettingsVisible(true)}
        onWalletPress={() => setWalletSwitcherVisible(true)}
        developerMode={developerNetworks}
      />

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
    backgroundColor: colors.background.primary,
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
  },
  bottomFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 180,
    bottom: 0,
  },
});
