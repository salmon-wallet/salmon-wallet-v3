import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  useAccounts,
  useBalance,
  useUserConfig,
  colors,
  spacing,
  type SettingsScreen,
} from '@salmon/shared';
import {
  WalletHeader,
  BalanceCard,
  ActionButtonRow,
  TokenList,
  LockIcon,
  SettingsSheet,
  WalletSwitcherSheet,
} from '@salmon/ui-extension';
import IconButton from '@mui/material/IconButton';
import { EditAccountDialog } from '../../components/EditAccountDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// Settings pages for navigation
import { BackupPage } from '../settings/BackupPage';
import { CurrencyPage } from '../settings/CurrencyPage';
import { AboutPage } from '../settings/AboutPage';

/**
 * Available page views within HomePage
 */
type PageView =
  | 'home'
  | 'backup'
  | 'currency'
  | 'about'
  | 'language'
  | 'network'
  | 'explorer'
  | 'addressBook'
  | 'trustedApps'
  | 'security';

/**
 * Styled components for HomePage layout
 */
const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
});

const HeaderRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.md}px ${spacing.lg}px`,
});

const LockButton = styled(IconButton)({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const Main = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
});

const TokenSection = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: `0 ${spacing.lg}px ${spacing.lg}px`,
});

const SectionTitle = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: spacing.md,
  marginTop: spacing.lg,
});

const EmptyState = styled(Box)({
  padding: `${spacing.xl}px ${spacing.lg}px`,
  textAlign: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
});

const EmptyStateText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
  marginBottom: spacing.sm,
});

const EmptyStateSubtext = styled(Typography)({
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.4)',
});

/**
 * Placeholder page for settings screens not yet fully implemented
 */
function PlaceholderPage({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: `${spacing.md}px ${spacing.lg}px`,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{ color: colors.text.secondary, mr: 1 }}
        >
          <Box component="span" sx={{ fontSize: 20 }}>
            &#8592;
          </Box>
        </IconButton>
        <Typography
          sx={{ fontSize: 18, fontWeight: 600, color: colors.text.primary }}
        >
          {title}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <Typography sx={{ color: colors.text.secondary }}>
          {t('common.coming_soon', 'Coming soon...')}
        </Typography>
      </Box>
    </Container>
  );
}

/**
 * Home page component displayed when wallet is unlocked.
 * Shows account info and provides access to main wallet features.
 */
export function HomePage() {
  const { t } = useTranslation();
  const [state, actions] = useAccounts();
  const { ready, activeAccount, activeBlockchainAccount, networkId, accounts, accountId } = state;

  // User configuration (developer networks toggle)
  // Note: useUserConfig requires activeBlockchainAccount parameter with specific structure
  const userConfig = useUserConfig({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet',
        blockchain: 'solana',
      },
    },
  });
  const { developerNetworks, toggleDeveloperNetworks } = userConfig;

  // Current page view state for navigation
  const [currentPage, setCurrentPage] = useState<PageView>('home');

  // Sheet visibility state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  // Edit account dialog state
  const [editAccountDialogVisible, setEditAccountDialogVisible] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState('');

  // Remove wallet dialog state
  const [removeWalletDialogVisible, setRemoveWalletDialogVisible] = useState(false);
  const [removeAllWalletsDialogVisible, setRemoveAllWalletsDialogVisible] = useState(false);

  // Fetch balance data for any blockchain account type (Solana, Bitcoin, Ethereum)
  const {
    tokens,
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    hiddenBalance,
    toggleHidden,
  } = useBalance({
    account: activeBlockchainAccount,
    networkId: networkId as 'mainnet-beta' | 'devnet' | undefined,
    skip: !ready || !activeBlockchainAccount,
  });

  // Navigation handlers
  const handleBack = useCallback(() => {
    setCurrentPage('home');
  }, []);

  // Event handlers
  const handleLock = useCallback(async () => {
    await actions.lockAccounts();
  }, [actions]);

  const handleCopyAddress = useCallback(() => {
    const address = activeBlockchainAccount?.getReceiveAddress();
    if (address) {
      navigator.clipboard.writeText(address);
    }
  }, [activeBlockchainAccount]);

  const handleSettingsPress = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const handleWalletPress = useCallback(() => {
    setWalletSwitcherVisible(true);
  }, []);

  /**
   * Handle navigation from SettingsSheet to specific settings pages
   */
  const handleSettingsNavigate = useCallback((screen: SettingsScreen) => {
    setSettingsVisible(false);

    // Map SettingsScreen to PageView
    // Note: 'removeWallet' and 'removeAll' are handled separately via callbacks
    const pageMap: Partial<Record<SettingsScreen, PageView>> = {
      security: 'security',
      backup: 'backup',
      network: 'network',
      language: 'language',
      currency: 'currency',
      explorer: 'explorer',
      addressBook: 'addressBook',
      trustedApps: 'trustedApps',
      about: 'about',
    };

    const targetPage = pageMap[screen];
    if (targetPage) {
      setCurrentPage(targetPage);
    }
  }, []);

  /**
   * Handle remove current wallet action
   */
  const handleRemoveWallet = useCallback(() => {
    setSettingsVisible(false);
    setRemoveWalletDialogVisible(true);
  }, []);

  /**
   * Handle remove all wallets action
   */
  const handleRemoveAllWallets = useCallback(() => {
    setSettingsVisible(false);
    setRemoveAllWalletsDialogVisible(true);
  }, []);

  /**
   * Confirm removal of current wallet
   */
  const confirmRemoveWallet = useCallback(async () => {
    if (activeAccount?.id) {
      await actions.removeAccount(activeAccount.id);
    }
  }, [actions, activeAccount]);

  /**
   * Confirm removal of all wallets
   */
  const confirmRemoveAllWallets = useCallback(async () => {
    await actions.removeAllAccounts();
  }, [actions]);

  /**
   * Validate password for secure actions
   */
  const validatePassword = useCallback(
    async (password: string): Promise<boolean> => {
      return actions.checkPassword(password);
    },
    [actions]
  );

  const handleSelectAccount = useCallback((targetAccountId: string) => {
    actions.changeAccount(targetAccountId);
    setWalletSwitcherVisible(false);
  }, [actions]);

  const handleAddAccount = useCallback(() => {
    setWalletSwitcherVisible(false);
    // TODO: Navigate to add account flow (onboarding)
    // For now, this would typically open the onboarding flow
    // e.g., navigate to /onboarding or open a create account modal
    console.log('Add account - navigate to onboarding flow');
  }, []);

  const handleEditAccount = useCallback((targetAccountId: string) => {
    const account = accounts.find(acc => acc.id === targetAccountId);
    if (account) {
      setEditingAccountId(targetAccountId);
      setEditingAccountName(account.name);
      setEditAccountDialogVisible(true);
    }
  }, [accounts]);

  const handleSaveAccountName = useCallback(async (targetAccountId: string, newName: string) => {
    await actions.editAccount(targetAccountId, { name: newName });
  }, [actions]);

  const handleDeleteAccount = useCallback(async (targetAccountId: string) => {
    // The WalletSwitcherSheet already shows a confirmation dialog
    // and only calls this after user confirms, so we can directly remove
    await actions.removeAccount(targetAccountId);

    // If we deleted the active account, the hook will auto-switch
    // Close the wallet switcher sheet
    setWalletSwitcherVisible(false);
  }, [actions]);

  const handleSendPress = useCallback(() => {
    // TODO: Navigate to send
  }, []);

  const handleReceivePress = useCallback(() => {
    // TODO: Navigate to receive
  }, []);

  const handleActivityPress = useCallback(() => {
    // TODO: Navigate to activity
  }, []);

  const handleTokenPress = useCallback((token: { address: string }) => {
    // TODO: Navigate to token detail
    console.log('Token pressed:', token.address);
  }, []);

  // Prepare network info for BalanceCard
  const networkInfo = useMemo(() => ({
    id: networkId || 'mainnet-beta',
    name: networkId === 'devnet' ? 'Devnet' : 'Solana Mainnet',
  }), [networkId]);

  // Transform tokens to match TokenList expected format
  const formattedTokens = useMemo(() => {
    return tokens.map((token) => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      logo: token.logo ?? undefined,
      price: token.price,
      uiAmount: token.uiAmount,
      usdBalance: token.usdBalance,
      last24HoursChange: token.priceChange24h !== undefined
        ? { perc: token.priceChange24h }
        : undefined,
    }));
  }, [tokens]);

  const accountName = activeAccount?.name || t('home.unnamed_account', 'Account');
  const accountAddress = activeBlockchainAccount?.getReceiveAddress() || '';

  // Render settings pages based on current page view
  if (currentPage !== 'home') {
    switch (currentPage) {
      case 'backup':
        return <BackupPage onBack={handleBack} />;
      case 'currency':
        return <CurrencyPage onBack={handleBack} />;
      case 'about':
        return <AboutPage onBack={handleBack} />;
      case 'language':
        return (
          <PlaceholderPage
            title={t('settings.display_language', 'Language')}
            onBack={handleBack}
          />
        );
      case 'network':
        return (
          <PlaceholderPage
            title={t('settings.change_network', 'Network')}
            onBack={handleBack}
          />
        );
      case 'explorer':
        return (
          <PlaceholderPage
            title={t('settings.explorer', 'Explorer')}
            onBack={handleBack}
          />
        );
      case 'addressBook':
        return (
          <PlaceholderPage
            title={t('settings.address_book', 'Address Book')}
            onBack={handleBack}
          />
        );
      case 'trustedApps':
        return (
          <PlaceholderPage
            title={t('settings.trusted_apps', 'Trusted Apps')}
            onBack={handleBack}
          />
        );
      case 'security':
        return (
          <PlaceholderPage
            title={t('settings.security', 'Security')}
            onBack={handleBack}
          />
        );
      default:
        return <PlaceholderPage title="Settings" onBack={handleBack} />;
    }
  }

  return (
    <Container>
      {/* Header with lock button */}
      <HeaderRow>
        <WalletHeader
          accountName={accountName}
          address={accountAddress}
          onCopyAddress={handleCopyAddress}
          onSettingsPress={handleSettingsPress}
          onWalletPress={handleWalletPress}
          style={{ flex: 1, padding: 0, backgroundColor: 'transparent' }}
        />
        <LockButton
          onClick={handleLock}
          aria-label={t('actions.lock', 'Lock')}
        >
          <LockIcon sx={{ color: colors.text.secondary, fontSize: 20 }} />
        </LockButton>
      </HeaderRow>

      <Main>
        {/* Balance Card */}
        <BalanceCard
          network={networkInfo}
          usdTotal={usdTotal}
          changePercent={changePercent}
          changeAmount={changeAmount}
          hiddenBalance={hiddenBalance}
          onToggleVisibility={toggleHidden}
          loading={loading && usdTotal === undefined}
        />

        {/* Action Buttons */}
        <ActionButtonRow
          onSendPress={handleSendPress}
          onReceivePress={handleReceivePress}
          onActivityPress={handleActivityPress}
        />

        {/* Token List Section */}
        <TokenSection>
          <SectionTitle>{t('home.assets', 'Assets')}</SectionTitle>

          {formattedTokens.length > 0 || loading ? (
            <TokenList
              tokens={formattedTokens}
              loading={loading && formattedTokens.length === 0}
              onTokenPress={handleTokenPress}
              hiddenBalance={hiddenBalance}
              maxHeight={400}
            />
          ) : (
            <EmptyState>
              <EmptyStateText>
                {t('home.no_tokens', 'No tokens found')}
              </EmptyStateText>
              <EmptyStateSubtext>
                {t('home.no_tokens_hint', 'Your tokens will appear here once you receive some')}
              </EmptyStateSubtext>
            </EmptyState>
          )}
        </TokenSection>
      </Main>

      {/* Settings Sheet */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onNavigate={handleSettingsNavigate}
        developerNetworksEnabled={developerNetworks}
        onDeveloperNetworksToggle={toggleDeveloperNetworks}
        onRemoveWallet={handleRemoveWallet}
        onRemoveAllWallets={handleRemoveAllWallets}
      />

      {/* Wallet Switcher Sheet */}
      <WalletSwitcherSheet
        visible={walletSwitcherVisible}
        onClose={() => setWalletSwitcherVisible(false)}
        accounts={accounts}
        activeAccountId={accountId || ''}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Edit Account Dialog */}
      <EditAccountDialog
        visible={editAccountDialogVisible}
        onClose={() => setEditAccountDialogVisible(false)}
        currentName={editingAccountName}
        accountId={editingAccountId || ''}
        onSave={handleSaveAccountName}
      />

      {/* Remove Current Wallet Confirmation Dialog */}
      <ConfirmDialog
        visible={removeWalletDialogVisible}
        onClose={() => setRemoveWalletDialogVisible(false)}
        title={t('settings.remove_wallet', 'Remove Wallet')}
        message={t(
          'settings.remove_wallet_description',
          'Are you sure you want to remove this wallet? Make sure you have backed up your recovery phrase before removing.'
        )}
        confirmText={t('actions.remove', 'Remove')}
        isDanger
        requirePassword
        validatePassword={validatePassword}
        onConfirm={confirmRemoveWallet}
      />

      {/* Remove All Wallets Confirmation Dialog */}
      <ConfirmDialog
        visible={removeAllWalletsDialogVisible}
        onClose={() => setRemoveAllWalletsDialogVisible(false)}
        title={t('settings.remove_all_wallets', 'Remove All Wallets')}
        message={t(
          'settings.remove_all_wallets_description',
          'This will remove ALL wallets from this device. This action cannot be undone. Make sure you have backed up all recovery phrases.'
        )}
        confirmText={t('actions.remove_all', 'Remove All')}
        isDanger
        onConfirm={confirmRemoveAllWallets}
      />
    </Container>
  );
}

export default HomePage;
