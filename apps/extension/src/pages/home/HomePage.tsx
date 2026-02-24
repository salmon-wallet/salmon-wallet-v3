import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  useAccountsContext,
  useAvailableNetworks,
  useBalance,
  useRefreshOnFocus,
  useUserConfig,
  useTransactions,
  useAddressbook,
  getMarketChart,
  getCoinInfo,
  colors,
  spacing,
  fontFamily,
  type SettingsScreen,
  type BlockchainBalance,
  type BlockchainId,
  type NetworkId,
  type PriceChartPeriod,
  type PriceDataPoint,
  type CoinInfo,
  type MarketData,
  type Token,
  type NftData,
  type NftBlockchain,
  type Transaction,
  type SendToken,
  type AddressBookItem,
  type NetworkAdapter,
  type AddressBookNetwork,
  type AddressInput,
  type BlockchainType,
  isSolanaNft,
  createBurnTransaction,
  isSolanaAccount,
  useCurrencyContext,
  LANGUAGE_NAMES,
  type LanguageCode,
  type ExplorerSelectorItem,
  type LanguageSelectorItem,
  type TrustedAppItem,
  SUPPORT_OPTIONS,
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  type CurrencyCode,
  type CurrencySelectorItem,
  getBlockchainFromNetworkId,
  BLOCKCHAIN_TO_COINGECKO,
  PERIOD_TO_DAYS,
  coinInfoToMarketData,
} from '@salmon/shared';
import {
  WalletHeader,
  BalanceCardCarousel,
  ActionButtonRow,
  TokenList,
  TokenListItem,
  TokenListSkeleton,
  PriceChart,
  TokenMarketData,
  TokenAbout,
  TokenDetailPage,
  NftDetailPage,
  NftSeeAllPage,
  TransactionHistoryPage,
  TransactionDetailModal,
  ReceiveSheet,
  SettingsSheet,
  WalletSwitcherSheet,
  ConfirmDialog,
  ScalesBackground,
  SendPage,
  NftSendDialog,
  ExplorerSelector,
  LanguageSelector,
  TrustedAppsSelector,
  SupportSelector,
  CurrencySelector,
} from '../../components';
import IconButton from '@mui/material/IconButton';

// Settings pages for navigation
import { BackupPage } from '../settings/BackupPage';
import { PrivateKeyPage } from '../settings/PrivateKeyPage';
import { AboutPage } from '../settings/AboutPage';
import { AccountAvatarPage } from '../settings/AccountAvatarPage';
import { AddressBookPage } from '../settings/AddressBookPage';
import { AddressAddPage } from '../settings/AddressAddPage';
import { AddressEditPage } from '../settings/AddressEditPage';
import { AccountsPage } from '../settings/AccountsPage';
import { AccountEditPage } from '../settings/AccountEditPage';
import { AccountNamePage } from '../settings/AccountNamePage';
import { AccountAddPage } from '../settings/AccountAddPage';
import { SecurityPage } from '../settings/SecurityPage';

// i18n
import { useLanguage } from '../../i18n';

// Tab content pages
import { CollectiblesPage } from '../collectibles/CollectiblesPage';
import { SwapPage } from '../swap/SwapPage';

/**
 * Active tab within the main app view
 */
type ActiveTab = 'home' | 'collectibles' | 'swap';

/**
 * Available page views within HomePage
 */
type PageView =
  | 'home'
  | 'tokenDetail'
  | 'nftDetail'
  | 'nftSeeAll'
  | 'activity'
  | 'send'
  | 'backup'
  | 'currency'
  | 'about'
  | 'language'
  | 'explorer'
  | 'addressBook'
  | 'addressBookAdd'
  | 'addressBookEdit'
  | 'trustedApps'
  | 'security'
  | 'support'
  | 'privateKey'
  | 'avatar'
  | 'accounts'
  | 'accountEdit'
  | 'accountName'
  | 'accountAdd';

// Network ID → BlockchainId mapping for carousel theming
const NETWORK_TO_BLOCKCHAIN: Record<string, BlockchainId> = {
  'solana-mainnet': 'solana',
  'solana-devnet': 'solana-devnet',
  'bitcoin-mainnet': 'bitcoin',
  'bitcoin-testnet': 'bitcoin-testnet',
  'ethereum-mainnet': 'ethereum',
  'ethereum-sepolia': 'ethereum-sepolia',
};

/**
 * Styled components for HomePage layout
 */
const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.background.primary,
});

const Main = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
});

const BottomFadeGradient = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 180,
  background: `linear-gradient(to bottom, transparent 0%, ${colors.background.primary} 60%)`,
  pointerEvents: 'none',
  zIndex: 1,
});

const TabContent = styled(Box)({
  position: 'relative',
  zIndex: 2,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

const TokenSectionWrapper = styled(Box)({
  flex: 1,
  minHeight: 0,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

const TokenSection = styled(Box)({
  flex: 1,
  minHeight: 0,
  padding: `0 ${spacing.lg}px ${spacing.lg}px`,
  overflowY: 'auto',
});

const BottomListFade = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 30,
  background: `linear-gradient(to top, ${colors.background.primary}, transparent)`,
  pointerEvents: 'none',
  zIndex: 3,
  opacity: 0,
  transition: 'opacity 0.15s ease',
});

const TopListFade = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 30,
  background: `linear-gradient(to bottom, ${colors.background.primary}, transparent)`,
  pointerEvents: 'none',
  zIndex: 3,
  opacity: 0,
  transition: 'opacity 0.15s ease',
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

const TabBar = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  borderBottom: `1px solid ${colors.border.default}`,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const TabButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  flex: 1,
  padding: `${spacing.md}px 0`,
  background: 'none',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.accent.primary}` : '2px solid transparent',
  color: active ? colors.text.primary : colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: active ? 600 : 400,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: colors.text.primary,
  },
}));

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

interface HomePageProps {
  onAddAccount: () => void;
  refreshKey?: number;
}

/**
 * Home page component displayed when wallet is unlocked.
 * Shows account info and provides access to main wallet features.
 */
export function HomePage({ onAddAccount, refreshKey }: HomePageProps) {
  const { t } = useTranslation();
  const [state, actions] = useAccountsContext();
  const [{ currency }, { changeCurrency }] = useCurrencyContext();
  const { ready, activeAccount, activeBlockchainAccount, networkId, accounts, accountId, activeTrustedApps, switchingNetwork } = state;

  // User configuration (developer networks toggle, explorer selection)
  // Note: useUserConfig requires activeBlockchainAccount parameter with specific structure
  const userConfig = useUserConfig({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: networkId?.split('-')[0] || 'solana',
      },
    },
  });
  const {
    developerNetworks,
    toggleDeveloperNetworks,
    explorer,
    explorers,
    changeExplorer,
    isLoading: explorerLoading,
  } = userConfig;

  // Language selection
  const { currentLanguage, supportedLanguages, setLanguage } = useLanguage();

  // Fetch backend RPC URLs and merge into network configs before balance fetch
  const { allNetworks: availableNetworks, networksReady } = useAvailableNetworks({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: 'solana',
      },
    },
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeBlockchainIndex, setActiveBlockchainIndex] = useState(0);

  // Current page view state for navigation
  const [currentPage, setCurrentPage] = useState<PageView>('home');

  // Sheet visibility state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);
  const [receiveSheetVisible, setReceiveSheetVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Edit account navigation state
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Remove wallet dialog state
  const [removeWalletDialogVisible, setRemoveWalletDialogVisible] = useState(false);
  const [removeAllWalletsDialogVisible, setRemoveAllWalletsDialogVisible] = useState(false);

  // Address book state
  const [editingContact, setEditingContact] = useState<AddressBookItem | null>(null);

  // Build NetworkAdapter from available networks for address book
  const addressBookNetworkAdapter: NetworkAdapter = useMemo(() => ({
    getNetwork: async (id: string): Promise<AddressBookNetwork | undefined> => {
      const found = availableNetworks.find((n) => n.id === id);
      if (!found) return undefined;
      return { id: found.id, name: found.name, blockchain: found.id.split('-')[0] as BlockchainType };
    },
    getNetworks: async (): Promise<AddressBookNetwork[]> =>
      availableNetworks.map((n) => ({ id: n.id, name: n.name, blockchain: n.id.split('-')[0] as BlockchainType })),
  }), [availableNetworks]);

  const [{ contacts: addressBookContacts }, { addContact, editContact: editAddressBookContact, removeContact }] = useAddressbook({ networkAdapter: addressBookNetworkAdapter });

  const addressBookItems: AddressBookItem[] = useMemo(
    () => addressBookContacts.map((c) => ({
      name: c.name,
      address: c.address,
      networkId: c.network.id,
      networkName: c.network.name,
      domain: c.domain,
    })),
    [addressBookContacts],
  );

  // NFT action dialog state
  const [nftSendDialogVisible, setNftSendDialogVisible] = useState(false);
  const [burnConfirmVisible, setBurnConfirmVisible] = useState(false);
  const [_burnLoading, setBurnLoading] = useState(false);

  // Token detail page state
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedTokenChartData, setSelectedTokenChartData] = useState<PriceDataPoint[]>([]);
  const [selectedTokenCoinInfo, setSelectedTokenCoinInfo] = useState<CoinInfo | null>(null);
  const [selectedTokenChartPeriod, setSelectedTokenChartPeriod] = useState<PriceChartPeriod>('1M');
  const [selectedTokenMarketData, setSelectedTokenMarketData] = useState<MarketData | undefined>(undefined);
  const [selectedTokenLoading, setSelectedTokenLoading] = useState(false);

  // NFT detail page state
  const [selectedNft, setSelectedNft] = useState<NftData | null>(null);

  // NFT see-all page state
  const [seeAllData, setSeeAllData] = useState<{ title: string; blockchain: NftBlockchain; nfts: NftData[] } | null>(null);

  // Bitcoin-specific state
  const [bitcoinChartData, setBitcoinChartData] = useState<PriceDataPoint[]>([]);
  const [bitcoinCoinInfo, setBitcoinCoinInfo] = useState<CoinInfo | null>(null);
  const [bitcoinChartPeriod, setBitcoinChartPeriod] = useState<PriceChartPeriod>('1M');
  const [bitcoinDataLoading, setBitcoinDataLoading] = useState(false);

  // Filter networks to only include those the user has accounts for
  const allNetworks = useMemo(() => {
    if (!activeAccount?.networksAccounts) return availableNetworks;
    const userNetworkIds = Object.keys(activeAccount.networksAccounts);
    return availableNetworks.filter(network => userNetworkIds.includes(network.id));
  }, [availableNetworks, activeAccount?.networksAccounts]);

  // Reset carousel index when network list changes (e.g. toggling dev mode off)
  useEffect(() => {
    if (activeBlockchainIndex >= allNetworks.length && allNetworks.length > 0) {
      setActiveBlockchainIndex(0);
      actions.changeNetwork(allNetworks[0].id);
    }
  }, [allNetworks, activeBlockchainIndex, actions]);

  // Fetch balance data for current network
  const {
    tokens,
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    refreshing,
    refresh,
    lastUpdated,
    hiddenBalance,
    toggleHidden,
  } = useBalance({
    account: activeBlockchainAccount,
    networkId: networkId as NetworkId | undefined,
    skip: !ready || !activeBlockchainAccount || !networksReady,
  });

  // Refresh balance when extension regains focus (if cache is stale)
  useRefreshOnFocus({
    onFocus: refresh,
    lastUpdated,
    enabled: !!activeBlockchainAccount,
  });

  // Refresh balance after a dApp transaction approval
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  // Clear switching network flag once new data has loaded
  useEffect(() => {
    if (!loading && switchingNetwork) {
      actions.clearSwitchingNetwork();
    }
  }, [loading, switchingNetwork, actions]);

  // Fetch transaction history (only when on activity page)
  const accountAddress = activeBlockchainAccount?.getReceiveAddress() || '';
  const {
    transactions,
    loading: transactionsLoading,
    loadingMore: transactionsLoadingMore,
    error: transactionsError,
    hasMore: transactionsHasMore,
    loadMore: transactionsLoadMore,
    refresh: transactionsRefresh,
  } = useTransactions({
    address: accountAddress,
    networkId: (networkId || 'solana-mainnet') as NetworkId,
    skip: !ready || !activeBlockchainAccount || currentPage !== 'activity',
    account: activeBlockchainAccount,
  });

  // Navigation handlers
  const handleBack = useCallback(() => {
    setCurrentPage('home');
  }, []);

  // Event handlers
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
      accounts: 'accounts',
      avatar: 'avatar',
      security: 'security',
      backup: 'backup',
      language: 'language',
      currency: 'currency',
      explorer: 'explorer',
      addressBook: 'addressBook',
      trustedApps: 'trustedApps',
      about: 'about',
      support: 'support',
      privateKey: 'privateKey',
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
    setCurrentPage('accountAdd');
  }, []);

  const handleEditAccount = useCallback((targetAccountId: string) => {
    setEditingAccountId(targetAccountId);
    setWalletSwitcherVisible(false);
    setCurrentPage('accountEdit');
  }, []);

  const handleDeleteAccount = useCallback(async (targetAccountId: string) => {
    // The WalletSwitcherSheet already shows a confirmation dialog
    // and only calls this after user confirms, so we can directly remove
    await actions.removeAccount(targetAccountId);

    // If we deleted the active account, the hook will auto-switch
    // Close the wallet switcher sheet
    setWalletSwitcherVisible(false);
  }, [actions]);

  const handleSendPress = useCallback(() => {
    setCurrentPage('send');
  }, []);

  const handleSendBack = useCallback(() => {
    setCurrentPage('home');
  }, []);

  const handleSendSuccess = useCallback(() => {
    setCurrentPage('home');
    refresh();
  }, [refresh]);

  const handleReceivePress = useCallback(() => {
    setReceiveSheetVisible(true);
  }, []);

  const handleActivityPress = useCallback(() => {
    setCurrentPage('activity');
  }, []);

  const handleActivityBack = useCallback(() => {
    setCurrentPage('home');
  }, []);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
  }, []);

  const handleTransactionDetailClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
  }, []);

  const handleTokenPress = useCallback((token: Token) => {
    setSelectedTokenChartData([]);
    setSelectedTokenCoinInfo(null);
    setSelectedTokenMarketData(undefined);
    setSelectedTokenChartPeriod('1M');
    setSelectedToken(token);
    setCurrentPage('tokenDetail');
  }, []);

  const handleTokenDetailBack = useCallback(() => {
    setCurrentPage('home');
    setSelectedToken(null);
  }, []);

  const handleNftDetailPress = useCallback((nft: NftData) => {
    setSelectedNft(nft);
    setCurrentPage('nftDetail');
  }, []);

  const handleNftDetailBack = useCallback(() => {
    setCurrentPage('home');
    setSelectedNft(null);
  }, []);

  const handleSeeAllBack = useCallback(() => {
    setCurrentPage('home');
    setSeeAllData(null);
  }, []);

  const handleSeeAllNftPress = useCallback((nft: NftData) => {
    setSelectedNft(nft);
    setCurrentPage('nftDetail');
  }, []);

  // NFT action handlers
  const handleNftSendPress = useCallback(() => {
    setNftSendDialogVisible(true);
  }, []);

  const handleNftBurnPress = useCallback(() => {
    if (selectedNft && isSolanaNft(selectedNft)) {
      setBurnConfirmVisible(true);
    }
    // Other chains: burn is not supported (button won't be wired)
  }, [selectedNft]);

  const confirmBurnNft = useCallback(async () => {
    if (!selectedNft || !isSolanaNft(selectedNft) || !activeBlockchainAccount || !isSolanaAccount(activeBlockchainAccount)) return;

    setBurnLoading(true);
    try {
      const solanaAccount = activeBlockchainAccount;
      const ownerAddress = solanaAccount.getReceiveAddress();
      const txResponse = await createBurnTransaction({
        mintAddress: selectedNft.mint,
        ownerAddress,
      });

      // The burn API returns a serialized transaction — sign and send
      const { VersionedTransaction } = await import('@solana/web3.js');
      const txBytes = Buffer.from(txResponse.transaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBytes);
      const connection = await solanaAccount.getConnection();
      tx.sign([solanaAccount.keyPair]);
      await connection.sendRawTransaction(tx.serialize());

      // Return to home after burn
      setBurnConfirmVisible(false);
      setCurrentPage('home');
      setSelectedNft(null);
    } catch (error) {
      console.error('[HomePage] NFT burn failed:', error);
    } finally {
      setBurnLoading(false);
    }
  }, [selectedNft, activeBlockchainAccount]);

  const handleSelectedTokenChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setSelectedTokenChartPeriod(period);
  }, []);

  // Scroll-driven fade refs for token list
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);

  const handleTokenListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollHeight - scrollTop - clientHeight < 2;

    if (topFadeRef.current) {
      topFadeRef.current.style.opacity = String(Math.min(scrollTop / 30, 1));
    }
    if (bottomFadeRef.current) {
      bottomFadeRef.current.style.opacity = atBottom ? '0' : '1';
    }
  }, []);

  // Build blockchain balances array for carousel
  const blockchainBalances: BlockchainBalance[] = useMemo(() => {
    return allNetworks.map((network, index) => {
      const blockchain = NETWORK_TO_BLOCKCHAIN[network.id] || 'solana';
      const isActiveNetwork = network.id === networkId;

      let balanceData: {
        usdTotal: number | undefined;
        changePercent: number | undefined;
        changeAmount: number | undefined;
        loading: boolean;
      };

      if (isActiveNetwork) {
        const showSkeleton = switchingNetwork || refreshing;
        balanceData = {
          usdTotal: showSkeleton ? undefined : usdTotal,
          changePercent: showSkeleton ? undefined : changePercent,
          changeAmount: showSkeleton ? undefined : changeAmount,
          loading: showSkeleton || (loading && usdTotal === undefined),
        };
      } else {
        balanceData = { usdTotal: undefined, changePercent: undefined, changeAmount: undefined, loading: false };
      }

      return {
        network: { id: network.id, name: network.name, blockchain },
        ...balanceData,
      };
    });
  }, [
    allNetworks, networkId, activeBlockchainIndex, switchingNetwork, refreshing,
    usdTotal, changePercent, changeAmount, loading,
  ]);

  // Handle blockchain change from carousel arrows
  const handleBlockchainChange = useCallback((_blockchain: BlockchainId, index: number) => {
    setActiveBlockchainIndex(index);
    const selectedBalance = blockchainBalances[index];
    if (selectedBalance) {
      actions.changeNetwork(selectedBalance.network.id);
    }
  }, [blockchainBalances, actions]);

  // Current blockchain for filtering logic
  const currentBlockchain = useMemo(() => {
    const active = blockchainBalances[activeBlockchainIndex];
    return active?.network.blockchain || 'solana';
  }, [activeBlockchainIndex, blockchainBalances]);

  // Transform tokens to match TokenList expected format, filtering spam in non-dev mode
  const formattedTokens = useMemo(() => {
    return tokens
      .filter((token) => {
        // Tag-based spam filtering only applies to Solana (Jupiter tags)
        if (!currentBlockchain.startsWith('solana')) return true;

        const hasMeaningfulTags =
          token.tags &&
          token.tags.length > 0 &&
          token.tags.some((tag) => tag !== 'unknown');
        if (hasMeaningfulTags) return true;

        // Hide unknown tokens unless developer mode is enabled
        return !!developerNetworks;
      })
      .map((token) => ({
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
        tags: token.tags,
        coingeckoId: token.coingeckoId,
        decimals: token.decimals,
      }));
  }, [tokens, developerNetworks, currentBlockchain]);

  // Load Bitcoin chart data when on Bitcoin mainnet or period changes
  useEffect(() => {
    const loadBitcoinChartData = async () => {
      if (currentBlockchain !== 'bitcoin') return;

      setBitcoinDataLoading(true);
      try {
        const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
        const days = PERIOD_TO_DAYS[bitcoinChartPeriod];
        const chartResponse = await getMarketChart(coinId, days, currency);

        if (chartResponse?.prices) {
          const priceData: PriceDataPoint[] = chartResponse.prices.map(([timestamp, price]) => ({
            timestamp,
            price,
          }));
          setBitcoinChartData(priceData);
        }
      } catch (error) {
        console.error('Failed to load Bitcoin chart data:', error);
      } finally {
        setBitcoinDataLoading(false);
      }
    };

    loadBitcoinChartData();
  }, [currentBlockchain, bitcoinChartPeriod, currency]);

  // Load Bitcoin coin info once when on Bitcoin mainnet
  useEffect(() => {
    const loadBitcoinCoinInfo = async () => {
      if (currentBlockchain !== 'bitcoin') return;
      if (bitcoinCoinInfo) return;

      try {
        const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
        const infoResponse = await getCoinInfo(coinId, currency);
        if (infoResponse) {
          setBitcoinCoinInfo(infoResponse);
        }
      } catch (error) {
        console.error('Failed to load Bitcoin coin info:', error);
      }
    };

    loadBitcoinCoinInfo();
  }, [currentBlockchain, bitcoinCoinInfo, currency]);

  // Transform CoinInfo to MarketData for TokenMarketData component
  const bitcoinMarketData: MarketData | undefined = useMemo(() => {
    if (!bitcoinCoinInfo) return undefined;
    return coinInfoToMarketData(bitcoinCoinInfo);
  }, [bitcoinCoinInfo]);

  // Create Bitcoin token for display
  const bitcoinToken: Token | undefined = useMemo(() => {
    if (!bitcoinCoinInfo?.marketData) return undefined;
    const md = bitcoinCoinInfo.marketData;
    return {
      address: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
      price: md.currentPrice,
      uiAmount: 0,
      usdBalance: 0,
      last24HoursChange: md.priceChangePercentage24h
        ? { perc: md.priceChangePercentage24h, abs: md.priceChange24h }
        : null,
      isVerified: true,
    };
  }, [bitcoinCoinInfo]);

  const handleChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setBitcoinChartPeriod(period);
  }, []);

  // Load selected token chart data when token is selected or period changes
  useEffect(() => {
    const loadSelectedTokenChartData = async () => {
      if (!selectedToken || currentPage !== 'tokenDetail') return;

      const coinId = selectedToken.coingeckoId;
      if (!coinId) return;

      setSelectedTokenLoading(true);
      try {
        const days = PERIOD_TO_DAYS[selectedTokenChartPeriod];
        const chartResponse = await getMarketChart(coinId, days, currency);

        if (chartResponse?.prices) {
          const priceData: PriceDataPoint[] = chartResponse.prices.map(([timestamp, price]) => ({
            timestamp,
            price,
          }));
          setSelectedTokenChartData(priceData);
        }
      } catch (error) {
        console.error('Failed to load token chart data:', error);
      } finally {
        setSelectedTokenLoading(false);
      }
    };

    loadSelectedTokenChartData();
  }, [selectedToken, selectedTokenChartPeriod, currentPage, currency]);

  // Load selected token coin info when token is selected
  useEffect(() => {
    const loadSelectedTokenCoinInfo = async () => {
      if (!selectedToken || currentPage !== 'tokenDetail') return;

      const coinId = selectedToken.coingeckoId;
      if (!coinId) return;

      try {
        const infoResponse = await getCoinInfo(coinId, currency);
        if (infoResponse) {
          setSelectedTokenCoinInfo(infoResponse);

          setSelectedTokenMarketData(coinInfoToMarketData(infoResponse));
        }
      } catch (error) {
        console.error('Failed to load token coin info:', error);
      }
    };

    loadSelectedTokenCoinInfo();
  }, [selectedToken, currentPage, currency]);

  const accountName = activeAccount?.name || t('home.unnamed_account', 'Account');

  // Render settings pages based on current page view
  if (currentPage !== 'home') {
    switch (currentPage) {
      case 'tokenDetail':
        if (selectedToken) {
          return (
            <TokenDetailPage
              token={selectedToken}
              blockchain={getBlockchainFromNetworkId(currentBlockchain)}
              chartData={selectedTokenChartData}
              chartPeriod={selectedTokenChartPeriod}
              onChartPeriodChange={handleSelectedTokenChartPeriodChange}
              coinInfo={selectedTokenCoinInfo}
              marketData={selectedTokenMarketData}
              loading={selectedTokenLoading && selectedTokenChartData.length === 0}
              onBack={handleTokenDetailBack}
            />
          );
        }
        return <PlaceholderPage title="Token Detail" onBack={handleBack} />;
      case 'nftDetail':
        if (selectedNft) {
          return (
            <>
              <NftDetailPage
                nft={selectedNft}
                onBack={handleNftDetailBack}
                onSendPress={handleNftSendPress}
                onBurnPress={handleNftBurnPress}
              />

              {/* NFT Send Dialog */}
              <NftSendDialog
                visible={nftSendDialogVisible}
                onClose={() => setNftSendDialogVisible(false)}
                nft={selectedNft}
                account={activeBlockchainAccount}
                onSuccess={() => {
                  setNftSendDialogVisible(false);
                  setCurrentPage('home');
                  setSelectedNft(null);
                  refresh();
                }}
              />

              {/* NFT Burn Confirmation (Solana only) */}
              <ConfirmDialog
                visible={burnConfirmVisible}
                onClose={() => setBurnConfirmVisible(false)}
                title={t('nft.burn_nft', 'Burn NFT')}
                message={t(
                  'nft.burn_nft_description',
                  'Are you sure you want to burn this NFT? This action cannot be undone.'
                )}
                confirmText={t('actions.burn', 'Burn')}
                isDanger
                onConfirm={confirmBurnNft}
              />
            </>
          );
        }
        return <PlaceholderPage title="NFT Detail" onBack={handleBack} />;
      case 'nftSeeAll':
        if (seeAllData) {
          return (
            <NftSeeAllPage
              title={seeAllData.title}
              blockchain={seeAllData.blockchain}
              nfts={seeAllData.nfts}
              onNftPress={handleSeeAllNftPress}
              onBack={handleSeeAllBack}
            />
          );
        }
        return <PlaceholderPage title="NFTs" onBack={handleBack} />;
      case 'send':
        if (!activeBlockchainAccount) {
          return <PlaceholderPage title="Send" onBack={handleSendBack} />;
        }
        return (
          <SendPage
            tokens={formattedTokens as SendToken[]}
            blockchain={getBlockchainFromNetworkId(currentBlockchain)}
            account={activeBlockchainAccount}
            onBack={handleSendBack}
            onSuccess={handleSendSuccess}
          />
        );
      case 'activity':
        return (
          <>
            <TransactionHistoryPage
              onBack={handleActivityBack}
              transactions={transactions}
              loading={transactionsLoading}
              loadingMore={transactionsLoadingMore}
              hasMore={transactionsHasMore}
              onLoadMore={transactionsLoadMore}
              hiddenBalance={hiddenBalance}
              error={transactionsError}
              onRetry={transactionsRefresh}
              onTransactionPress={handleTransactionPress}
              onTransactionDetailClick={handleTransactionDetailClick}
            />
            <TransactionDetailModal
              visible={!!selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              transaction={selectedTransaction}
              developerMode={developerNetworks}
            />
          </>
        );
      case 'avatar':
        return <AccountAvatarPage onBack={handleBack} />;
      case 'backup':
        return <BackupPage onBack={handleBack} />;
      case 'privateKey':
        return <PrivateKeyPage onBack={handleBack} />;
      case 'currency': {
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
            onSelectCurrency={(code) => {
              changeCurrency(code as CurrencyCode);
              setCurrentPage('home');
            }}
            onBack={handleBack}
          />
        );
      }
      case 'about':
        return <AboutPage onBack={handleBack} />;
      case 'support':
        return (
          <SupportSelector
            options={SUPPORT_OPTIONS}
            onOpenLink={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
            onBack={handleBack}
          />
        );
      case 'language': {
        const languageItems: LanguageSelectorItem[] = supportedLanguages.map(
          (lang) => ({
            code: lang,
            nativeName: LANGUAGE_NAMES[lang as LanguageCode] || lang,
          })
        );
        return (
          <LanguageSelector
            languages={languageItems}
            activeLanguageCode={currentLanguage}
            onSelectLanguage={(code) => {
              setLanguage(code as LanguageCode);
              setCurrentPage('home');
            }}
            onBack={handleBack}
          />
        );
      }
      case 'explorer': {
        const explorerItems: ExplorerSelectorItem[] = explorers.map((e) => ({
          key: e.key,
          name: e.name,
        }));
        return (
          <ExplorerSelector
            explorers={explorerItems}
            activeExplorerName={explorer?.name || ''}
            onSelectExplorer={(key) => {
              changeExplorer(key);
              setCurrentPage('home');
            }}
            onBack={handleBack}
            loading={explorerLoading}
          />
        );
      }
      case 'addressBook': {
        return (
          <AddressBookPage
            contacts={addressBookItems}
            activeNetworkId={networkId || 'solana-mainnet'}
            onAddContact={() => setCurrentPage('addressBookAdd')}
            onEditContact={(contact) => {
              setEditingContact(contact);
              setCurrentPage('addressBookEdit');
            }}
            onRemoveContact={async (address) => {
              await removeContact(address);
            }}
            onBack={handleBack}
          />
        );
      }
      case 'addressBookAdd': {
        const activeNet = allNetworks.find((n) => n.id === networkId) || allNetworks[0];
        const blockchain = (networkId || 'solana-mainnet').split('-')[0];
        return (
          <AddressAddPage
            activeNetworkId={activeNet?.id || 'solana-mainnet'}
            activeNetworkName={activeNet?.name || 'Solana Mainnet'}
            activeBlockchain={blockchain}
            onSave={async (input: AddressInput) => {
              await addContact(input);
              setCurrentPage('addressBook');
            }}
            onBack={() => setCurrentPage('addressBook')}
          />
        );
      }
      case 'addressBookEdit': {
        if (!editingContact) {
          setCurrentPage('addressBook');
          return null;
        }
        const blockchain = (editingContact.networkId || 'solana-mainnet').split('-')[0];
        return (
          <AddressEditPage
            contact={editingContact}
            activeBlockchain={blockchain}
            onSave={async (originalAddress: string, input: AddressInput) => {
              await editAddressBookContact(originalAddress, input);
              setEditingContact(null);
              setCurrentPage('addressBook');
            }}
            onBack={() => setCurrentPage('addressBook')}
          />
        );
      }
      case 'trustedApps': {
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
            onRevokeApp={(domain) => {
              actions.removeTrustedApp(domain);
            }}
            onBack={handleBack}
          />
        );
      }
      case 'security':
        return <SecurityPage onBack={handleBack} />;
      case 'accounts':
        return (
          <AccountsPage
            onBack={handleBack}
            onEditAccount={(id) => {
              setEditingAccountId(id);
              setCurrentPage('accountEdit');
            }}
            onAddAccount={() => setCurrentPage('accountAdd')}
          />
        );
      case 'accountEdit':
        return (
          <AccountEditPage
            accountId={editingAccountId || accountId || ''}
            onEditName={(id) => {
              setEditingAccountId(id);
              setCurrentPage('accountName');
            }}
            onEditAvatar={() => setCurrentPage('avatar')}
            onBackupSeed={() => setCurrentPage('backup')}
            onExportPrivateKey={() => setCurrentPage('privateKey')}
            onBack={handleBack}
          />
        );
      case 'accountName':
        return (
          <AccountNamePage
            accountId={editingAccountId || accountId || ''}
            onBack={() => setCurrentPage('accountEdit')}
          />
        );
      case 'accountAdd':
        return (
          <AccountAddPage
            onComplete={() => setCurrentPage('home')}
            onBack={handleBack}
          />
        );
      default:
        return <PlaceholderPage title="Settings" onBack={handleBack} />;
    }
  }

  return (
    <Container>
      {/* Header */}
      <WalletHeader
        accountName={accountName}
        address={accountAddress}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={handleSettingsPress}
        onRefreshPress={refresh}
        refreshing={refreshing}
        onWalletPress={handleWalletPress}
        avatarUrl={activeAccount?.avatar}
        accountId={activeAccount?.id}
      />

      {/* Tab Bar */}
      <TabBar>
        <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
          {t('tabs.home', 'Home')}
        </TabButton>
        <TabButton active={activeTab === 'collectibles'} onClick={() => setActiveTab('collectibles')}>
          {t('tabs.collectibles', 'Collectibles')}
        </TabButton>
        <TabButton active={activeTab === 'swap'} onClick={() => setActiveTab('swap')}>
          {t('tabs.swap', 'Swap')}
        </TabButton>
      </TabBar>

      <Main>
        {/* Background layers — shared across all three tabs */}
        <ScalesBackground style={{ zIndex: 0 }} />
        <BottomFadeGradient />

        <TabContent>
          {activeTab === 'home' && (
            <>
              {/* Balance Card Carousel */}
              <BalanceCardCarousel
                blockchains={blockchainBalances}
                hiddenBalance={hiddenBalance}
                onToggleVisibility={toggleHidden}
                onBlockchainChange={handleBlockchainChange}
                activeIndex={activeBlockchainIndex}
                showNetworkLabel={developerNetworks}
              />

              {/* Action Buttons */}
              <ActionButtonRow
                onSendPress={handleSendPress}
                onReceivePress={handleReceivePress}
                onActivityPress={handleActivityPress}
                style={{ marginTop: 24, marginBottom: 24 }}
              />

              {/* Token List Section — only this area scrolls */}
              <TokenSectionWrapper>
                <TopListFade ref={topFadeRef} />
                {currentBlockchain === 'bitcoin' ? (
                  <TokenSection onScroll={handleTokenListScroll}>
                    {(switchingNetwork || refreshing) ? (
                      <TokenListSkeleton count={1} />
                    ) : bitcoinToken && (
                      <TokenListItem
                        token={bitcoinToken}
                        onPress={handleTokenPress}
                        hiddenBalance={hiddenBalance}
                        blockchain="bitcoin"
                      />
                    )}
                    <PriceChart
                      data={bitcoinChartData}
                      selectedPeriod={bitcoinChartPeriod}
                      onPeriodChange={handleChartPeriodChange}
                      loading={bitcoinDataLoading && bitcoinChartData.length === 0}
                      height={180}
                      style={{ marginTop: spacing.md }}
                    />
                    <TokenMarketData
                      data={bitcoinMarketData}
                      symbol="BTC"
                      loading={bitcoinDataLoading && !bitcoinCoinInfo}
                      style={{ marginTop: spacing.md }}
                    />
                    <TokenAbout
                      description={bitcoinCoinInfo?.description}
                      loading={bitcoinDataLoading && !bitcoinCoinInfo}
                      maxLines={4}
                      style={{ marginTop: spacing.md }}
                    />
                  </TokenSection>
                ) : (
                  <TokenSection onScroll={handleTokenListScroll}>
                    {formattedTokens.length > 0 || loading || switchingNetwork || refreshing ? (
                      <TokenList
                        tokens={(switchingNetwork || refreshing) ? [] : formattedTokens}
                        loading={(switchingNetwork || refreshing) || (loading && formattedTokens.length === 0)}
                        onTokenPress={handleTokenPress}
                        hiddenBalance={hiddenBalance}
                        blockchain={getBlockchainFromNetworkId(currentBlockchain)}
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
                )}

                <BottomListFade ref={bottomFadeRef} />
              </TokenSectionWrapper>
            </>
          )}

          {activeTab === 'collectibles' && (
            <CollectiblesPage
              activeAccount={activeAccount}
              developerNetworks={developerNetworks}
              onNftDetailPress={handleNftDetailPress}
              // onSeeAllPress={handleSeeAllPress}
            />
          )}

          {activeTab === 'swap' && <SwapPage onNavigateHome={() => setActiveTab('home')} />}
        </TabContent>
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

      {/* Receive Sheet */}
      <ReceiveSheet
        visible={receiveSheetVisible}
        onClose={() => setReceiveSheetVisible(false)}
        address={accountAddress}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        developerMode={developerNetworks}
      />

    </Container>
  );
}

export default HomePage;
