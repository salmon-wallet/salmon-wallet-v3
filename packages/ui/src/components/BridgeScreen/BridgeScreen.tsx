import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { colors, spacing, s } from '@salmon/shared';
import { BridgeInputScreen } from './BridgeInputScreen';
import { BridgeRecipientScreen } from './BridgeRecipientScreen';
import { BridgeReviewScreen } from './BridgeReviewScreen';
import { TokenSelectorModal } from '../TokenSelector';
import { ScalesBackground } from '../ScalesBackground';
import type {
  BridgeScreenProps,
  BridgeToken,
  BridgeEstimate,
  BridgeStep,
  BridgeChain,
} from './types';

// Debounce delay for estimate fetching (ms)
const ESTIMATE_DEBOUNCE_MS = 500;

/**
 * Simple address validation based on chain type
 * Returns true if address appears valid for the target chain
 */
function validateAddress(address: string, chain: BridgeChain | null): { valid: boolean; error: string | null } {
  if (!address || address.length === 0) {
    return { valid: false, error: null };
  }

  // Basic validation based on chain
  const chainId = chain?.id?.toLowerCase() || '';

  // Solana addresses (base58, typically 32-44 characters)
  if (chainId.includes('sol')) {
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Solana address' };
  }

  // Ethereum/EVM addresses (0x prefix, 40 hex chars)
  if (chainId.includes('eth') || chainId.includes('evm') || chainId.includes('polygon') || chainId.includes('bsc') || chainId.includes('arb') || chainId.includes('avax')) {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Ethereum address' };
  }

  // Bitcoin addresses (various formats)
  if (chainId.includes('btc') || chainId.includes('bitcoin')) {
    // Legacy (1...), SegWit (3...), Native SegWit (bc1...)
    const isValid = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Bitcoin address' };
  }

  // Default: allow any non-empty address for unknown chains
  return { valid: address.length > 10, error: address.length <= 10 ? 'Address too short' : null };
}

/**
 * BridgeScreen - Main bridge interface component
 * Handles the complete bridge flow: token selection, amount input, recipient, and confirmation
 */
export const BridgeScreen: React.FC<BridgeScreenProps> = ({
  tokens,
  featuredTokens = [],
  onGetAvailableTokens,
  onGetEstimate,
  onCreateExchange,
  onSuccess,
  onError,
  onSearchTokens,
  initialInToken,
  style,
}) => {
  // Step state
  const [step, setStep] = useState<BridgeStep>('input');

  // Token selection
  const [inToken, setInToken] = useState<BridgeToken | null>(initialInToken || tokens[0] || null);
  const [outToken, setOutToken] = useState<BridgeToken | null>(null);

  // Available destination tokens
  const [availableOutTokens, setAvailableOutTokens] = useState<BridgeToken[]>([]);
  const [isLoadingOutTokens, setIsLoadingOutTokens] = useState(false);

  // Amount state
  const [inAmount, setInAmount] = useState('');
  const [outAmount, setOutAmount] = useState('');

  // Estimate state
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Recipient state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Confirming state
  const [isConfirming, setIsConfirming] = useState(false);

  // Modal state
  const [showInTokenModal, setShowInTokenModal] = useState(false);
  const [showOutTokenModal, setShowOutTokenModal] = useState(false);

  // Debounce timer ref
  const estimateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Target chain derived from output token
  const targetChain: BridgeChain | null = outToken ? {
    id: outToken.network || 'unknown',
    name: outToken.network || 'Unknown',
    symbol: outToken.symbol,
    logo: outToken.logo,
  } : null;

  // Calculate USD value of input
  const inUsdValue = inToken?.usdPrice && inAmount
    ? parseFloat(inAmount) * inToken.usdPrice
    : 0;

  // Validate recipient address
  const addressValidation = validateAddress(recipientAddress, targetChain);

  // Check if can continue from input step
  const canContinue =
    !!inToken &&
    !!outToken &&
    !!inAmount &&
    parseFloat(inAmount) > 0 &&
    parseFloat(inAmount) <= (inToken.balance || Infinity) &&
    (!estimate?.minAmount || parseFloat(inAmount) >= estimate.minAmount) &&
    !isLoadingEstimate;

  // Load available destination tokens when source token changes
  useEffect(() => {
    if (!inToken) {
      setAvailableOutTokens([]);
      setOutToken(null);
      return;
    }

    const loadAvailableTokens = async () => {
      setIsLoadingOutTokens(true);
      try {
        const available = await onGetAvailableTokens(inToken.symbol);
        setAvailableOutTokens(available);
        // Reset output token if it's no longer available
        if (outToken && !available.find(t => t.symbol === outToken.symbol)) {
          setOutToken(null);
        }
      } catch (error) {
        console.error('Failed to load available tokens:', error);
        setAvailableOutTokens([]);
      } finally {
        setIsLoadingOutTokens(false);
      }
    };

    loadAvailableTokens();
  }, [inToken, onGetAvailableTokens]);

  // Fetch estimate when input changes
  useEffect(() => {
    // Clear previous timer
    if (estimateTimerRef.current) {
      clearTimeout(estimateTimerRef.current);
    }

    // Reset estimate state
    setOutAmount('');
    setEstimate(null);

    // Validate inputs
    if (!inToken || !outToken || !inAmount || parseFloat(inAmount) <= 0) {
      return;
    }

    // Debounce estimate fetch
    setIsLoadingEstimate(true);
    estimateTimerRef.current = setTimeout(async () => {
      try {
        const fetchedEstimate = await onGetEstimate(
          inToken.symbol,
          outToken.symbol,
          parseFloat(inAmount)
        );
        if (fetchedEstimate) {
          setEstimate(fetchedEstimate);
          setOutAmount(fetchedEstimate.estimatedAmount.toString());
        }
      } catch (error) {
        console.error('Failed to fetch estimate:', error);
        setOutAmount('');
      } finally {
        setIsLoadingEstimate(false);
      }
    }, ESTIMATE_DEBOUNCE_MS);

    return () => {
      if (estimateTimerRef.current) {
        clearTimeout(estimateTimerRef.current);
      }
    };
  }, [inToken, outToken, inAmount, onGetEstimate]);

  // Handle input token selection
  const handleInTokenSelect = useCallback((token: BridgeToken) => {
    setInToken(token);
    setShowInTokenModal(false);
    // Reset output token and amount when changing source
    setOutToken(null);
    setInAmount('');
    setOutAmount('');
    setEstimate(null);
  }, []);

  // Handle output token selection
  const handleOutTokenSelect = useCallback((token: BridgeToken) => {
    setOutToken(token);
    setShowOutTokenModal(false);
  }, []);

  // Handle continue from input to recipient
  const handleContinueToRecipient = useCallback(() => {
    if (canContinue) {
      setStep('recipient');
    }
  }, [canContinue]);

  // Handle continue from recipient to review
  const handleContinueToReview = useCallback(() => {
    if (addressValidation.valid) {
      setAddressError(null);
      setStep('review');
    } else {
      setAddressError(addressValidation.error || 'Invalid address');
    }
  }, [addressValidation]);

  // Handle recipient address change
  const handleAddressChange = useCallback((address: string) => {
    setRecipientAddress(address);
    // Clear error on change
    setAddressError(null);
  }, []);

  // Handle back navigation
  const handleBackFromRecipient = useCallback(() => {
    setStep('input');
  }, []);

  const handleBackFromReview = useCallback(() => {
    setStep('recipient');
  }, []);

  // Handle confirm bridge
  const handleConfirm = useCallback(async () => {
    if (!inToken || !outToken || !inAmount || !recipientAddress) return;

    setIsConfirming(true);
    try {
      const exchange = await onCreateExchange(
        inToken.symbol,
        outToken.symbol,
        parseFloat(inAmount),
        recipientAddress
      );

      if (exchange) {
        setStep('success');
        onSuccess?.(exchange);

        // Show deposit address to user
        Alert.alert(
          'Bridge Initiated',
          `Please send ${inAmount} ${inToken.symbol} to:\n\n${exchange.depositAddress}\n\nYou will receive approximately ${exchange.amountOut} ${outToken.symbol} at ${recipientAddress.slice(0, 8)}...`,
          [{ text: 'OK' }]
        );

        // Reset state after success
        setTimeout(() => {
          setStep('input');
          setInAmount('');
          setOutAmount('');
          setRecipientAddress('');
          setEstimate(null);
        }, 2000);
      } else {
        throw new Error('Failed to create bridge exchange');
      }
    } catch (error) {
      console.error('Bridge failed:', error);
      setStep('error');
      onError?.(error as Error);

      // Reset to input after error
      setTimeout(() => {
        setStep('input');
      }, 2000);
    } finally {
      setIsConfirming(false);
    }
  }, [inToken, outToken, inAmount, recipientAddress, onCreateExchange, onSuccess, onError]);

  // Convert tokens for modal compatibility
  const modalInTokens = tokens.map((t) => ({
    ...t,
    mint: t.symbol, // Use symbol as identifier for bridge tokens
    address: t.symbol,
    uiAmount: t.balance || 0,
  }));

  const modalFeaturedTokens = featuredTokens.map((t) => ({
    ...t,
    mint: t.symbol,
    address: t.symbol,
    uiAmount: t.balance || 0,
  }));

  const modalOutTokens = availableOutTokens.map((t) => ({
    ...t,
    mint: t.symbol,
    address: t.symbol,
    uiAmount: 0, // Available tokens don't have balance
    network: t.network,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Background */}
      <ScalesBackground style={styles.background} />

      {/* Content based on step */}
      {step === 'input' && (
        <BridgeInputScreen
          inToken={inToken}
          outToken={outToken}
          inAmount={inAmount}
          outAmount={outAmount}
          onInAmountChange={setInAmount}
          onInTokenPress={() => setShowInTokenModal(true)}
          onOutTokenPress={() => setShowOutTokenModal(true)}
          inUsdValue={inUsdValue}
          isLoadingEstimate={isLoadingEstimate}
          minAmount={estimate?.minAmount}
          canContinue={canContinue}
          onContinue={handleContinueToRecipient}
        />
      )}

      {step === 'recipient' && (
        <BridgeRecipientScreen
          recipientAddress={recipientAddress}
          onAddressChange={handleAddressChange}
          targetChain={targetChain}
          onBack={handleBackFromRecipient}
          onContinue={handleContinueToReview}
          isValidAddress={addressValidation.valid}
          addressError={addressError}
        />
      )}

      {step === 'review' && inToken && outToken && (
        <BridgeReviewScreen
          inToken={inToken}
          outToken={outToken}
          inAmount={inAmount}
          outAmount={outAmount}
          recipientAddress={recipientAddress}
          estimate={estimate}
          onBack={handleBackFromReview}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
        />
      )}

      {/* Source Token Selection Modal */}
      <TokenSelectorModal
        visible={showInTokenModal}
        onClose={() => setShowInTokenModal(false)}
        tokens={modalInTokens}
        featuredTokens={modalFeaturedTokens}
        onSelect={(token) => {
          const originalToken = tokens.find((t) => t.symbol === token.symbol);
          handleInTokenSelect({
            symbol: token.symbol || '',
            name: token.name || '',
            logo: token.logo,
            network: originalToken?.network,
            balance: token.uiAmount,
            usdPrice: originalToken?.usdPrice,
          });
        }}
        onSearch={onSearchTokens ? async (query) => {
          const results = await onSearchTokens(query);
          return results.map((t) => ({
            ...t,
            mint: t.symbol,
            address: t.symbol,
            uiAmount: t.balance || 0,
          }));
        } : undefined}
      />

      {/* Destination Token Selection Modal */}
      <TokenSelectorModal
        visible={showOutTokenModal}
        onClose={() => setShowOutTokenModal(false)}
        tokens={modalOutTokens}
        onSelect={(token) => {
          const originalToken = availableOutTokens.find((t) => t.symbol === token.symbol);
          handleOutTokenSelect({
            symbol: token.symbol || '',
            name: token.name || '',
            logo: token.logo,
            network: originalToken?.network || token.network,
          });
        }}
        showNetworkChip={true}
        hiddenBalance={true}
      />
    </View>
  );
};

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

export default BridgeScreen;
