/**
 * HomeScreen - Main wallet overview screen
 *
 * Displays:
 * - WalletHeader: Account name, address, settings navigation
 * - BalanceCardCarousel: Swipeable balance cards for multiple blockchains
 * - ActionButtonRow: Send, Receive, Activity buttons
 * - TokenList: List of token holdings
 *
 * Features:
 * - Pull-to-refresh for balance updates
 * - Balance visibility toggle (privacy mode)
 * - Multi-chain carousel (Solana, Bitcoin, Ethereum)
 * - Navigation to token detail, send, receive, and activity screens
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

import {
  useAccountsContext,
  useBalance,
  useUserConfig,
  useAvailableNetworks,
  useAdjacentBalances,
  getStashedPassword,
  colors,
  componentSizes,
  vs,
  getMarketChart,
  getCoinInfo,
  type Token,
  type CoinInfo,
  type PriceChartPeriod,
  type PriceDataPoint,
  type AnyNetwork,
} from '@salmon/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WalletHeader,
  BalanceCardCarousel,
  ActionButtonRow,
  TokenList,
  TokenListItem,
  SettingsSheet,
  WalletSwitcherSheet,
  PriceChart,
  TokenAbout,
  TokenMarketData,
  TokenInformationSheet,
  ScalesBackground,
  type BlockchainBalance,
  type BlockchainId,
  type MarketData,
} from '@salmon/ui';

// Map blockchain to CoinGecko ID (outside component to avoid recreation)
const BLOCKCHAIN_TO_COINGECKO: Record<BlockchainId, string> = {
  solana: 'solana',
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
};

// Map blockchain to logo URL (outside component to avoid recreation)
const BLOCKCHAIN_LOGOS: Record<BlockchainId, string> = {
  solana: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  bitcoin: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  ethereum: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
};

// Map period to days for API call (outside component to avoid recreation)
const PERIOD_TO_DAYS: Record<PriceChartPeriod, 1 | 7 | 30 | 90 | 365> = {
  '1H': 1,
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'All': 365,
};

// Network ID to BlockchainId mapping
const NETWORK_TO_BLOCKCHAIN: Record<string, BlockchainId> = {
  // Solana networks
  'mainnet-beta': 'solana',
  'devnet': 'solana-devnet',
  'testnet': 'solana-testnet',

  // Bitcoin networks
  'bitcoin': 'bitcoin',
  'mainnet': 'bitcoin',
  'bitcoin-testnet': 'bitcoin-testnet',
  'bitcoin-regtest': 'bitcoin-signet',

  // Ethereum networks
  'ethereum': 'ethereum',
  'ethereum-sepolia': 'ethereum-sepolia',
  'ethereum-goerli': 'ethereum-holesky',
};

/**
 * Determines the blockchain type from a network object.
 * Maps network IDs to their corresponding BlockchainIds.
 */
function getBlockchainFromNetwork(network: AnyNetwork): BlockchainId {
  const networkId = network.id.toLowerCase();

  // Direct mapping lookup
  const blockchain = NETWORK_TO_BLOCKCHAIN[networkId];
  if (blockchain) {
    return blockchain;
  }

  // Fallback: check for partial matches
  if (networkId.includes('solana')) {
    if (networkId.includes('devnet')) return 'solana-devnet';
    if (networkId.includes('testnet')) return 'solana-testnet';
    return 'solana';
  }

  if (networkId.includes('bitcoin')) {
    if (networkId.includes('testnet')) return 'bitcoin-testnet';
    if (networkId.includes('signet') || networkId.includes('regtest')) return 'bitcoin-signet';
    return 'bitcoin';
  }

  if (networkId.includes('ethereum')) {
    if (networkId.includes('sepolia')) return 'ethereum-sepolia';
    if (networkId.includes('holesky') || networkId.includes('goerli')) return 'ethereum-holesky';
    return 'ethereum';
  }

  // Default to solana mainnet if unable to determine
  return 'solana';
}

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
    price?: number;
    priceChange24h?: number;
    tags?: string[];
    coingeckoId?: string | null;
  }
): Token {
  // Check if token has 'verified' or 'strict' tag
  const isVerified = item.tags?.some(
    (tag) => tag === 'verified' || tag === 'strict'
  ) ?? false;

  // Calculate absolute USD change based on percentage and current balance
  let absoluteChange: number | undefined;
  if (item.priceChange24h !== undefined && item.usdBalance !== undefined && item.usdBalance > 0) {
    // Calculate previous balance: current / (1 + percentage/100)
    const previousBalance = item.usdBalance / (1 + item.priceChange24h / 100);
    absoluteChange = item.usdBalance - previousBalance;
  }

  return {
    address: item.address,
    symbol: item.symbol,
    name: item.name,
    logo: item.logo || undefined,
    price: item.price,
    uiAmount: item.uiAmount,
    usdBalance: item.usdBalance ?? null,
    last24HoursChange: item.priceChange24h !== undefined
      ? { perc: item.priceChange24h, abs: absoluteChange }
      : null,
    tags: item.tags,
    isVerified,
    coingeckoId: item.coingeckoId,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Top fade gradient opacity - animated based on scroll position
  const topFadeOpacity = useRef(new Animated.Value(0)).current;

  // Settings sheet visibility
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Wallet switcher sheet visibility
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  // Active blockchain index for carousel
  const [activeBlockchainIndex, setActiveBlockchainIndex] = useState(0);

  // Bitcoin-specific data states
  const [bitcoinChartData, setBitcoinChartData] = useState<PriceDataPoint[]>([]);
  const [bitcoinCoinInfo, setBitcoinCoinInfo] = useState<CoinInfo | null>(null);
  const [bitcoinChartPeriod, setBitcoinChartPeriod] = useState<PriceChartPeriod>('1M');
  const [bitcoinDataLoading, setBitcoinDataLoading] = useState(false);

  // TokenInformationSheet states
  const [tokenSheetVisible, setTokenSheetVisible] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedTokenChartData, setSelectedTokenChartData] = useState<PriceDataPoint[]>([]);
  const [selectedTokenCoinInfo, setSelectedTokenCoinInfo] = useState<CoinInfo | null>(null);
  const [selectedTokenChartPeriod, setSelectedTokenChartPeriod] = useState<PriceChartPeriod>('1M');
  const [selectedTokenMarketData, setSelectedTokenMarketData] = useState<MarketData | undefined>(undefined);
  const [selectedTokenLoading, setSelectedTokenLoading] = useState(false);

  // Get account state and actions from shared context
  const [accountState, accountActions] = useAccountsContext();
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

  // Get available networks filtered by developer mode
  const { allNetworks } = useAvailableNetworks({
    activeBlockchainAccount: userConfigAccount,
  });

  // Get adjacent network accounts for preloading
  const { adjacentAccounts, shouldPreload } = useAdjacentBalances({
    activeAccount,
    allNetworks,
    activeIndex: activeBlockchainIndex,
  });

  // Get balance data for current network (active)
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

  // Preload balance data for previous network (activeIndex - 1)
  const prevNetwork = allNetworks[activeBlockchainIndex - 1];
  const {
    usdTotal: prevUsdTotal,
    changePercent: prevChangePercent,
    changeAmount: prevChangeAmount,
    loading: prevLoading,
    refreshing: prevRefreshing,
  } = useBalance({
    account: adjacentAccounts.prevAccount,
    networkId: prevNetwork?.id as 'mainnet-beta' | 'devnet' | undefined,
    skip: !ready || !adjacentAccounts.prevAccount || !prevNetwork,
  });

  // Preload balance data for next network (activeIndex + 1)
  const nextNetwork = allNetworks[activeBlockchainIndex + 1];
  const {
    usdTotal: nextUsdTotal,
    changePercent: nextChangePercent,
    changeAmount: nextChangeAmount,
    loading: nextLoading,
    refreshing: nextRefreshing,
  } = useBalance({
    account: adjacentAccounts.nextAccount,
    networkId: nextNetwork?.id as 'mainnet-beta' | 'devnet' | undefined,
    skip: !ready || !adjacentAccounts.nextAccount || !nextNetwork,
  });

  // Create blockchain balances array for carousel
  // Maps available networks from useAvailableNetworks to BlockchainBalance objects
  // Includes preloaded balance data for adjacent networks (±1 from active index)
  const blockchainBalances: BlockchainBalance[] = useMemo(() => {
    return allNetworks.map((network, index) => {
      const blockchain = getBlockchainFromNetwork(network);
      const isActiveNetwork = network.id === networkId;
      const isPrevNetwork = index === activeBlockchainIndex - 1;
      const isNextNetwork = index === activeBlockchainIndex + 1;

      // Determine which balance data to show based on preloading strategy
      let balanceData: {
        usdTotal: number | undefined;
        changePercent: number | undefined;
        changeAmount: number | undefined;
        loading: boolean;
      };

      if (isActiveNetwork) {
        // Active network: show current balance data
        balanceData = {
          usdTotal,
          changePercent,
          changeAmount,
          loading: loading && !refreshing,
        };
      } else if (isPrevNetwork && prevNetwork) {
        // Previous network (index - 1): show preloaded data
        balanceData = {
          usdTotal: prevUsdTotal,
          changePercent: prevChangePercent,
          changeAmount: prevChangeAmount,
          loading: prevLoading && !prevRefreshing,
        };
      } else if (isNextNetwork && nextNetwork) {
        // Next network (index + 1): show preloaded data
        balanceData = {
          usdTotal: nextUsdTotal,
          changePercent: nextChangePercent,
          changeAmount: nextChangeAmount,
          loading: nextLoading && !nextRefreshing,
        };
      } else {
        // Non-adjacent networks: show undefined (not preloaded)
        balanceData = {
          usdTotal: undefined,
          changePercent: undefined,
          changeAmount: undefined,
          loading: false,
        };
      }

      return {
        network: {
          id: network.id,
          name: network.name,
          blockchain,
          logo: BLOCKCHAIN_LOGOS[blockchain],
        },
        ...balanceData,
      };
    });
  }, [
    allNetworks,
    networkId,
    activeBlockchainIndex,
    // Current network balance
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    refreshing,
    // Previous network balance
    prevNetwork,
    prevUsdTotal,
    prevChangePercent,
    prevChangeAmount,
    prevLoading,
    prevRefreshing,
    // Next network balance
    nextNetwork,
    nextUsdTotal,
    nextChangePercent,
    nextChangeAmount,
    nextLoading,
    nextRefreshing,
  ]);

  // Map balance tokens to TokenList format, filtering out spam/unknown tokens
  const tokenListItems = useMemo(() => {
    return tokens
      .filter((token) => {
        // Always show verified tokens (including native SOL)
        const isVerified = token.tags?.some(
          (tag) => tag === 'verified' || tag === 'strict' || tag === 'native'
        );
        if (isVerified) return true;

        // Filter out unknown tokens (no metadata from backend)
        if (token.name === 'Unknown Token' || token.symbol === 'UNKNOWN') {
          return false;
        }

        // Show all other tokens with metadata
        return true;
      })
      .map(mapBalanceToToken);
  }, [tokens]);

  // Get current blockchain type for TokenList styling
  const currentBlockchain = useMemo(() => {
    const activeBalance = blockchainBalances[activeBlockchainIndex];
    return activeBalance?.network.blockchain || 'solana';
  }, [activeBlockchainIndex, blockchainBalances]);

  // Load Bitcoin chart data when user swipes to Bitcoin or changes period
  useEffect(() => {
    const loadBitcoinChartData = async () => {
      if (currentBlockchain !== 'bitcoin') return;

      setBitcoinDataLoading(true);
      try {
        const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
        const days = PERIOD_TO_DAYS[bitcoinChartPeriod];

        const chartResponse = await getMarketChart(coinId, days);

        // Transform chart data to PriceDataPoint format
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
  }, [currentBlockchain, bitcoinChartPeriod]);

  // Load Bitcoin coin info once when user swipes to Bitcoin
  useEffect(() => {
    const loadBitcoinCoinInfo = async () => {
      if (currentBlockchain !== 'bitcoin') return;
      if (bitcoinCoinInfo) return; // Already loaded

      try {
        const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
        const infoResponse = await getCoinInfo(coinId);
        if (infoResponse) {
          setBitcoinCoinInfo(infoResponse);
        }
      } catch (error) {
        console.error('Failed to load Bitcoin coin info:', error);
      }
    };

    loadBitcoinCoinInfo();
  }, [currentBlockchain, bitcoinCoinInfo]);

  // Load selected token chart data when token is selected or period changes
  useEffect(() => {
    const loadSelectedTokenChartData = async () => {
      if (!selectedToken || !tokenSheetVisible) return;

      const coinId = selectedToken.coingeckoId;
      if (!coinId) return;

      setSelectedTokenLoading(true);
      try {
        const days = PERIOD_TO_DAYS[selectedTokenChartPeriod];
        const chartResponse = await getMarketChart(coinId, days);

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
  }, [selectedToken, selectedTokenChartPeriod, tokenSheetVisible]);

  // Load selected token coin info when token is selected
  useEffect(() => {
    const loadSelectedTokenCoinInfo = async () => {
      if (!selectedToken || !tokenSheetVisible) return;

      const coinId = selectedToken.coingeckoId;
      if (!coinId) return;

      try {
        const infoResponse = await getCoinInfo(coinId);
        if (infoResponse) {
          setSelectedTokenCoinInfo(infoResponse);

          // Transform CoinInfo to MarketData
          if (infoResponse.marketData) {
            const md = infoResponse.marketData;
            setSelectedTokenMarketData({
              currentPrice: md.currentPrice,
              marketCap: md.marketCap,
              marketCapRank: md.marketCapRank,
              volume24h: md.totalVolume,
              high24h: md.high24h,
              low24h: md.low24h,
              circulatingSupply: md.circulatingSupply,
              totalSupply: md.totalSupply,
              maxSupply: md.maxSupply,
              ath: md.ath,
              athChangePercentage: md.athChangePercentage,
              athDate: md.athDate,
              atl: md.atl,
              atlChangePercentage: md.atlChangePercentage,
              atlDate: md.atlDate,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load token coin info:', error);
      }
    };

    loadSelectedTokenCoinInfo();
  }, [selectedToken, tokenSheetVisible]);

  // Handle chart period change
  const handleChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setBitcoinChartPeriod(period);
  }, []);

  // Transform CoinInfo to MarketData for TokenMarketData component
  const bitcoinMarketData: MarketData | undefined = useMemo(() => {
    if (!bitcoinCoinInfo?.marketData) return undefined;
    const md = bitcoinCoinInfo.marketData;
    return {
      currentPrice: md.currentPrice,
      marketCap: md.marketCap,
      marketCapRank: md.marketCapRank,
      volume24h: md.totalVolume,
      high24h: md.high24h,
      low24h: md.low24h,
      circulatingSupply: md.circulatingSupply,
      totalSupply: md.totalSupply,
      maxSupply: md.maxSupply,
      ath: md.ath,
      athChangePercentage: md.athChangePercentage,
      athDate: md.athDate,
      atl: md.atl,
      atlChangePercentage: md.atlChangePercentage,
      atlDate: md.atlDate,
    };
  }, [bitcoinCoinInfo]);

  // Create a mock Bitcoin token for display
  const bitcoinToken: Token | undefined = useMemo(() => {
    if (!bitcoinCoinInfo?.marketData) return undefined;
    const md = bitcoinCoinInfo.marketData;
    return {
      address: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
      price: md.currentPrice,
      uiAmount: 0, // No balance yet
      usdBalance: 0,
      last24HoursChange: md.priceChangePercentage24h
        ? { perc: md.priceChangePercentage24h, abs: md.priceChange24h }
        : null,
      isVerified: true,
    };
  }, [bitcoinCoinInfo]);

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
    // Reset previous token data
    setSelectedTokenChartData([]);
    setSelectedTokenCoinInfo(null);
    setSelectedTokenMarketData(undefined);
    setSelectedTokenChartPeriod('1M');
    // Set selected token and show sheet
    setSelectedToken(token);
    setTokenSheetVisible(true);
  }, []);

  const handleTokenSheetClose = useCallback(() => {
    setTokenSheetVisible(false);
    // Clear selected token after animation
    setTimeout(() => {
      setSelectedToken(null);
    }, 300);
  }, []);

  const handleSelectedTokenChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setSelectedTokenChartPeriod(period);
  }, []);

  const handleBlockchainChange = useCallback((blockchain: BlockchainId, index: number) => {
    setActiveBlockchainIndex(index);
    // Future: Could switch active account or fetch different blockchain's balance
    console.log('Switched to blockchain:', blockchain);
  }, []);

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Fade in when scrolled down, fade out when at top
    const opacity = Math.min(offsetY / 30, 1); // Fully visible after 30px scroll
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

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

  // Memoize the fixed header component (Balance Card + Action Buttons)
  // IMPORTANT: This hook must be called BEFORE any early returns to follow React's Rules of Hooks
  const FixedHeaderComponent = useMemo(() => (
    <View style={styles.fixedHeader}>
      {/* Balance Card Carousel */}
      <BalanceCardCarousel
        blockchains={blockchainBalances}
        hiddenBalance={hiddenBalance}
        onToggleVisibility={toggleHidden}
        onBlockchainChange={handleBlockchainChange}
        activeIndex={activeBlockchainIndex}
        style={styles.balanceCard}
      />

      {/* Action Buttons with 24px vertical spacing */}
      <ActionButtonRow
        onSendPress={handleSendPress}
        onReceivePress={handleReceivePress}
        onActivityPress={handleActivityPress}
        style={styles.actionRow}
      />
    </View>
  ), [
    blockchainBalances,
    hiddenBalance,
    toggleHidden,
    handleBlockchainChange,
    activeBlockchainIndex,
    handleSendPress,
    handleReceivePress,
    handleActivityPress,
  ]);

  // Memoize the empty component
  // IMPORTANT: This hook must be called BEFORE any early returns to follow React's Rules of Hooks
  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {loading ? 'Loading tokens...' : 'No tokens found'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Your tokens will appear here once you receive some
      </Text>
    </View>
  ), [loading]);

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Solid background for status bar area and entire screen */}
      <View style={styles.solidBackground} />

      {/* Scales pattern background - starts below header */}
      <ScalesBackground topOffset={insets.top + componentSizes.headerHeight} />

      {/* Fixed Header: Balance Card + Action Buttons */}
      {FixedHeaderComponent}

      {/* Scrollable Token List or Bitcoin View */}
      <View style={styles.listContainer}>
        {currentBlockchain === 'bitcoin' ? (
          // Bitcoin view with chart, about, and market data
          <ScrollView
            style={styles.bitcoinScrollView}
            contentContainerStyle={styles.bitcoinContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bitcoin Token Item */}
            {bitcoinToken && (
              <TokenListItem
                token={bitcoinToken}
                onPress={handleTokenPress}
                hiddenBalance={hiddenBalance}
                blockchain="bitcoin"
              />
            )}

            {/* Price Chart */}
            <View style={styles.bitcoinSection}>
              <PriceChart
                data={bitcoinChartData}
                selectedPeriod={bitcoinChartPeriod}
                onPeriodChange={handleChartPeriodChange}
                loading={bitcoinDataLoading && bitcoinChartData.length === 0}
                height={180}
              />
            </View>

            {/* Market Data */}
            <View style={styles.bitcoinSection}>
              <TokenMarketData
                data={bitcoinMarketData}
                symbol="BTC"
                loading={bitcoinDataLoading && !bitcoinCoinInfo}
              />
            </View>

            {/* About Section - at the end */}
            <View style={styles.bitcoinSection}>
              <TokenAbout
                description={bitcoinCoinInfo?.description}
                loading={bitcoinDataLoading && !bitcoinCoinInfo}
              />
            </View>
          </ScrollView>
        ) : (
          // Normal token list for Solana/Ethereum
          <TokenList
            tokens={tokenListItems}
            loading={loading && tokenListItems.length === 0}
            onTokenPress={handleTokenPress}
            hiddenBalance={hiddenBalance}
            ListEmptyComponent={ListEmptyComponent}
            refreshing={refreshing}
            onRefresh={refresh}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
            blockchain={currentBlockchain}
          />
        )}
        {/* Top fade gradient - shows only when scrolled, fades in dynamically */}
        <Animated.View
          style={[styles.topFadeGradient, { opacity: topFadeOpacity }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[colors.background.primary, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Bottom fade gradient - smooth transition before tab bar */}
      <LinearGradient
        colors={['transparent', colors.background.primary]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />

      {/* Header - Absolutely positioned above content */}
      <WalletHeader
        accountName={accountName}
        address={address}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={handleSettingsPress}
        onWalletPress={handleWalletPress}
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

      {/* Token Information Sheet */}
      {selectedToken && (
        <TokenInformationSheet
          visible={tokenSheetVisible}
          onClose={handleTokenSheetClose}
          token={selectedToken}
          blockchain={currentBlockchain}
          chartData={selectedTokenChartData}
          chartPeriod={selectedTokenChartPeriod}
          onChartPeriodChange={handleSelectedTokenChartPeriodChange}
          coinInfo={selectedTokenCoinInfo}
          marketData={selectedTokenMarketData}
          loading={selectedTokenLoading && selectedTokenChartData.length === 0}
        />
      )}
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
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  fixedHeader: {
    // Fixed header containing balance card and action buttons
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: vs(componentSizes.tabBarScrollPadding),
  },
  balanceCard: {
    // Card now extends behind the header - no negative margin needed
    // The card's internal paddingTop handles the header offset
  },
  actionRow: {
    // 24px vertical spacing moved from ActionButtonRow to create space for card shadow
    marginTop: vs(24), // Space for card shadow to be visible
    marginBottom: vs(24), // Gap before token list
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 30, // iOS standard fade height
    zIndex: 1,
  },
  bottomFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 180,
    bottom: 0,
    zIndex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginHorizontal: 16,
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
  // Bitcoin view styles
  bitcoinScrollView: {
    flex: 1,
  },
  bitcoinContent: {
    paddingTop: 8,
    paddingBottom: vs(componentSizes.tabBarScrollPadding),
  },
  bitcoinSection: {
    marginTop: 16,
  },
});
