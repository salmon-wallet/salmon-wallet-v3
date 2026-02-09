import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { colors, spacing, vs, s, ms } from '@salmon/shared';
import { SwapInputScreen } from './SwapInputScreen';
import { SwapReviewScreen } from './SwapReviewScreen';
import { TokenSelectorModal } from '../TokenSelector';
import { ScalesBackground } from '../ScalesBackground';
import { BridgeRecipientScreen } from '../BridgeScreen/BridgeRecipientScreen';
import { BridgeReviewScreen } from '../BridgeScreen/BridgeReviewScreen';
import type {
  SwapScreenProps,
  SwapToken,
  SwapQuote,
  SwapStep,
  SwapChainType,
  BridgeEstimateSimple,
} from './types';
import type { BridgeChain, BridgeToken, BridgeEstimate } from '../BridgeScreen/types';

// Minimum swap amount in USD
const MIN_SWAP_USD = 1;

// Debounce delay for quote fetching (ms)
const QUOTE_DEBOUNCE_MS = 500;

/**
 * Determines if a swap should use Jupiter (same-chain Solana) or StealthEX (cross-chain)
 */
function getSwapMode(inToken: SwapToken | null, outToken: SwapToken | null): 'jupiter' | 'stealthex' | null {
  if (!inToken || !outToken) return null;

  const inChain = inToken.chain || 'solana';
  const outChain = outToken.chain || 'solana';

  // Same chain Solana = Jupiter
  if (inChain === 'solana' && outChain === 'solana') {
    return 'jupiter';
  }

  // Cross-chain or non-Solana = StealthEX
  return 'stealthex';
}

/**
 * Simple address validation based on chain type
 */
function validateAddress(address: string, chain: SwapChainType | null): { valid: boolean; error: string | null } {
  if (!address || address.length === 0) {
    return { valid: false, error: null };
  }

  // Solana addresses (base58, typically 32-44 characters)
  if (chain === 'solana') {
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Solana address' };
  }

  // Ethereum/EVM addresses (0x prefix, 40 hex chars)
  if (chain === 'ethereum') {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Ethereum address' };
  }

  // Bitcoin addresses (various formats)
  if (chain === 'bitcoin') {
    const isValid = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Bitcoin address' };
  }

  // Default: allow any non-empty address
  return { valid: address.length > 10, error: address.length <= 10 ? 'Address too short' : null };
}

const FONT_FAMILY = {
  medium: 'DMSansMedium',
} as const;

/**
 * SwapScreen - Unified swap/bridge interface
 *
 * Automatically detects whether to use:
 * - Jupiter: for same-chain Solana swaps
 * - StealthEX: for cross-chain bridges
 *
 * No tabs needed - the system detects based on selected tokens.
 */
export const SwapScreen: React.FC<SwapScreenProps> = ({
  tokens,
  featuredTokens = [],
  onGetQuote,
  onSwap,
  onSuccess,
  onError,
  onSearchTokens,
  initialInToken,
  initialOutToken,
  style,
  // Bridge props
  bridgeTokens,
  bridgeFeaturedTokens,
  onGetAvailableTokens,
  onGetBridgeEstimate,
  onCreateBridgeExchange,
  onBridgeSuccess,
  onBridgeError,
  onSearchBridgeTokens,
}) => {
  // Step state - unified flow
  // 'input' -> 'recipient' (bridge only) -> 'review' -> 'processing' -> 'success/error'
  const [step, setStep] = useState<SwapStep | 'recipient'>('input');

  // Token selection
  const [inToken, setInToken] = useState<SwapToken | null>(initialInToken || tokens[0] || null);
  const [outToken, setOutToken] = useState<SwapToken | null>(initialOutToken || null);

  // Available output tokens (for bridge mode)
  const [availableOutTokens, setAvailableOutTokens] = useState<SwapToken[]>([]);
  const [isLoadingOutTokens, setIsLoadingOutTokens] = useState(false);

  // Amount state
  const [inAmount, setInAmount] = useState('');
  const [outAmount, setOutAmount] = useState('');

  // Quote state (Jupiter)
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Bridge estimate state (StealthEX)
  const [bridgeEstimate, setBridgeEstimate] = useState<BridgeEstimateSimple | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Recipient state (for bridge)
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Confirming state
  const [isConfirming, setIsConfirming] = useState(false);

  // Modal state
  const [showInTokenModal, setShowInTokenModal] = useState(false);
  const [showOutTokenModal, setShowOutTokenModal] = useState(false);

  // Debounce timer ref
  const quoteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine swap mode based on selected tokens
  const swapMode = useMemo(() => getSwapMode(inToken, outToken), [inToken, outToken]);

  // Calculate USD value of input
  const inUsdValue = inToken?.usdPrice && inAmount
    ? parseFloat(inAmount) * inToken.usdPrice
    : 0;

  // Target chain for address validation
  const targetChain: SwapChainType | null = outToken?.chain || null;

  // Validate recipient address
  const addressValidation = validateAddress(recipientAddress, targetChain);

  // Check if can review (Jupiter mode)
  const canReviewJupiter =
    swapMode === 'jupiter' &&
    !!inToken &&
    !!outToken &&
    !!inAmount &&
    parseFloat(inAmount) > 0 &&
    parseFloat(inAmount) <= (inToken.balance || 0) &&
    inUsdValue >= MIN_SWAP_USD &&
    !isLoadingQuote &&
    !quoteError &&
    !!quote;

  // Check if can continue to recipient (StealthEX mode)
  const canContinueToBridge =
    swapMode === 'stealthex' &&
    !!inToken &&
    !!outToken &&
    !!inAmount &&
    parseFloat(inAmount) > 0 &&
    parseFloat(inAmount) <= (inToken.balance || Infinity) &&
    (!bridgeEstimate?.minAmount || parseFloat(inAmount) >= bridgeEstimate.minAmount) &&
    !isLoadingEstimate;

  // Combined can review
  const canReview = canReviewJupiter || canContinueToBridge;

  // Load available output tokens when input token changes (for bridge)
  useEffect(() => {
    if (!inToken || !onGetAvailableTokens) {
      return;
    }

    const inChain = inToken.chain || 'solana';

    // For Solana input, we might want to show both Solana tokens (Jupiter) and bridge tokens
    // For non-Solana input, only bridge tokens are available
    const loadBridgeTokens = async () => {
      setIsLoadingOutTokens(true);
      try {
        const available = await onGetAvailableTokens(inToken.symbol);
        // Convert to SwapToken format with chain info
        const bridgeOutputTokens: SwapToken[] = available.map((t) => ({
          address: t.symbol, // StealthEX uses symbols
          symbol: t.symbol,
          name: t.name,
          decimals: 8, // Default for bridge
          logo: t.logo,
          chain: getChainFromNetwork(t.network),
          networkId: t.network,
        }));
        setAvailableOutTokens(bridgeOutputTokens);
      } catch (error) {
        console.error('Failed to load bridge tokens:', error);
        setAvailableOutTokens([]);
      } finally {
        setIsLoadingOutTokens(false);
      }
    };

    loadBridgeTokens();
  }, [inToken, onGetAvailableTokens]);

  // Fetch quote/estimate when input changes
  useEffect(() => {
    // Clear previous timer
    if (quoteTimerRef.current) {
      clearTimeout(quoteTimerRef.current);
    }

    // Reset states
    setOutAmount('');
    setQuote(null);
    setBridgeEstimate(null);
    setQuoteError(null);

    // Validate inputs
    if (!inToken || !outToken || !inAmount || parseFloat(inAmount) <= 0) {
      return;
    }

    const mode = getSwapMode(inToken, outToken);

    if (mode === 'jupiter') {
      // Fetch Jupiter quote
      setIsLoadingQuote(true);
      quoteTimerRef.current = setTimeout(async () => {
        try {
          const fetchedQuote = await onGetQuote(inToken, outToken, inAmount);
          setQuote(fetchedQuote);
          setOutAmount(fetchedQuote.output.amount.toString());
          setQuoteError(null);
        } catch (error) {
          console.error('Failed to fetch quote:', error);
          setQuoteError('Failed to fetch quote');
          setOutAmount('');
        } finally {
          setIsLoadingQuote(false);
        }
      }, QUOTE_DEBOUNCE_MS);
    } else if (mode === 'stealthex' && onGetBridgeEstimate) {
      // Fetch StealthEX estimate
      setIsLoadingEstimate(true);
      quoteTimerRef.current = setTimeout(async () => {
        try {
          const estimate = await onGetBridgeEstimate(
            inToken.symbol,
            outToken.symbol,
            parseFloat(inAmount)
          );
          if (estimate) {
            setBridgeEstimate(estimate);
            setOutAmount(estimate.estimatedAmount.toString());
          }
        } catch (error) {
          console.error('Failed to fetch estimate:', error);
          setOutAmount('');
        } finally {
          setIsLoadingEstimate(false);
        }
      }, QUOTE_DEBOUNCE_MS);
    }

    return () => {
      if (quoteTimerRef.current) {
        clearTimeout(quoteTimerRef.current);
      }
    };
  }, [inToken, outToken, inAmount, onGetQuote, onGetBridgeEstimate]);

  // Handle input token selection
  const handleInTokenSelect = useCallback((token: SwapToken) => {
    setInToken(token);
    setShowInTokenModal(false);
    // Reset output if same as input
    if (outToken?.address === token.address && outToken?.chain === token.chain) {
      setOutToken(null);
    }
    // Reset amount and states
    setInAmount('');
    setOutAmount('');
    setQuote(null);
    setBridgeEstimate(null);
  }, [outToken]);

  // Handle output token selection
  const handleOutTokenSelect = useCallback((token: SwapToken) => {
    setOutToken(token);
    setShowOutTokenModal(false);
    // Reset if same as input
    if (inToken?.address === token.address && inToken?.chain === token.chain) {
      setInToken(null);
    }
  }, [inToken]);

  // Handle review button press
  const handleReview = useCallback(() => {
    if (swapMode === 'jupiter' && quote) {
      setStep('review');
    } else if (swapMode === 'stealthex') {
      // Bridge needs recipient address first
      setStep('recipient');
    }
  }, [swapMode, quote]);

  // Handle continue to review from recipient
  const handleContinueToReview = useCallback(() => {
    if (addressValidation.valid) {
      setAddressError(null);
      setStep('review');
    } else {
      setAddressError(addressValidation.error || 'Invalid address');
    }
  }, [addressValidation]);

  // Handle back navigation
  const handleBackFromRecipient = useCallback(() => {
    setStep('input');
  }, []);

  const handleBackFromReview = useCallback(() => {
    if (swapMode === 'stealthex') {
      setStep('recipient');
    } else {
      setStep('input');
    }
  }, [swapMode]);

  // Handle confirm (Jupiter swap)
  const handleConfirmSwap = useCallback(async () => {
    if (!quote) return;

    setIsConfirming(true);
    try {
      const result = await onSwap(quote);
      setStep('success');
      onSuccess?.(result.txId);

      // Reset state after success
      setTimeout(() => {
        setStep('input');
        setInAmount('');
        setOutAmount('');
        setQuote(null);
      }, 2000);
    } catch (error) {
      console.error('Swap failed:', error);
      setStep('error');
      onError?.(error as Error);

      setTimeout(() => {
        setStep('input');
      }, 2000);
    } finally {
      setIsConfirming(false);
    }
  }, [quote, onSwap, onSuccess, onError]);

  // Handle confirm (StealthEX bridge)
  const handleConfirmBridge = useCallback(async () => {
    if (!inToken || !outToken || !inAmount || !recipientAddress || !onCreateBridgeExchange) return;

    setIsConfirming(true);
    try {
      const exchange = await onCreateBridgeExchange(
        inToken.symbol,
        outToken.symbol,
        parseFloat(inAmount),
        recipientAddress
      );

      if (exchange) {
        setStep('success');
        onBridgeSuccess?.(exchange);

        Alert.alert(
          'Bridge Initiated',
          `Please send ${inAmount} ${inToken.symbol} to:\n\n${exchange.depositAddress}\n\nYou will receive approximately ${exchange.amountOut} ${outToken.symbol}`,
          [{ text: 'OK' }]
        );

        setTimeout(() => {
          setStep('input');
          setInAmount('');
          setOutAmount('');
          setRecipientAddress('');
          setBridgeEstimate(null);
        }, 2000);
      } else {
        throw new Error('Failed to create bridge exchange');
      }
    } catch (error) {
      console.error('Bridge failed:', error);
      setStep('error');
      onBridgeError?.(error as Error);

      setTimeout(() => {
        setStep('input');
      }, 2000);
    } finally {
      setIsConfirming(false);
    }
  }, [inToken, outToken, inAmount, recipientAddress, onCreateBridgeExchange, onBridgeSuccess, onBridgeError]);

  // Build output tokens list based on input token
  const outputTokens = useMemo(() => {
    if (!inToken) return tokens;

    const inChain = inToken.chain || 'solana';

    if (inChain === 'solana') {
      // For Solana input: show Solana tokens + available bridge tokens
      const solanaTokens = tokens.filter(t => (t.chain || 'solana') === 'solana');
      // Merge with bridge tokens, avoiding duplicates
      const bridgeSymbols = new Set(availableOutTokens.map(t => t.symbol));
      const uniqueSolanaTokens = solanaTokens.filter(t => !bridgeSymbols.has(t.symbol));
      return [...uniqueSolanaTokens, ...availableOutTokens];
    } else {
      // For non-Solana input: only bridge tokens are available
      return availableOutTokens;
    }
  }, [inToken, tokens, availableOutTokens]);

  // Convert tokens for modal compatibility
  const modalInTokens = tokens.map((t) => ({
    ...t,
    mint: t.address,
    uiAmount: t.balance || 0,
  }));

  const modalFeaturedTokens = featuredTokens.map((t) => ({
    ...t,
    mint: t.address,
    uiAmount: t.balance || 0,
  }));

  const modalOutTokens = outputTokens.map((t) => ({
    ...t,
    mint: t.address,
    uiAmount: t.balance || 0,
    network: t.networkId || (t.chain === 'bitcoin' ? 'Bitcoin' : t.chain === 'ethereum' ? 'Ethereum' : undefined),
  }));

  // Bridge types for recipient/review screens
  const bridgeTargetChain: BridgeChain | null = outToken ? {
    id: outToken.networkId || outToken.chain || 'unknown',
    name: getChainDisplayName(outToken.chain),
    symbol: outToken.symbol,
    logo: outToken.logo,
  } : null;

  const bridgeInToken: BridgeToken | null = inToken ? {
    symbol: inToken.symbol,
    name: inToken.name || inToken.symbol,
    logo: inToken.logo,
    network: inToken.networkId,
    balance: inToken.balance,
    usdPrice: inToken.usdPrice,
  } : null;

  const bridgeOutToken: BridgeToken | null = outToken ? {
    symbol: outToken.symbol,
    name: outToken.name || outToken.symbol,
    logo: outToken.logo,
    network: outToken.networkId,
  } : null;

  const bridgeEstimateForReview: BridgeEstimate | null = bridgeEstimate ? {
    estimatedAmount: bridgeEstimate.estimatedAmount,
    minAmount: bridgeEstimate.minAmount,
    symbolIn: bridgeEstimate.symbolIn,
    symbolOut: bridgeEstimate.symbolOut,
  } : null;

  return (
    <View style={[styles.container, style]}>
      {/* Background */}
      <ScalesBackground style={styles.background} />

      {/* Input Screen */}
      {step === 'input' && (
        <SwapInputScreen
          inToken={inToken}
          outToken={outToken}
          inAmount={inAmount}
          outAmount={outAmount}
          onInAmountChange={setInAmount}
          onInTokenPress={() => setShowInTokenModal(true)}
          onOutTokenPress={() => setShowOutTokenModal(true)}
          inUsdValue={inUsdValue}
          isLoadingQuote={isLoadingQuote || isLoadingEstimate}
          canReview={canReview}
          onReview={handleReview}
        />
      )}

      {/* Recipient Screen (Bridge only) */}
      {step === 'recipient' && swapMode === 'stealthex' && (
        <BridgeRecipientScreen
          recipientAddress={recipientAddress}
          onAddressChange={setRecipientAddress}
          targetChain={bridgeTargetChain}
          onBack={handleBackFromRecipient}
          onContinue={handleContinueToReview}
          isValidAddress={addressValidation.valid}
          addressError={addressError}
        />
      )}

      {/* Review Screen (Jupiter) */}
      {step === 'review' && swapMode === 'jupiter' && quote && inToken && outToken && (
        <SwapReviewScreen
          quote={quote}
          inToken={inToken}
          outToken={outToken}
          onBack={handleBackFromReview}
          onConfirm={handleConfirmSwap}
          isConfirming={isConfirming}
        />
      )}

      {/* Review Screen (StealthEX) */}
      {step === 'review' && swapMode === 'stealthex' && bridgeInToken && bridgeOutToken && (
        <BridgeReviewScreen
          inToken={bridgeInToken}
          outToken={bridgeOutToken}
          inAmount={inAmount}
          outAmount={outAmount}
          recipientAddress={recipientAddress}
          estimate={bridgeEstimateForReview}
          onBack={handleBackFromReview}
          onConfirm={handleConfirmBridge}
          isConfirming={isConfirming}
        />
      )}

      {/* Input Token Selection Modal */}
      <TokenSelectorModal
        visible={showInTokenModal}
        onClose={() => setShowInTokenModal(false)}
        tokens={modalInTokens}
        featuredTokens={modalFeaturedTokens}
        onSelect={(token) => {
          const originalToken = tokens.find(
            (t) => t.address === (token.mint || token.address)
          );
          handleInTokenSelect({
            address: token.mint || token.address || '',
            symbol: token.symbol || '',
            name: token.name,
            decimals: originalToken?.decimals || 9,
            logo: token.logo,
            balance: token.uiAmount,
            usdPrice: originalToken?.usdPrice,
            chain: originalToken?.chain,
            networkId: originalToken?.networkId,
          });
        }}
        onSearch={onSearchTokens ? async (query) => {
          const results = await onSearchTokens(query);
          return results.map((t) => ({
            ...t,
            mint: t.address,
            uiAmount: t.balance || 0,
          }));
        } : undefined}
        showNetworkChip={true}
      />

      {/* Output Token Selection Modal */}
      <TokenSelectorModal
        visible={showOutTokenModal}
        onClose={() => setShowOutTokenModal(false)}
        tokens={modalOutTokens}
        onSelect={(token) => {
          const originalToken = outputTokens.find(
            (t) => t.address === (token.mint || token.address) || t.symbol === token.symbol
          );
          handleOutTokenSelect({
            address: token.mint || token.address || '',
            symbol: token.symbol || '',
            name: token.name,
            decimals: originalToken?.decimals || 9,
            logo: token.logo,
            balance: token.uiAmount,
            usdPrice: originalToken?.usdPrice,
            chain: originalToken?.chain,
            networkId: originalToken?.networkId || token.network,
          });
        }}
        showNetworkChip={true}
        hiddenBalance={swapMode === 'stealthex'}
      />
    </View>
  );
};

// Helper functions
function getChainFromNetwork(network?: string): SwapChainType {
  if (!network) return 'solana';
  const n = network.toLowerCase();
  if (n.includes('btc') || n.includes('bitcoin')) return 'bitcoin';
  if (n.includes('eth') || n.includes('ethereum')) return 'ethereum';
  if (n.includes('sol') || n.includes('solana')) return 'solana';
  return 'solana';
}

function getChainDisplayName(chain?: SwapChainType): string {
  switch (chain) {
    case 'bitcoin': return 'Bitcoin';
    case 'ethereum': return 'Ethereum';
    case 'solana':
    default: return 'Solana';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SwapScreen;
