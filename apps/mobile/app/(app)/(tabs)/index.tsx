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

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  componentSizes,
  getCoinInfo,
  getMarketChart,
  getShortAddress,
  spacing,
  useAccountsContext,
  useAdjacentBalances,
  useAvailableNetworks,
  useBalance,
  useCurrencyContext,
  useTransactions,
  useUserConfig,
  vs,
  getBlockchainFromNetworkId,
  BLOCKCHAIN_TO_COINGECKO,
  PERIOD_TO_DAYS,
  coinInfoToMarketData,
  type CoinInfo,
  type NetworkId,
  type PriceChartPeriod,
  type PriceDataPoint,
  type Token,
} from '@salmon/shared';
import {
  ActionButtonRow,
  BalanceCardCarousel,
  PriceChart,
  ReceiveSheet,
  SendSheet,
  SubAccountSelector,
  TokenAbout,
  TokenInformationSheet,
  TokenList,
  TokenListItem,
  TokenMarketData,
  TransactionDetailModal,
  TransactionHistorySheet,
  type BlockchainBalance,
  type BlockchainId,
  type MarketData,
  type SubAccount,
  type Transaction,
} from '../../../src/components';


// Map blockchain to logo URL (outside component to avoid recreation)
const BLOCKCHAIN_LOGOS: Record<BlockchainId, string> = {
  'solana': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'solana-devnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'bitcoin': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'bitcoin-testnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'ethereum': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'ethereum-sepolia': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
};


/**
 * Maps context networkId to transaction API networkId format.
 * Since network IDs now match the API format directly, this is mostly a passthrough.
 */
function getTransactionNetworkId(networkId: string | null): string {
  if (!networkId) return 'solana-mainnet';
  return networkId;
}

/**
 * Convert TokenBalanceWithPrice to Token for TokenList
 */
function mapBalanceToToken(
  item: {
    address: string;
    symbol: string;
    name: string;
    logo?: string;
    uiAmount: number;
    usdBalance?: number;
    price?: number;
    priceChange24h?: number;
    tags?: string[];
    coingeckoId?: string;
  }
): Token {
  // Check if token has 'verified' tag
  const isVerified = item.tags?.includes('verified') ?? false;

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
  const [{ currency }] = useCurrencyContext();

  // Top fade gradient opacity - animated based on scroll position
  const topFadeOpacity = useRef(new Animated.Value(0)).current;

  // Active blockchain index for carousel
  const [activeBlockchainIndex, setActiveBlockchainIndex] = useState(0);

  // Sub-account switching state (for showing skeleton during switch)
  const [switchingSubAccount, setSwitchingSubAccount] = useState(false);
  const [pendingSubAccountIndex, setPendingSubAccountIndex] = useState<number | undefined>(undefined);

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

  // ReceiveSheet visibility
  const [receiveSheetVisible, setReceiveSheetVisible] = useState(false);

  // SendSheet visibility
  const [sendSheetVisible, setSendSheetVisible] = useState(false);

  // TransactionHistorySheet visibility
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);

  // TransactionDetailModal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Get account state and actions from shared context
  const [accountState, accountActions] = useAccountsContext();
  const {
    ready,
    activeAccount,
    activeBlockchainAccount,
    networkId,
    pathIndex,
  } = accountState;

  // User configuration (developer networks toggle)
  // Build a mock activeBlockchainAccount for useUserConfig when not available
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
  const { developerNetworks } = useUserConfig({
    activeBlockchainAccount: userConfigAccount,
  });

  // Get available networks filtered by developer mode
  const { allNetworks: availableNetworks } = useAvailableNetworks({
    activeBlockchainAccount: userConfigAccount,
  });

  // Filter networks to only include those the user has accounts for
  // This prevents showing networks in the carousel that the user can't switch to
  // (e.g., accounts created before multi-chain derivation won't have BTC/ETH)
  const allNetworks = useMemo(() => {
    if (!activeAccount?.networksAccounts) return availableNetworks;

    const userNetworkIds = Object.keys(activeAccount.networksAccounts);
    return availableNetworks.filter(network => userNetworkIds.includes(network.id));
  }, [availableNetworks, activeAccount?.networksAccounts]);

  // Get adjacent network accounts for preloading
  const { adjacentAccounts } = useAdjacentBalances({
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
    networkId: (networkId ?? undefined) as NetworkId | undefined,
    skip: !ready || !activeBlockchainAccount,
  });

  // Get transaction history for current account
  const address = activeBlockchainAccount?.getReceiveAddress() ?? '';
  const {
    transactions: historyTransactions,
    loading: transactionsLoading,
    loadingMore: transactionsLoadingMore,
    error: transactionsError,
    hasMore: transactionsHasMore,
    loadMore: transactionsLoadMore,
    refresh: transactionsRefresh,
  } = useTransactions({
    address,
    networkId: getTransactionNetworkId(networkId) as NetworkId,
    skip: !ready || !activeBlockchainAccount || !transactionHistoryVisible,
    account: activeBlockchainAccount,
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
    networkId: prevNetwork?.id as NetworkId | undefined,
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
    networkId: nextNetwork?.id as NetworkId | undefined,
    skip: !ready || !adjacentAccounts.nextAccount || !nextNetwork,
  });

  // Create blockchain balances array for carousel
  // Maps available networks from useAvailableNetworks to BlockchainBalance objects
  // Includes preloaded balance data for adjacent networks (±1 from active index)
  const blockchainBalances: BlockchainBalance[] = useMemo(() => {
    return allNetworks.map((network, index) => {
      const blockchain = network.id.replace('-mainnet', '') as BlockchainId;
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
        // Show loading during sub-account switch OR when balance is loading
        balanceData = {
          usdTotal: switchingSubAccount ? undefined : usdTotal,
          changePercent: switchingSubAccount ? undefined : changePercent,
          changeAmount: switchingSubAccount ? undefined : changeAmount,
          loading: switchingSubAccount || (loading && !refreshing),
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
    switchingSubAccount,
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

  // Get current blockchain type for TokenList styling
  const currentBlockchain = useMemo(() => {
    const activeBalance = blockchainBalances[activeBlockchainIndex];
    return activeBalance?.network.blockchain || 'solana';
  }, [activeBlockchainIndex, blockchainBalances]);

  // Map balance tokens to TokenList format, filtering out spam/unknown tokens
  const tokenListItems = useMemo(() => {
    return tokens
      .filter((token) => {
        // Tag-based spam filtering only applies to Solana (Jupiter tags)
        // ETH and BTC tokens don't have a tag system
        if (!currentBlockchain.startsWith('solana')) {
          return true;
        }

        // Check if token has meaningful tags (not just "unknown")
        const hasMeaningfulTags =
          token.tags &&
          token.tags.length > 0 &&
          token.tags.some((tag) => tag !== 'unknown');

        // Always show tokens with known tags (verified, community, etc.)
        if (hasMeaningfulTags) return true;

        // Filter out unknown tokens unless developer mode is enabled
        // Unknown tokens are those with:
        // - No tags at all
        // - Only "unknown" tag (from Jupiter API for unverified tokens)
        if (!developerNetworks) {
          return false;
        }

        // Developer mode: show all tokens including unknown ones
        return true;
      })
      .map(mapBalanceToToken);
  }, [tokens, developerNetworks, currentBlockchain]);

  // Compute sub-accounts for the current network (for path index switching)
  const subAccounts = useMemo((): SubAccount[] => {
    if (!activeAccount || !networkId) return [];
    const networkAccounts = activeAccount.networksAccounts[networkId];
    if (!networkAccounts) return [];
    return networkAccounts
      .map((acc, idx) => acc ? { index: idx, address: getShortAddress(acc.getReceiveAddress(), 4) ?? '' } : null)
      .filter((item): item is SubAccount => item !== null);
  }, [activeAccount, networkId]);

  // Debounce timer ref to prevent rapid sub-account switching from spamming API
  const subAccountChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubAccountChange = useCallback((index: number) => {
    // Don't do anything if already on this account
    if (index === pathIndex) return;

    // Clear any pending change
    if (subAccountChangeTimerRef.current) {
      clearTimeout(subAccountChangeTimerRef.current);
    }

    // Immediately show switching state (activate skeletons)
    setSwitchingSubAccount(true);
    setPendingSubAccountIndex(index);

    // Debounce the change by 300ms to prevent API spam on rapid taps
    subAccountChangeTimerRef.current = setTimeout(() => {
      accountActions.changePathIndex(index);
      subAccountChangeTimerRef.current = null;
    }, 300);
  }, [accountActions, pathIndex]);

  // Clear switching state when loading completes
  useEffect(() => {
    if (!loading && !refreshing && switchingSubAccount) {
      setSwitchingSubAccount(false);
      setPendingSubAccountIndex(undefined);
    }
  }, [loading, refreshing, switchingSubAccount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subAccountChangeTimerRef.current) {
        clearTimeout(subAccountChangeTimerRef.current);
      }
    };
  }, []);

  // Load Bitcoin chart data when user swipes to Bitcoin or changes period
  useEffect(() => {
    const loadBitcoinChartData = async () => {
      if (currentBlockchain !== 'bitcoin') return;

      setBitcoinDataLoading(true);
      try {
        const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
        const days = PERIOD_TO_DAYS[bitcoinChartPeriod];

        const chartResponse = await getMarketChart(coinId, days, currency);

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
  }, [currentBlockchain, bitcoinChartPeriod, currency]);

  // Load Bitcoin coin info once when user swipes to Bitcoin
  useEffect(() => {
    const loadBitcoinCoinInfo = async () => {
      if (currentBlockchain !== 'bitcoin') return;
      if (bitcoinCoinInfo) return; // Already loaded

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

  // Load selected token chart data when token is selected or period changes
  useEffect(() => {
    const loadSelectedTokenChartData = async () => {
      if (!selectedToken || !tokenSheetVisible) return;

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
  }, [selectedToken, selectedTokenChartPeriod, tokenSheetVisible, currency]);

  // Load selected token coin info when token is selected
  useEffect(() => {
    const loadSelectedTokenCoinInfo = async () => {
      if (!selectedToken || !tokenSheetVisible) return;

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
  }, [selectedToken, tokenSheetVisible, currency]);

  // Handle chart period change
  const handleChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setBitcoinChartPeriod(period);
  }, []);

  // Transform CoinInfo to MarketData for TokenMarketData component
  const bitcoinMarketData: MarketData | undefined = useMemo(() => {
    if (!bitcoinCoinInfo) return undefined;
    return coinInfoToMarketData(bitcoinCoinInfo);
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
  const handleSendPress = useCallback(() => {
    setSendSheetVisible(true);
  }, []);

  const handleReceivePress = useCallback(() => {
    setReceiveSheetVisible(true);
  }, []);

  const handleReceiveSheetClose = useCallback(() => {
    setReceiveSheetVisible(false);
  }, []);

  const handleSendSheetClose = useCallback(() => {
    setSendSheetVisible(false);
  }, []);

  const handleSendSuccess = useCallback((_txId: string) => {
    setSendSheetVisible(false);
    refresh();
  }, [refresh]);

  const handleReceiveSheetCopy = useCallback(async () => {
    if (activeBlockchainAccount) {
      const addr = activeBlockchainAccount.getReceiveAddress();
      await Clipboard.setStringAsync(addr);
      // TODO: Show toast notification
    }
  }, [activeBlockchainAccount]);

  const handleActivityPress = useCallback(() => {
    setTransactionHistoryVisible(true);
  }, []);

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

  const handleTransactionHistoryClose = useCallback(() => {
    setTransactionHistoryVisible(false);
  }, []);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    // Open transaction in Solana Explorer
    const explorerUrl = networkId === 'solana-devnet'
      ? `https://explorer.solana.com/tx/${transaction.id}?cluster=devnet`
      : `https://explorer.solana.com/tx/${transaction.id}`;
    // TODO: Open in browser or in-app browser
  }, [networkId]);

  // Handler for long press on transaction to open detail modal
  const handleTransactionLongPress = useCallback((transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  }, []);

  // Handler to close detail modal
  const handleDetailModalClose = useCallback(() => {
    setDetailModalVisible(false);
    // Clear selected transaction after animation
    setTimeout(() => {
      setSelectedTransaction(null);
    }, 300);
  }, []);

  // Handler to view transaction in explorer (from detail modal)
  const handleViewExplorer = useCallback((transaction: Transaction) => {
    const explorerUrl = networkId === 'solana-devnet'
      ? `https://solscan.io/tx/${transaction.id}?cluster=devnet`
      : `https://solscan.io/tx/${transaction.id}`;
    Linking.openURL(explorerUrl);
    handleDetailModalClose();
  }, [networkId, handleDetailModalClose]);

  // Handler to copy transaction hash (from detail modal)
  const handleCopyHash = useCallback(async (hash: string) => {
    await Clipboard.setStringAsync(hash);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Show toast notification
  }, []);

  // Handler to share transaction (from detail modal)
  const handleShareTransaction = useCallback(async (transaction: Transaction) => {
    const explorerUrl = networkId === 'solana-devnet'
      ? `https://solscan.io/tx/${transaction.id}?cluster=devnet`
      : `https://solscan.io/tx/${transaction.id}`;
    try {
      await Share.share({
        message: `Check out this transaction: ${explorerUrl}`,
        url: explorerUrl,
      });
    } catch (error) {
      console.error('Failed to share transaction:', error);
    }
  }, [networkId]);

  const handleSelectedTokenChartPeriodChange = useCallback((period: PriceChartPeriod) => {
    setSelectedTokenChartPeriod(period);
  }, []);

  const handleBlockchainChange = useCallback((blockchain: BlockchainId, index: number) => {
    setActiveBlockchainIndex(index);
    // Switch to the selected network
    const selectedBalance = blockchainBalances[index];
    if (selectedBalance) {
      const newNetworkId = selectedBalance.network.id;
      accountActions.changeNetwork(newNetworkId);
    }
  }, [blockchainBalances, accountActions]);

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Fade in when scrolled down, fade out when at top
    const opacity = Math.min(offsetY / 30, 1); // Fully visible after 30px scroll
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

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
        showNetworkLabel={developerNetworks}
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
    developerNetworks,
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
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  // No account state (only show if accounts array is empty)
  if (!activeAccount || !activeBlockchainAccount) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No account found</Text>
      </View>
    );
  }

  // address is already defined above for useTransactions hook

  return (
    <View style={styles.container}>
      {/* Fixed Header: Balance Card + Action Buttons */}
      {FixedHeaderComponent}

      {/* Sub-account selector — only visible with 2+ derived accounts */}
      <SubAccountSelector
        accounts={subAccounts}
        activeIndex={pathIndex}
        onSelect={handleSubAccountChange}
        pendingIndex={pendingSubAccountIndex}
        style={styles.subAccountSelector}
      />

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
            tokens={switchingSubAccount ? [] : tokenListItems}
            loading={switchingSubAccount || (loading && tokenListItems.length === 0)}
            onTokenPress={handleTokenPress}
            hiddenBalance={hiddenBalance}
            ListEmptyComponent={ListEmptyComponent}
            refreshing={refreshing}
            onRefresh={refresh}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
            blockchain={getBlockchainFromNetworkId(currentBlockchain)}
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

      {/* Token Information Sheet */}
      {selectedToken && (
        <TokenInformationSheet
          visible={tokenSheetVisible}
          onClose={handleTokenSheetClose}
          token={selectedToken}
          blockchain={getBlockchainFromNetworkId(currentBlockchain)}
          chartData={selectedTokenChartData}
          chartPeriod={selectedTokenChartPeriod}
          onChartPeriodChange={handleSelectedTokenChartPeriodChange}
          coinInfo={selectedTokenCoinInfo}
          marketData={selectedTokenMarketData}
          loading={selectedTokenLoading && selectedTokenChartData.length === 0}
        />
      )}

      {/* Receive Sheet */}
      <ReceiveSheet
        visible={receiveSheetVisible}
        onClose={handleReceiveSheetClose}
        address={address}
        onCopy={handleReceiveSheetCopy}
      />

      {/* Send Sheet */}
      <SendSheet
        visible={sendSheetVisible}
        onClose={handleSendSheetClose}
        tokens={tokens}
        blockchain={getBlockchainFromNetworkId(currentBlockchain)}
        account={activeBlockchainAccount}
        onSuccess={handleSendSuccess}
        showUnverifiedTokens={developerNetworks}
      />

      {/* Transaction History Sheet */}
      <TransactionHistorySheet
        visible={transactionHistoryVisible}
        onClose={handleTransactionHistoryClose}
        transactions={historyTransactions as Transaction[]}
        loading={transactionsLoading}
        loadingMore={transactionsLoadingMore}
        hasMore={transactionsHasMore}
        onLoadMore={transactionsLoadMore}
        hiddenBalance={hiddenBalance}
        onTransactionPress={handleTransactionPress}
        onTransactionLongPress={handleTransactionLongPress}
        error={transactionsError}
        onRetry={transactionsRefresh}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        onClose={handleDetailModalClose}
        transaction={selectedTransaction}
        onViewExplorer={handleViewExplorer}
        onCopyHash={handleCopyHash}
        onShare={handleShareTransaction}
        developerMode={developerNetworks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
  subAccountSelector: {
    marginBottom: vs(spacing.md),
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
