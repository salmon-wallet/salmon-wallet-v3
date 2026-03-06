import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

import {
  useAccountsContext,
  useUserConfig,
  useAvailableNetworks,
  useCurrencyContext,
  useAddressbook,
  useOpenLink,
  buildNetworkListFromAccount,
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  SUPPORT_OPTIONS,
  LANGUAGE_NAMES,
  colors,
  componentSizes,
  getStashItem,
  STASH_KEYS,
  type SettingsPanelEntry,
  type AddressBookItem,
  type AddressInput,
  type CurrencyCode,
  type LanguageCode,
  type ExplorerSelectorItem,
  type NetworkSelectorItem,
  type TrustedAppItem,
  type LanguageSelectorItem,
  type CurrencySelectorItem,
  type NetworkAdapter,
  type BlockchainType,
} from '@salmon/shared';
import {
  GlassTabBar,
  WalletHeader,
  SettingsSheet,
  WalletSwitcherSheet,
  ScalesBackground,
  LanguageSelector,
  CurrencySelector,
  ExplorerSelector,
  NetworkSelector,
  TrustedAppsSelector,
  SupportSelector,
  AddressBookPanel,
  AddressAddPanel,
  AddressEditPanel,
  AccountAvatarPanel,
  AccountsPanel,
  AccountEditPanel,
  AccountNamePanel,
  AccountAddPanel,
  SecurityPanel,
  PrivateKeyPanel,
  BackupPanel,
  AboutPanel,
  type MobilePanelRegistry,
} from '../../../src/components';
import { useLanguage } from '../../../src/i18n';
import { useBiometricAuth } from '../../../hooks/useBiometricAuth';

/**
 * Tab Layout for Salmon Wallet
 *
 * Renders shared chrome (header, background, gradient, sheets) once for all tabs.
 * Individual tab screens only render their own content.
 */
export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openLink = useOpenLink();

  // Shared UI state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsInitialPanels, setSettingsInitialPanels] = useState<SettingsPanelEntry[] | undefined>(undefined);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<AddressBookItem | null>(null);

  // Account context
  const [accountState, accountActions] = useAccountsContext();
  const {
    accounts,
    accountId,
    activeAccount,
    activeBlockchainAccount,
    networkId,
    activeTrustedApps,
  } = accountState;

  // User configuration
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
  const { developerNetworks, toggleDeveloperNetworks, explorer, explorers, changeExplorer, isLoading: explorerLoading } = useUserConfig({
    activeBlockchainAccount: userConfigAccount,
  });

  // Language
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();

  // Currency
  const [{ currency }, { changeCurrency }] = useCurrencyContext();

  // Available networks
  const { allNetworks } = useAvailableNetworks({
    activeBlockchainAccount: userConfigAccount,
    developerNetworks,
  });

  // Address book
  const networkAdapter: NetworkAdapter = useMemo(() => ({
    getNetwork: async (id: string) => {
      const found = allNetworks.find((n) => n.id === id);
      if (!found) return undefined;
      return { id: found.id, name: found.name, blockchain: found.id.split('-')[0] as BlockchainType };
    },
    getNetworks: async () =>
      allNetworks.map((n) => ({ id: n.id, name: n.name, blockchain: n.id.split('-')[0] as BlockchainType })),
  }), [allNetworks]);
  const [{ contacts, isLoading: addressBookLoading }, { addContact, editContact: editAddressBookContact, removeContact }] = useAddressbook({ networkAdapter });

  // Biometric auth (for security and private key screens)
  const {
    state: biometricState,
    enableBiometric,
    setEnableBiometric,
    authenticateWithBiometric,
  } = useBiometricAuth();

  // Derived values
  const accountName = activeAccount?.name || 'Account';
  const address = activeBlockchainAccount?.getReceiveAddress() || '';

  // Address book items
  const addressBookItems: AddressBookItem[] = useMemo(
    () => contacts.map((c) => ({
      name: c.name, address: c.address,
      networkId: c.network.id, networkName: c.network.name,
      domain: c.domain,
    })),
    [contacts],
  );

  // -- Panel Registry for SettingsPanelStack --

  const panelRegistry: MobilePanelRegistry = useMemo(() => ({
    avatar: ({ onBack }) => {
      if (!activeAccount) return null;
      return (
        <AccountAvatarPanel
          currentAvatarUrl={activeAccount.avatar}
          account={activeAccount}
          onSave={async (avatarUrl: string) => {
            await accountActions.editAccount(activeAccount.id, { avatar: avatarUrl });
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    security: ({ onBack }) => (
      <SecurityPanel
        onBack={onBack}
        isBiometricAvailable={biometricState.isAvailable && biometricState.isEnrolled}
        isBiometricEnabled={enableBiometric}
        onToggleBiometric={async (enabled: boolean) => { await setEnableBiometric(enabled); }}
      />
    ),
    privateKey: ({ onBack }) => {
      if (!activeAccount) return null;
      const networks = buildNetworkListFromAccount(activeAccount);
      return (
        <PrivateKeyPanel
          networks={networks}
          activeAccount={activeAccount}
          onBack={onBack}
          biometricAvailable={biometricState.isAvailable && biometricState.hasStoredKey}
          authenticateWithBiometric={authenticateWithBiometric}
        />
      );
    },
    language: ({ onBack }) => {
      const languageItems: LanguageSelectorItem[] = availableLanguages.map(
        (item) => ({
          code: item.code,
          nativeName: LANGUAGE_NAMES[item.code as LanguageCode] || item.code,
        })
      );
      return (
        <LanguageSelector
          languages={languageItems}
          activeLanguageCode={currentLanguage}
          onSelectLanguage={async (code: string) => {
            await changeLanguage(code as LanguageCode);
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    currency: ({ onBack }) => {
      const currencyItems: CurrencySelectorItem[] = SUPPORTED_CURRENCIES.map(
        (code) => ({
          code,
          name: CURRENCY_MAP[code].name,
          symbol: CURRENCY_MAP[code].symbol,
        })
      );
      return (
        <CurrencySelector
          currencies={currencyItems}
          activeCurrencyCode={currency}
          onSelectCurrency={async (code: string) => {
            await changeCurrency(code as CurrencyCode);
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    explorer: ({ onBack }) => {
      const explorerItems: ExplorerSelectorItem[] = explorers.map((e) => ({
        key: e.key,
        name: e.name,
      }));
      return (
        <ExplorerSelector
          explorers={explorerItems}
          activeExplorerName={explorer?.name || ''}
          onSelectExplorer={async (key: string) => {
            await changeExplorer(key);
            onBack();
          }}
          onBack={onBack}
          loading={explorerLoading}
        />
      );
    },
    network: ({ onBack }) => {
      const userNetworks = activeAccount?.networksAccounts
        ? allNetworks.filter((n) => Object.keys(activeAccount.networksAccounts!).includes(n.id))
        : allNetworks;
      const networkItems: NetworkSelectorItem[] = userNetworks.map((n) => ({
        id: n.id, name: n.name, blockchain: n.id.split('-')[0],
      }));
      return (
        <NetworkSelector
          networks={networkItems}
          activeNetworkId={networkId || 'solana-mainnet'}
          onSelectNetwork={(id: string) => {
            accountActions.changeNetwork(id);
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    addressBook: ({ onBack, onNavigate }) => (
      <AddressBookPanel
        contacts={addressBookItems}
        activeNetworkId={networkId || 'solana-mainnet'}
        onAddContact={() => onNavigate('address-book-add')}
        onEditContact={(contact: AddressBookItem) => {
          setEditingContact(contact);
          onNavigate('address-book-edit');
        }}
        onRemoveContact={async (addr: string) => { await removeContact(addr); }}
        onBack={onBack}
        loading={addressBookLoading}
      />
    ),
    'address-book-add': ({ onBack }) => {
      const activeNet = allNetworks.find((n) => n.id === networkId) || allNetworks[0];
      const blockchain = (networkId || 'solana-mainnet').split('-')[0];
      return (
        <AddressAddPanel
          activeNetworkId={activeNet?.id || 'solana-mainnet'}
          activeNetworkName={activeNet?.name || 'Solana Mainnet'}
          activeBlockchain={blockchain}
          onSave={async (input: AddressInput) => {
            await addContact(input);
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    'address-book-edit': ({ onBack }) => {
      if (!editingContact) return null;
      const blockchain = (editingContact.networkId || 'solana-mainnet').split('-')[0];
      return (
        <AddressEditPanel
          contact={editingContact}
          activeBlockchain={blockchain}
          onSave={async (originalAddress: string, input: AddressInput) => {
            await editAddressBookContact(originalAddress, input);
            setEditingContact(null);
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    trustedApps: ({ onBack }) => {
      const trustedAppItems: TrustedAppItem[] = Object.entries(
        activeTrustedApps || {}
      ).map(([domain, app]) => ({
        domain,
        name: app.name,
        icon: app.icon,
      }));
      return (
        <TrustedAppsSelector
          apps={trustedAppItems}
          onRevokeApp={async (domain: string) => { await accountActions.removeTrustedApp(domain); }}
          onBack={onBack}
        />
      );
    },
    support: ({ onBack }) => (
      <SupportSelector
        options={SUPPORT_OPTIONS}
        onOpenLink={openLink}
        onBack={onBack}
      />
    ),
    accounts: ({ onBack, onNavigate }) => (
      <AccountsPanel
        accounts={accounts}
        activeAccountId={activeAccount?.id || ''}
        onSelectAccount={(id: string) => accountActions.changeAccount(id)}
        onEditAccount={(id: string) => {
          setEditingAccountId(id);
          onNavigate('account-edit', { accountId: id });
        }}
        onDeleteAccount={(id: string) => accountActions.removeAccount(id)}
        onAddAccount={() => onNavigate('account-add')}
        onBack={onBack}
      />
    ),
    'account-edit': ({ onBack, onNavigate, ...props }) => {
      const targetId = (props.accountId as string) || editingAccountId || accountId || '';
      const account = accounts.find((a) => a.id === targetId) || activeAccount;
      if (!account) return null;
      return (
        <AccountEditPanel
          account={account}
          onEditName={() => {
            setEditingAccountId(account.id);
            onNavigate('account-name', { accountId: account.id });
          }}
          onEditAvatar={() => onNavigate('avatar')}
          onBackupSeed={() => onNavigate('backup')}
          onExportPrivateKey={() => onNavigate('privateKey')}
          onBack={onBack}
        />
      );
    },
    'account-name': ({ onBack, ...props }) => {
      const targetId = (props.accountId as string) || editingAccountId || accountId || '';
      const account = accounts.find((a) => a.id === targetId) || activeAccount;
      if (!account) return null;
      return (
        <AccountNamePanel
          currentName={account.name}
          onSave={async (name: string) => {
            await accountActions.editAccount(account.id, { name });
            onBack();
          }}
          onBack={onBack}
        />
      );
    },
    'account-add': ({ onBack }) => (
      <AccountAddPanel onComplete={onBack} onBack={onBack} />
    ),
    backup: ({ onBack }) => (
      <BackupPanel onBack={onBack} />
    ),
    about: ({ onBack }) => (
      <AboutPanel onBack={onBack} />
    ),
  }), [
    activeAccount, accountActions, accounts, accountId, networkId, allNetworks,
    biometricState, enableBiometric, setEnableBiometric, authenticateWithBiometric,
    currentLanguage, availableLanguages, changeLanguage,
    currency, changeCurrency,
    explorers, explorer, changeExplorer, explorerLoading,
    addressBookItems, addressBookLoading, addContact, editAddressBookContact, removeContact,
    editingContact, editingAccountId, activeTrustedApps, openLink,
  ]);

  // -- Header handlers --

  const handleCopyAddress = useCallback(async () => {
    if (activeBlockchainAccount) {
      const addr = activeBlockchainAccount.getReceiveAddress();
      await Clipboard.setStringAsync(addr);
    }
  }, [activeBlockchainAccount]);

  const handleSettingsClose = useCallback(() => {
    setSettingsVisible(false);
    setSettingsInitialPanels(undefined);
  }, []);

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
    setEditingAccountId(null);
    setSettingsInitialPanels([{ screen: 'account-add' }]);
    setSettingsVisible(true);
  }, []);

  const handleEditAccount = useCallback((id: string) => {
    setWalletSwitcherVisible(false);
    setEditingAccountId(id);
    setSettingsInitialPanels([{ screen: 'accounts' }, { screen: 'account-edit', props: { accountId: id } }]);
    setSettingsVisible(true);
  }, []);

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
              Alert.alert(t('general.error'), t('settings.remove_wallets_error'));
            }
          },
        },
      ]
    );
  }, [accountActions, router, t]);

  const handleRemoveWallet = useCallback(async () => {
    const { requiredLock, accounts: accts } = accountState;
    const currentAccount = activeAccount;

    if (!currentAccount) return;

    if (accts.length <= 1) {
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
              Alert.alert(t('general.error'), t('settings.remove_wallet_error'));
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
        avatarUrl={activeAccount?.avatar}
        accountId={activeAccount?.id}
      />

      {/* Settings Sheet with integrated panel stack */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={handleSettingsClose}
        panelRegistry={panelRegistry}
        initialPanels={settingsInitialPanels}
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
