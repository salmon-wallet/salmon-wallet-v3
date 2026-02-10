/**
 * SwapScreen - Unified swap/bridge interface
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Replaces RN Alert with window.alert, uses web TokenSelectorModal.
 *
 * Automatically detects whether to use:
 * - Jupiter: for same-chain Solana swaps
 * - StealthEX: for cross-chain bridges
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { colors } from '@salmon/shared';
import { SwapInputScreen } from './SwapInputScreen';
import { SwapReviewScreen } from './SwapReviewScreen';
import { BridgeRecipientScreen } from '../BridgeScreen/BridgeRecipientScreen';
import { BridgeReviewScreen } from '../BridgeScreen/BridgeReviewScreen';
import { TokenSelectorModal } from '../TokenSelector';
import { ScalesBackground } from '../ScalesBackground';
import type { BridgeChain, BridgeToken, BridgeEstimate } from '../BridgeScreen/types';
import type {
  SwapScreenProps,
  SwapToken,
  SwapQuote,
  SwapStep,
  SwapChainType,
  BridgeEstimateSimple,
} from './types';

// Minimum swap amount in USD
const MIN_SWAP_USD = 1;

// Debounce delay for quote fetching (ms)
const QUOTE_DEBOUNCE_MS = 500;

const KNOWN_DECIMALS: Record<string, number> = { btc: 8, eth: 18, sol: 9, usdc: 6, usdt: 6, near: 24 };

/**
 * Determines if a swap should use Jupiter (same-chain Solana) or StealthEX (cross-chain)
 */
function getSwapMode(inToken: SwapToken | null, outToken: SwapToken | null): 'jupiter' | 'stealthex' | null {
  if (!inToken || !outToken) return null;

  const inChain = inToken.chain;
  const outChain = outToken.chain;
  if (!inChain || !outChain) return null;

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

/**
 * Get chain type from network name
 */
function getChainFromNetwork(network?: string): SwapChainType {
  if (!network) return 'solana';
  const n = network.toLowerCase();
  if (n.includes('btc') || n.includes('bitcoin')) return 'bitcoin';
  if (n.includes('eth') || n.includes('ethereum')) return 'ethereum';
  if (n.includes('sol') || n.includes('solana')) return 'solana';
  return 'solana';
}

/**
 * Get display name for a chain type
 */
function getChainDisplayName(chain?: SwapChainType): string {
  switch (chain) {
    case 'bitcoin': return 'Bitcoin';
    case 'ethereum': return 'Ethereum';
    case 'solana':
    default: return 'Solana';
  }
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  backgroundColor: colors.background.secondary,
  position: 'relative',
  overflow: 'hidden',
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
});

// ============================================================================
// SwapScreen Component
// ============================================================================

export function SwapScreen({
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
}: SwapScreenProps): React.ReactElement {
  // Step state - unified flow
  const [step, setStep] = useState<SwapStep>('input');

  // Token selection
  const [inToken, setInToken] = useState<SwapToken | null>(initialInToken || tokens[0] || null);
  const [outToken, setOutToken] = useState<SwapToken | null>(initialOutToken || null);

  // Available output tokens (for bridge mode)
  const [availableOutTokens, setAvailableOutTokens] = useState<SwapToken[]>([]);

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

  // Confirming state
  const [isConfirming, setIsConfirming] = useState(false);

  // Modal state
  const [showInTokenModal, setShowInTokenModal] = useState(false);
  const [showOutTokenModal, setShowOutTokenModal] = useState(false);

  // Recipient state (for bridge)
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Debounce timer ref
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine swap mode based on selected tokens
  const swapMode = useMemo(() => getSwapMode(inToken, outToken), [inToken, outToken]);

  // Address validation for bridge target chain
  const targetChain: SwapChainType | null = outToken?.chain || null;
  const addressValidation = validateAddress(recipientAddress, targetChain);

  // Calculate USD value of input
  const inUsdValue = inToken?.usdPrice && inAmount
    ? parseFloat(inAmount) * inToken.usdPrice
    : 0;

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

  // Check if can continue to bridge (StealthEX mode)
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

    const loadBridgeTokens = async () => {
      try {
        const available = await onGetAvailableTokens(inToken.symbol);
        // Convert to SwapToken format with chain info
        const bridgeOutputTokens: SwapToken[] = available.map((t) => ({
          address: t.symbol, // StealthEX uses symbols
          symbol: t.symbol,
          name: t.name,
          decimals: KNOWN_DECIMALS[t.symbol.toLowerCase()] ?? 8,
          logo: t.logo,
          chain: getChainFromNetwork(t.network),
          networkId: t.network,
        }));
        setAvailableOutTokens(bridgeOutputTokens);
      } catch (error) {
        console.error('Failed to load bridge tokens:', error);
        setAvailableOutTokens([]);
      }
    };

    loadBridgeTokens();
  }, [inToken, onGetAvailableTokens]);

  // Stabilize callback refs to avoid re-triggering the quote effect
  const onGetQuoteRef = useRef(onGetQuote);
  onGetQuoteRef.current = onGetQuote;
  const onGetBridgeEstimateRef = useRef(onGetBridgeEstimate);
  onGetBridgeEstimateRef.current = onGetBridgeEstimate;

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
          const fetchedQuote = await onGetQuoteRef.current(inToken, outToken, inAmount);
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
    } else if (mode === 'stealthex' && onGetBridgeEstimateRef.current) {
      // Fetch StealthEX estimate
      setIsLoadingEstimate(true);
      quoteTimerRef.current = setTimeout(async () => {
        try {
          const estimate = await onGetBridgeEstimateRef.current!(
            inToken.symbol,
            outToken.symbol,
            parseFloat(inAmount)
          );
          if (estimate) {
            setBridgeEstimate(estimate);
            setOutAmount(estimate.estimatedAmount.toString());
          } else {
            setQuoteError('Failed to get swap estimate');
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
  }, [inToken, outToken, inAmount]);

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
      setStep('recipient');
    }
  }, [swapMode, quote]);

  // Handle continue from recipient to review (bridge)
  const handleContinueToReview = useCallback(() => {
    if (addressValidation.valid) {
      setAddressError(null);
      setStep('review');
    } else {
      setAddressError(addressValidation.error || 'Invalid address');
    }
  }, [addressValidation]);

  // Handle back from recipient to input (bridge)
  const handleBackFromRecipient = useCallback(() => {
    setStep('input');
  }, []);

  // Handle back from review
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
        window.alert(
          `Swap Initiated!\n\nPlease send ${inAmount} ${inToken.symbol} to:\n${exchange.depositAddress}\n\nYou will receive approximately ${exchange.amountOut} ${outToken.symbol}`
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
      const solanaSymbols = new Set(solanaTokens.map(t => t.symbol.toLowerCase()));
      const uniqueBridgeTokens = availableOutTokens.filter(t => !solanaSymbols.has(t.symbol.toLowerCase()));
      return [...solanaTokens, ...uniqueBridgeTokens];
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

  // Bridge type conversions for BridgeRecipientScreen and BridgeReviewScreen
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
    <Container style={style}>
      {/* Background */}
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

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
    </Container>
  );
}

export default SwapScreen;
