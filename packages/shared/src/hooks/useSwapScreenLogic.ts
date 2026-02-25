/**
 * useSwapScreenLogic — shared hook for SwapScreen (mobile & extension).
 *
 * Extracts all duplicated state, effects, computed values, and handlers
 * so that platform components only provide JSX + platform-specific alerts.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type {
  SwapScreenProps,
  SwapToken,
  SwapQuote,
  SwapScreenStep,
  SwapChainType,
  BridgeEstimateSimple,
  BridgeExchangeSimple,
} from '../types/swap';
import type { TokenSelectorToken } from '../types/ui/token-selector';
import type {
  BridgeChain,
  BridgeToken,
  BridgeEstimate,
} from '../types/ui/bridge-screen';
import { getSwapMode, validateAddress, getChainFromNetwork, toStealthExNetwork } from '../utils/swap';
import { getChainDisplayName } from '../utils/account';
import { KNOWN_DECIMALS, NATIVE_TOKEN_LOGOS } from '../utils/tokens';
import { isBlockchainEnabled } from '../config/blockchains';
import type { BlockchainType } from '../types/blockchain';

// ============================================================================
// Constants
// ============================================================================

const MIN_SWAP_USD = 1;
const QUOTE_DEBOUNCE_MS = 500;
const QUOTE_COUNTDOWN_SECONDS = 10;

// ============================================================================
// Hook options
// ============================================================================

export interface UseSwapScreenLogicOptions<StyleType = unknown> extends SwapScreenProps<StyleType> {
  /**
   * Platform-specific callback invoked when a bridge exchange is created.
   * Mobile uses Alert.alert; extension uses window.alert.
   */
  onBridgeInitiated?: (exchange: BridgeExchangeSimple, inAmount: string, inSymbol: string, outSymbol: string) => void;
}

// ============================================================================
// Return type
// ============================================================================

export interface UseSwapScreenLogicReturn {
  // State
  step: SwapScreenStep;
  inToken: SwapToken | null;
  outToken: SwapToken | null;
  inAmount: string;
  outAmount: string;
  quote: SwapQuote | null;
  bridgeEstimate: BridgeEstimateSimple | null;
  isLoadingQuote: boolean;
  isLoadingEstimate: boolean;
  isLoadingBridgeTokens: boolean;
  recipientAddress: string;
  addressError: string | null;
  isConfirming: boolean;
  showInTokenModal: boolean;
  showOutTokenModal: boolean;
  tokensLoading: boolean;
  successTxId: string | null;
  successExchange: BridgeExchangeSimple | null;
  depositTxId: string | null;

  // Computed
  swapMode: 'jupiter' | 'stealthex' | null;
  inUsdValue: number;
  canReview: boolean;
  reviewWarning: string | null;
  priceImpact: number | null;
  outputTokens: SwapToken[];
  addressValidation: { valid: boolean; error: string | null };

  // Modal token lists (with mint/uiAmount for TokenSelectorModal compat)
  modalInTokens: (SwapToken & { mint: string; uiAmount: number })[];
  modalFeaturedTokens: (SwapToken & { mint: string; uiAmount: number })[];
  modalOutTokens: (SwapToken & { mint: string; uiAmount: number; network?: string })[];

  // Bridge type conversions
  bridgeTargetChain: BridgeChain | null;
  bridgeInToken: BridgeToken | null;
  bridgeOutToken: BridgeToken | null;
  bridgeEstimateForReview: BridgeEstimate | null;

  // Setters
  setInAmount: (v: string) => void;
  setRecipientAddress: (v: string) => void;
  setShowInTokenModal: (v: boolean) => void;
  setShowOutTokenModal: (v: boolean) => void;

  // Handlers
  handleInTokenSelect: (token: SwapToken) => void;
  handleOutTokenSelect: (token: SwapToken) => void;
  handleInTokenModalSelect: (token: TokenSelectorToken) => void;
  handleOutTokenModalSelect: (token: TokenSelectorToken) => void;
  handleSearchTokens: ((query: string) => Promise<TokenSelectorToken[]>) | undefined;
  handleReview: () => void;
  handleContinueToReview: () => void;
  handleBackFromRecipient: () => void;
  handleBackFromReview: () => void;
  handleConfirmSwap: () => Promise<void>;
  handleConfirmBridge: () => Promise<void>;
  handleConfirmOrRefresh: () => Promise<void>;
  handleSuccessContinue: () => void;
  swapConfirmLabel: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useSwapScreenLogic<StyleType = unknown>({
  tokens,
  featuredTokens = [],
  loading = false,
  onGetQuote,
  onSwap,
  onSuccess,
  onError,
  onSearchTokens,
  initialInToken,
  initialOutToken,
  jupiterTokens = [],
  defaultRecipientAddress,
  // Bridge props
  onGetAvailableTokens,
  onGetBridgeEstimate,
  onCreateBridgeExchange,
  onBridgeSuccess,
  onBridgeError,
  onSendDeposit,
  onRefreshBalances,
  // Platform-specific
  onBridgeInitiated: _onBridgeInitiated,
  onNavigateHome,
}: UseSwapScreenLogicOptions<StyleType>): UseSwapScreenLogicReturn {
  // ── State ──────────────────────────────────────────────────────────────

  const [step, setStep] = useState<SwapScreenStep>('input');
  const [inToken, setInToken] = useState<SwapToken | null>(initialInToken || tokens[0] || null);
  const [outToken, setOutToken] = useState<SwapToken | null>(initialOutToken || null);
  const [availableOutTokens, setAvailableOutTokens] = useState<SwapToken[]>([]);
  const [inAmount, setInAmount] = useState('');
  const [outAmount, setOutAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bridgeEstimate, setBridgeEstimate] = useState<BridgeEstimateSimple | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientAddress || '');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successTxId, setSuccessTxId] = useState<string | null>(null);
  const [successExchange, setSuccessExchange] = useState<BridgeExchangeSimple | null>(null);
  const [depositTxId, setDepositTxId] = useState<string | null>(null);
  const [showInTokenModal, setShowInTokenModal] = useState(false);
  const [showOutTokenModal, setShowOutTokenModal] = useState(false);
  const [isLoadingBridgeTokens, setIsLoadingBridgeTokens] = useState(false);

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, setCountdown] = useState(QUOTE_COUNTDOWN_SECONDS);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────

  const swapMode = useMemo(() => getSwapMode(inToken, outToken), [inToken, outToken]);

  const inTokenPrice = tokens.find(t => t.address === inToken?.address)?.usdPrice ?? inToken?.usdPrice;
  const inUsdValue = inTokenPrice && inAmount
    ? parseFloat(inAmount) * inTokenPrice
    : 0;

  const targetChain: SwapChainType | null = outToken?.chain || null;
  const addressValidation = validateAddress(recipientAddress, targetChain);

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

  const canContinueToBridge =
    swapMode === 'stealthex' &&
    !!inToken &&
    !!outToken &&
    !!inAmount &&
    parseFloat(inAmount) > 0 &&
    parseFloat(inAmount) <= (inToken.balance || Infinity) &&
    !isLoadingEstimate &&
    !quoteError &&
    !!bridgeEstimate &&
    (!bridgeEstimate.minAmount || parseFloat(inAmount) >= bridgeEstimate.minAmount);

  const canReview = canReviewJupiter || canContinueToBridge;

  const reviewWarning: string | null = (() => {
    if (!inToken || !inAmount || parseFloat(inAmount) <= 0) return null;
    if (parseFloat(inAmount) > (inToken.balance || 0)) return 'Insufficient balance';
    if (inUsdValue > 0 && inUsdValue < MIN_SWAP_USD) return `Minimum swap amount is $${MIN_SWAP_USD.toFixed(2)} USD`;
    if (quoteError) return quoteError;
    if (quote?.custom?.priceImpact != null && quote.custom.priceImpact > 3)
      return 'High price impact! You may receive significantly less than expected.';
    return null;
  })();

  const priceImpact: number | null = quote?.custom?.priceImpact ?? null;

  // ── Effects ────────────────────────────────────────────────────────────

  // Load available output tokens when input token changes (for bridge)
  useEffect(() => {
    if (!inToken || !onGetAvailableTokens) return;

    const loadBridgeTokens = async () => {
      setIsLoadingBridgeTokens(true);
      try {
        const available = await onGetAvailableTokens(inToken.symbol);
        const bridgeOutputTokens: SwapToken[] = [];
        for (const t of available) {
          const chain = getChainFromNetwork(t.network, t.symbol);
          if (!chain || !isBlockchainEnabled(chain as BlockchainType)) continue;
          bridgeOutputTokens.push({
            address: t.symbol,
            symbol: t.symbol,
            name: t.name,
            decimals: KNOWN_DECIMALS[t.symbol.toLowerCase()] ?? 8,
            logo: t.logo || NATIVE_TOKEN_LOGOS[t.symbol.toLowerCase()],
            chain,
            networkId: t.network,
          });
        }
        setAvailableOutTokens(bridgeOutputTokens);
      } catch (error) {
        console.error('Failed to load bridge tokens:', error);
        setAvailableOutTokens([]);
      } finally {
        setIsLoadingBridgeTokens(false);
      }
    };

    loadBridgeTokens();
  }, [inToken, onGetAvailableTokens]);

  // Stabilize callback refs
  const onGetQuoteRef = useRef(onGetQuote);
  onGetQuoteRef.current = onGetQuote;
  const onGetBridgeEstimateRef = useRef(onGetBridgeEstimate);
  onGetBridgeEstimateRef.current = onGetBridgeEstimate;

  // Fetch quote/estimate when input changes
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);

    setOutAmount('');
    setQuote(null);
    setBridgeEstimate(null);
    setQuoteError(null);

    if (!inToken || !outToken || !inAmount || parseFloat(inAmount) <= 0) return;

    const mode = getSwapMode(inToken, outToken);

    if (mode === 'jupiter') {
      setIsLoadingQuote(true);
      quoteTimerRef.current = setTimeout(async () => {
        try {
          const fetchedQuote = await onGetQuoteRef.current(inToken, outToken, inAmount);
          setQuote(fetchedQuote);
          const outDecimals = fetchedQuote.output?.decimals ?? outToken.decimals;
          setOutAmount((Number(fetchedQuote.output.amount) / (10 ** outDecimals)).toString());
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
      setIsLoadingEstimate(true);
      quoteTimerRef.current = setTimeout(async () => {
        try {
          const estimate = await onGetBridgeEstimateRef.current!(
            inToken.symbol,
            outToken.symbol,
            parseFloat(inAmount),
            toStealthExNetwork(inToken.networkId || inToken.chain),
            toStealthExNetwork(outToken.networkId || outToken.chain)
          );
          if (estimate) {
            setBridgeEstimate(estimate);
            setOutAmount(estimate.estimatedAmount.toString());
          } else {
            setQuoteError('Failed to get swap estimate');
          }
        } catch (error) {
          console.warn('Failed to fetch estimate:', error);
          const message = error instanceof Error ? error.message : 'Failed to get swap estimate';
          setQuoteError(message);
          setOutAmount('');
        } finally {
          setIsLoadingEstimate(false);
        }
      }, QUOTE_DEBOUNCE_MS);
    }

    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    };
  }, [inToken, outToken, inAmount]);

  // ── Countdown helpers ──────────────────────────────────────────────────

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdownInterval();
    setCountdown(QUOTE_COUNTDOWN_SECONDS);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdownInterval]);

  // Start/stop countdown based on review step and confirming state
  useEffect(() => {
    if (step === 'review' && !isConfirming) {
      startCountdown();
    } else {
      clearCountdownInterval();
      if (step !== 'review') {
        setCountdown(QUOTE_COUNTDOWN_SECONDS);
      }
    }
    return clearCountdownInterval;
  }, [step, isConfirming, startCountdown, clearCountdownInterval]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleInTokenSelect = useCallback((token: SwapToken) => {
    setInToken(token);
    setShowInTokenModal(false);
    if (outToken?.address === token.address && outToken?.chain === token.chain) {
      setOutToken(null);
    }
    setInAmount('');
    setOutAmount('');
    setQuote(null);
    setBridgeEstimate(null);
  }, [outToken]);

  const handleOutTokenSelect = useCallback((token: SwapToken) => {
    setOutToken(token);
    setShowOutTokenModal(false);
    if (inToken?.address === token.address && inToken?.chain === token.chain) {
      setInToken(null);
    }
  }, [inToken]);

  // Modal-level handlers: convert TokenSelectorToken → SwapToken and delegate
  const handleInTokenModalSelect = useCallback((token: TokenSelectorToken) => {
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
  }, [tokens, handleInTokenSelect]);

  const handleReview = useCallback(() => {
    if (swapMode === 'jupiter' && quote) {
      setStep('review');
    } else if (swapMode === 'stealthex') {
      setStep('recipient');
    }
  }, [swapMode, quote]);

  const handleContinueToReview = useCallback(() => {
    if (addressValidation.valid) {
      setAddressError(null);
      setStep('review');
    } else {
      setAddressError(addressValidation.error || 'Invalid address');
    }
  }, [addressValidation]);

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

  const handleConfirmSwap = useCallback(async () => {
    if (!quote) return;

    setIsConfirming(true);
    try {
      const result = await onSwap(quote);
      setSuccessTxId(result.txId);
      setStep('success');
      onSuccess?.(result.txId);
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

  const handleConfirmBridge = useCallback(async () => {
    if (!inToken || !outToken || !inAmount || !recipientAddress || !onCreateBridgeExchange) return;

    setIsConfirming(true);
    try {
      const exchange = await onCreateBridgeExchange(
        inToken.symbol,
        outToken.symbol,
        parseFloat(inAmount),
        recipientAddress,
        toStealthExNetwork(inToken.networkId || inToken.chain),
        toStealthExNetwork(outToken.networkId || outToken.chain)
      );

      if (exchange) {
        // Send deposit to the exchange's deposit address
        if (onSendDeposit && exchange.depositAddress) {
          const { txId } = await onSendDeposit(
            exchange.depositAddress,
            inToken.address,
            parseFloat(inAmount)
          );
          setDepositTxId(txId);
        }
        setSuccessExchange(exchange);
        setStep('success');
        onBridgeSuccess?.(exchange);
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
  }, [inToken, outToken, inAmount, recipientAddress, onCreateBridgeExchange, onSendDeposit, onBridgeSuccess, onBridgeError]);

  const handleRefreshQuote = useCallback(async () => {
    if (isLoadingQuote || isLoadingEstimate) return;
    if (!inToken || !outToken || !inAmount || parseFloat(inAmount) <= 0) return;

    const mode = getSwapMode(inToken, outToken);
    if (mode === 'jupiter') {
      setIsLoadingQuote(true);
      try {
        const fetchedQuote = await onGetQuoteRef.current(inToken, outToken, inAmount);
        setQuote(fetchedQuote);
        const outDecimals = fetchedQuote.output?.decimals ?? outToken.decimals;
        setOutAmount((Number(fetchedQuote.output.amount) / (10 ** outDecimals)).toString());
        setQuoteError(null);
      } catch (error) {
        console.error('Failed to refresh quote:', error);
        setQuoteError('Failed to refresh quote');
      } finally {
        setIsLoadingQuote(false);
      }
    } else if (mode === 'stealthex' && onGetBridgeEstimateRef.current) {
      setIsLoadingEstimate(true);
      try {
        const estimate = await onGetBridgeEstimateRef.current!(
          inToken.symbol, outToken.symbol, parseFloat(inAmount),
          toStealthExNetwork(inToken.networkId || inToken.chain),
          toStealthExNetwork(outToken.networkId || outToken.chain)
        );
        if (estimate) {
          setBridgeEstimate(estimate);
          setOutAmount(estimate.estimatedAmount.toString());
        }
      } catch (error) {
        console.warn('Failed to refresh estimate:', error);
      } finally {
        setIsLoadingEstimate(false);
      }
    }
    startCountdown();
  }, [isLoadingQuote, isLoadingEstimate, inToken, outToken, inAmount, startCountdown]);

  const swapConfirmLabel = useMemo(() => {
    if (countdown <= 0) return 'Refresh Quote';
    return `Confirm (${countdown})`;
  }, [countdown]);

  const handleConfirmOrRefresh = useCallback(async () => {
    if (countdown <= 0) {
      await handleRefreshQuote();
    } else if (swapMode === 'stealthex') {
      await handleConfirmBridge();
    } else {
      await handleConfirmSwap();
    }
  }, [countdown, swapMode, handleRefreshQuote, handleConfirmBridge, handleConfirmSwap]);

  const handleSuccessContinue = useCallback(() => {
    setStep('input');
    setInAmount('');
    setOutAmount('');
    setQuote(null);
    setRecipientAddress('');
    setBridgeEstimate(null);
    setSuccessTxId(null);
    setSuccessExchange(null);
    setDepositTxId(null);
    onRefreshBalances?.();
    onNavigateHome?.();
  }, [onRefreshBalances, onNavigateHome]);

  // ── Derived / memoised ─────────────────────────────────────────────────

  const outputTokens = useMemo(() => {
    if (!inToken) return tokens;

    const inChain = inToken.chain || 'solana';

    if (inChain === 'solana') {
      // 1. User's Solana balance tokens first (they have balance/price data)
      const userSolanaTokens = tokens.filter(t => (t.chain || 'solana') === 'solana');
      const userAddresses = new Set(userSolanaTokens.map(t => t.address.toLowerCase()));

      // 2. Jupiter catalog tokens not already in user's list
      const remainingJupiter = jupiterTokens.filter(t => !userAddresses.has(t.address.toLowerCase()));

      // 3. Only cross-chain bridge tokens (exclude Solana — Jupiter covers those)
      const crossChainBridgeTokens = availableOutTokens.filter(t => t.chain !== 'solana');

      return [...crossChainBridgeTokens, ...userSolanaTokens, ...remainingJupiter];
    } else {
      return availableOutTokens;
    }
  }, [inToken, tokens, jupiterTokens, availableOutTokens]);

  // Modal-level handler for output token (needs outputTokens, so defined after it)
  const handleOutTokenModalSelect = useCallback((token: TokenSelectorToken) => {
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
  }, [outputTokens, handleOutTokenSelect]);

  // Search wrapper: converts SwapToken[] → TokenSelectorToken[]
  const handleSearchTokens = onSearchTokens
    ? async (query: string): Promise<TokenSelectorToken[]> => {
        const results = await onSearchTokens(query);
        return results.map((t) => ({
          ...t,
          mint: t.address,
          uiAmount: t.balance || 0,
        }));
      }
    : undefined;

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

  // ── Return ─────────────────────────────────────────────────────────────

  return {
    step,
    inToken,
    outToken,
    inAmount,
    outAmount,
    quote,
    bridgeEstimate,
    isLoadingQuote,
    isLoadingEstimate,
    isLoadingBridgeTokens,
    recipientAddress,
    addressError,
    isConfirming,
    showInTokenModal,
    showOutTokenModal,
    tokensLoading: loading,
    successTxId,
    successExchange,
    depositTxId,

    swapMode,
    inUsdValue,
    canReview,
    reviewWarning,
    priceImpact,
    outputTokens,
    addressValidation,

    modalInTokens,
    modalFeaturedTokens,
    modalOutTokens,

    bridgeTargetChain,
    bridgeInToken,
    bridgeOutToken,
    bridgeEstimateForReview,

    setInAmount,
    setRecipientAddress,
    setShowInTokenModal,
    setShowOutTokenModal,

    handleInTokenSelect,
    handleOutTokenSelect,
    handleInTokenModalSelect,
    handleOutTokenModalSelect,
    handleSearchTokens,
    handleReview,
    handleContinueToReview,
    handleBackFromRecipient,
    handleBackFromReview,
    handleConfirmSwap,
    handleConfirmBridge,
    handleConfirmOrRefresh,
    handleSuccessContinue,
    swapConfirmLabel,
  };
}
