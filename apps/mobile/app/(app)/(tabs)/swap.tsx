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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useAccountsContext,
  useMultiChainTokens,
  useSwap,
  useBridge,
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
    networkId: 'solana-mainnet',
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
 * Updated for Jupiter Ultra v1 API structure
 */
function transformQuoteForUI(
  quote: SharedSwapQuote,
  inToken: SwapToken,
  outToken: SwapToken,
  inputAmount: number
): SwapQuote {
  const outputDecimals = quote.output?.decimals ?? outToken.decimals;
  const expectedOutput = getExpectedOutput(quote, outputDecimals);
  const minimumOutput = getMinimumOutput(quote, outputDecimals);
  const priceImpact = getPriceImpact(quote);

  // Extract route labels from routeNames (backend provides this directly)
  const routeLabels = quote.routeNames || [];

  // Get fee info from backend calculation
  const totalFeeAmount = quote.fee?.amount || 0;

  return {
    requestId: quote.custom?.requestId || '',
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
      percent: quote.fee?.percent || 0.5, // Use backend fee or default to 0.5%
      symbol: quote.fee?.symbol || 'SOL',
      decimals: quote.fee?.decimals || 9,
    },
    details: {
      router: quote.custom?.router || routeLabels[0] || 'Jupiter',
      priceImpact,
      priorityFee: quote.custom?.prioritizationFeeLamports || 0,
      rentFee: quote.custom?.rentFeeLamports || 0,
      slippageBps: quote.custom?.slippageBps || 50,
      minimumReceived: minimumOutput,
      swapMode: quote.custom?.swapMode || 'ExactIn',
      gasless: quote.custom?.gasless || false,
      feeBps: quote.custom?.feeBps || 50,
      inUsdValue: quote.custom?.inUsdValue ?? (inputAmount * (inToken.usdPrice || 0)),
      outUsdValue: quote.custom?.outUsdValue ?? (expectedOutput * (outToken.usdPrice || 0)),
    },
    transaction: quote.custom?.transaction || '',
    routeNames: routeLabels,
    routeSymbols: quote.routeSymbols || [inToken.symbol, outToken.symbol],
  };
}

export default function SwapScreenPage() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Store the current quote from useSwap for execution
  const currentSharedQuoteRef = useRef<SharedSwapQuote | null>(null);

  // Get account state and actions from shared context
  const [accountState] = useAccountsContext();
  const {
    ready,
    activeAccount,
    activeBlockchainAccount,
    networkId,
  } = accountState;

  // Convert networkId to SwapNetworkId format
  const swapNetworkId: SwapNetworkId = useMemo(() => {
    return networkId === 'solana-devnet' ? 'solana-devnet' : 'solana-mainnet';
  }, [networkId]);

  // Initialize useSwap hook with proper typing
  const {
    getQuote: getSwapQuote,
    executeSwap: executeSwapHook,
    quote: swapQuote,
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

    // Verify hook's internal quote matches the displayed quote to prevent race conditions
    // The hook's executeSwap() uses its own internal state, which could diverge from the ref
    if (!swapQuote || swapQuote.custom?.requestId !== currentSharedQuoteRef.current.custom?.requestId) {
      Alert.alert('Quote Expired', 'The quote has changed. Please try again.');
      return { txId: '' };
    }

    // Execute the swap using the real hook
    const result = await executeSwapHook();

    if (result.status === 'fail') {
      throw new Error(result.error || 'Swap execution failed');
    }

    // Clear the stored quote after successful execution
    currentSharedQuoteRef.current = null;

    return { txId: result.txId || '' };
  }, [activeBlockchainAccount, executeSwapHook, swapQuote]);

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
    const network = networkId === 'solana-devnet' ? 'solana-devnet' : 'solana-mainnet';
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
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // No account state
  if (!activeAccount || !activeBlockchainAccount) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No account found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Swap Content */}
      <View style={[styles.contentContainer, { marginTop: insets.top + componentSizes.headerHeight }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
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
});
