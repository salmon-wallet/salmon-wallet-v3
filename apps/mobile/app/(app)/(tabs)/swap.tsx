/**
 * SwapScreen - Unified token swap and bridge interface
 *
 * Displays:
 * - WalletHeader: Account name, address, settings navigation
 * - SwapInputScreen: Multi-chain token selection and amount input
 * - SwapReviewScreen: Quote review and confirmation
 *
 * Features:
 * - Multi-chain support: tokens from Solana, Bitcoin, Ethereum
 * - Automatic mode detection:
 *   - Jupiter: Same-chain Solana swaps
 *   - StealthEX: Cross-chain bridges
 * - Real-time quote fetching
 * - Token selection with search and pagination
 * - Multi-step flow (input -> [recipient for bridge] -> review -> confirm)
 * - Transaction signing and execution
 */

import React, { useCallback, useMemo, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useAccountsContext,
  useMultiChainTokens,
  useSwap,
  useBridge,
  useUserConfig,
  colors,
  componentSizes,
  searchTokens,
  getExpectedOutput,
  getMinimumOutput,
  getPriceImpact,
  type TokenMetadata,
  type SolanaAccount,
  type SwapQuote as SharedSwapQuote,
  type SwapNetworkId,
  type UnifiedToken,
} from '@salmon/shared';
import {
  WalletHeader,
  SettingsSheet,
  WalletSwitcherSheet,
  ScalesBackground,
  SwapScreen,
  type SwapToken,
  type SwapQuote,
  type SwapChainType,
  type BridgeTokenSimple,
  type BridgeEstimateSimple,
  type BridgeExchangeSimple,
} from '@salmon/ui';

/**
 * Convert TokenMetadata to SwapToken (for search results)
 */
function mapToSwapToken(token: TokenMetadata, balance?: number, usdPrice?: number): SwapToken {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: token.logo || undefined,
    balance: balance || 0,
    usdPrice: usdPrice,
    chain: 'solana', // Search results are always Solana tokens
    networkId: 'mainnet-beta',
  };
}

/**
 * Convert UnifiedToken (from useMultiChainTokens) to SwapToken
 */
function unifiedToSwapToken(token: UnifiedToken): SwapToken {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: token.logo,
    balance: token.balance,
    usdPrice: token.usdPrice,
    chain: token.chain as SwapChainType,
    networkId: token.networkId,
  };
}

/**
 * Transform shared SwapQuote (from API) to UI SwapQuote format
 */
function transformQuoteForUI(
  quote: SharedSwapQuote,
  inToken: SwapToken,
  outToken: SwapToken,
  inputAmount: number
): SwapQuote {
  const outputDecimals = quote.outputToken?.decimals ?? outToken.decimals;
  const expectedOutput = getExpectedOutput(quote, outputDecimals);
  const minimumOutput = getMinimumOutput(quote, outputDecimals);
  const priceImpact = getPriceImpact(quote);

  // Extract route labels from route plan
  const routeLabels = quote.route.routePlan.map(leg => leg.swapInfo.label);

  // Calculate fee info - estimate based on route
  const totalFeeAmount = quote.route.routePlan.reduce(
    (sum, leg) => sum + Number(leg.swapInfo.feeAmount || 0),
    0
  );

  return {
    requestId: quote.requestId,
    input: {
      amount: inputAmount,
      symbol: inToken.symbol,
      decimals: inToken.decimals,
      name: inToken.name,
      logo: inToken.logo,
      contract: inToken.address,
    },
    output: {
      amount: expectedOutput,
      symbol: outToken.symbol,
      decimals: outToken.decimals,
      name: outToken.name,
      logo: outToken.logo,
      contract: outToken.address,
    },
    fee: {
      amount: totalFeeAmount,
      percent: 0.5, // Default fee percentage
      symbol: 'SOL',
      decimals: 9,
    },
    details: {
      router: routeLabels[0] || 'Jupiter',
      priceImpact,
      priorityFee: 0, // Will be determined by API
      rentFee: 0, // Will be determined by API
      slippageBps: quote.route.slippageBps,
      minimumReceived: minimumOutput,
      swapMode: quote.route.swapMode,
      gasless: false,
      feeBps: 50,
      inUsdValue: inputAmount * (inToken.usdPrice || 0),
      outUsdValue: expectedOutput * (outToken.usdPrice || 0),
    },
    transaction: quote.swapTransaction,
    routeNames: routeLabels,
    routeSymbols: [inToken.symbol, outToken.symbol],
  };
}

export default function SwapScreenPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Settings sheet visibility
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Wallet switcher sheet visibility
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);

  // Store the current quote from useSwap for execution
  const currentSharedQuoteRef = useRef<SharedSwapQuote | null>(null);

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

  // Get user config (developer mode)
  const { developerNetworks } = useUserConfig({ skip: !ready });

  // Convert networkId to SwapNetworkId format
  const swapNetworkId: SwapNetworkId = useMemo(() => {
    return networkId === 'devnet' ? 'solana-devnet' : 'solana-mainnet';
  }, [networkId]);

  // Initialize useSwap hook with proper typing
  const {
    getQuote: getSwapQuote,
    executeSwap: executeSwapHook,
    status: swapStatus,
    error: swapError,
    reset: resetSwap,
  } = useSwap({
    account: activeBlockchainAccount as SolanaAccount | undefined,
    networkId: swapNetworkId,
  });

  // Initialize useBridge hook
  const {
    getSupportedTokens,
    getAvailableTokens: getBridgeAvailableTokens,
    getEstimate: getBridgeEstimate,
    createExchange: createBridgeExchange,
    reset: resetBridge,
  } = useBridge();

  // Get multi-chain tokens (SOL, BTC, ETH) from all user accounts
  const {
    tokens: multiChainTokens,
    featuredTokens: topTokens,
    loading,
  } = useMultiChainTokens({
    activeAccount,
    skip: !ready || !activeAccount,
  });

  // Convert unified tokens to SwapToken format (with chain info for auto-detection)
  const swapTokens: SwapToken[] = useMemo(() => {
    return multiChainTokens.map(unifiedToSwapToken);
  }, [multiChainTokens]);

  // Featured tokens (top 5 by USD value across all chains)
  const featuredTokens: SwapToken[] = useMemo(() => {
    return topTokens.map(unifiedToSwapToken);
  }, [topTokens]);

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

  const handleSettingsClose = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  const handleSettingsNavigate = useCallback((screen: string) => {
    setSettingsVisible(false);
    router.push(`/(app)/settings/${screen}` as any);
  }, [router]);

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
    router.push('/(auth)');
  }, [router]);

  const handleEditAccount = useCallback((id: string) => {
    setWalletSwitcherVisible(false);
    router.push({
      pathname: '/(app)/settings/account-edit',
      params: { id },
    } as any);
  }, [router]);

  const handleDeleteAccount = useCallback(async (id: string) => {
    await accountActions.removeAccount(id);
  }, [accountActions]);

  // Swap handlers - Now using real useSwap hook
  const handleGetQuote = useCallback(async (
    inToken: SwapToken,
    outToken: SwapToken,
    amount: string
  ): Promise<SwapQuote> => {
    if (!activeBlockchainAccount) {
      throw new Error('No active account');
    }

    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      throw new Error('Invalid amount');
    }

    // Get quote using the real swap hook
    const quote = await getSwapQuote({
      inputMint: inToken.address,
      outputMint: outToken.address,
      amount: inputAmount,
      inputDecimals: inToken.decimals,
      slippageBps: 50, // 0.5% default slippage
    });

    if (!quote) {
      throw new Error(swapError || 'Failed to get swap quote. No route found.');
    }

    // Store the shared quote for later execution
    currentSharedQuoteRef.current = quote;

    // Transform to UI format
    return transformQuoteForUI(quote, inToken, outToken, inputAmount);
  }, [activeBlockchainAccount, getSwapQuote, swapError]);

  const handleSwap = useCallback(async (quote: SwapQuote): Promise<{ txId: string }> => {
    if (!activeBlockchainAccount) {
      throw new Error('No active account');
    }

    if (!currentSharedQuoteRef.current) {
      throw new Error('No quote available. Please get a quote first.');
    }

    // Execute the swap using the real hook
    const result = await executeSwapHook();

    if (result.status === 'fail') {
      throw new Error(result.error || 'Swap execution failed');
    }

    // Clear the stored quote after successful execution
    currentSharedQuoteRef.current = null;

    return { txId: result.txId || '' };
  }, [activeBlockchainAccount, executeSwapHook]);

  const handleSwapSuccess = useCallback((txId: string) => {
    // Reset swap state
    resetSwap();

    Alert.alert(
      t('swap.success_title', 'Swap Complete'),
      t('swap.success_message', 'Your swap was successful!'),
      [{ text: 'OK' }]
    );
  }, [t, resetSwap]);

  const handleSwapError = useCallback((error: Error) => {
    // Reset swap state
    resetSwap();

    Alert.alert(
      t('swap.error_title', 'Swap Failed'),
      error.message || t('swap.error_message', 'Something went wrong'),
      [{ text: 'OK' }]
    );
  }, [t, resetSwap]);

  const handleSearchTokens = useCallback(async (query: string): Promise<SwapToken[]> => {
    const network = networkId === 'devnet' ? 'solana-devnet' : 'solana-mainnet';
    try {
      const results = await searchTokens(query, network);
      return results.map((token) => mapToSwapToken(token));
    } catch (error) {
      console.error('Token search failed:', error);
      return [];
    }
  }, [networkId]);

  // Bridge handlers - convert multi-chain tokens to bridge format
  const bridgeTokens: BridgeTokenSimple[] = useMemo(() => {
    return multiChainTokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      network: token.chain, // Now includes actual chain (solana, bitcoin, ethereum)
      balance: token.balance,
      usdPrice: token.usdPrice,
    }));
  }, [multiChainTokens]);

  const bridgeFeaturedTokens: BridgeTokenSimple[] = useMemo(() => {
    return topTokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      network: token.chain,
      balance: token.balance,
      usdPrice: token.usdPrice,
    }));
  }, [topTokens]);

  const handleGetAvailableTokens = useCallback(async (sourceSymbol: string): Promise<BridgeTokenSimple[]> => {
    try {
      const tokens = await getBridgeAvailableTokens(sourceSymbol);
      if (!tokens) return [];
      return tokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        logo: t.image,
        network: t.network,
      }));
    } catch (error) {
      console.error('Failed to get available bridge tokens:', error);
      return [];
    }
  }, [getBridgeAvailableTokens]);

  const handleGetBridgeEstimate = useCallback(async (
    symbolIn: string,
    symbolOut: string,
    amount: number
  ): Promise<BridgeEstimateSimple | null> => {
    try {
      const estimate = await getBridgeEstimate(symbolIn, symbolOut, amount);
      if (!estimate) return null;
      return {
        estimatedAmount: estimate.estimatedAmount,
        minAmount: estimate.minAmount,
        symbolIn: estimate.symbolIn,
        symbolOut: estimate.symbolOut,
      };
    } catch (error) {
      console.error('Failed to get bridge estimate:', error);
      return null;
    }
  }, [getBridgeEstimate]);

  const handleCreateBridgeExchange = useCallback(async (
    symbolIn: string,
    symbolOut: string,
    amount: number,
    addressTo: string
  ): Promise<BridgeExchangeSimple | null> => {
    try {
      const exchange = await createBridgeExchange(symbolIn, symbolOut, amount, addressTo);
      if (!exchange) return null;
      return {
        id: exchange.id,
        depositAddress: exchange.payinAddress,
        amountIn: exchange.amountExpectedFrom,
        amountOut: exchange.amountExpectedTo,
        symbolIn: exchange.currencyFrom,
        symbolOut: exchange.currencyTo,
        addressTo: exchange.payoutAddress,
        status: exchange.status,
      };
    } catch (error) {
      console.error('Failed to create bridge exchange:', error);
      return null;
    }
  }, [createBridgeExchange]);

  const handleBridgeSuccess = useCallback((exchange: BridgeExchangeSimple) => {
    resetBridge();
    Alert.alert(
      t('bridge.success_title', 'Bridge Initiated'),
      t('bridge.success_message', 'Please send funds to the deposit address shown.'),
      [{ text: 'OK' }]
    );
  }, [t, resetBridge]);

  const handleBridgeError = useCallback((error: Error) => {
    resetBridge();
    Alert.alert(
      t('bridge.error_title', 'Bridge Failed'),
      error.message || t('bridge.error_message', 'Something went wrong'),
      [{ text: 'OK' }]
    );
  }, [t, resetBridge]);

  // Loading state
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // No account state
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

      {/* Solid background for status bar area */}
      <View style={styles.solidBackground} />

      {/* Scales pattern background */}
      <ScalesBackground topOffset={insets.top + componentSizes.headerHeight} />

      {/* Swap Content */}
      <View style={styles.contentContainer}>
        <SwapScreen
          tokens={swapTokens}
          featuredTokens={featuredTokens}
          onGetQuote={handleGetQuote}
          onSwap={handleSwap}
          onSuccess={handleSwapSuccess}
          onError={handleSwapError}
          onSearchTokens={handleSearchTokens}
          initialInToken={swapTokens[0]}
          // Bridge props
          bridgeTokens={bridgeTokens}
          bridgeFeaturedTokens={bridgeFeaturedTokens}
          onGetAvailableTokens={handleGetAvailableTokens}
          onGetBridgeEstimate={handleGetBridgeEstimate}
          onCreateBridgeExchange={handleCreateBridgeExchange}
          onBridgeSuccess={handleBridgeSuccess}
          onBridgeError={handleBridgeError}
        />
      </View>

      {/* Header - Absolutely positioned above content */}
      <WalletHeader
        accountName={accountName}
        address={address}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={handleSettingsPress}
        onWalletPress={handleWalletPress}
        developerMode={developerNetworks}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={handleSettingsClose}
        onNavigate={handleSettingsNavigate}
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
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    marginTop: componentSizes.headerHeight,
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
});
