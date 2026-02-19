import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  ms,
  vs,
  s,
  useSendTransaction,
} from '@salmon/shared';
import { ContentCopySvgIcon } from '../Icon/SvgIcons';
import { BlurContainer } from '../BlurContainer';
import { TokenLogo } from '../TokenLogo';
import type { StepConfirmationProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  semiBold: 'DMSansSemiBold',
  bold: 'DMSansBold',
  extraBold: 'DMSansExtraBold',
} as const;

const BUTTON_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.64,
  shadowRadius: 12,
  elevation: 8,
} as const;

// ============================================================================
// Component
// ============================================================================

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  token,
  recipientAddress,
  amount,
  blockchain,
  account,
  onBack,
  onCancel,
  onSuccess,
}) => {
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sendHook = useSendTransaction({ account, blockchain });

  // Amount display
  const amountDisplay = useMemo(() => {
    const numAmount = parseFloat(amount);
    return `${Number(numAmount.toFixed(6))} ${token.symbol}`;
  }, [amount, token.symbol]);

  // Estimate fee on mount
  useEffect(() => {
    const doEstimate = async () => {
      const result = await sendHook.estimateFee({
        token: {
          address: token.address,
          decimals: token.decimals ?? 9,
          symbol: token.symbol,
        },
        recipientAddress,
        amount: parseFloat(amount),
      });
      if (result) {
        setEstimatedFee(result.fee);
      }
    };
    doEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only: estimate fee once with initial values
  }, []);

  // Handle confirm press
  const handleConfirm = useCallback(async () => {
    try {
      const result = await sendHook.sendTransaction({
        token: {
          address: token.address,
          decimals: token.decimals ?? 9,
          symbol: token.symbol,
        },
        recipientAddress,
        amount: parseFloat(amount),
      });
      onSuccess(result.txId);
    } catch {
      // Error is captured by the hook's error state
    }
  }, [sendHook, token, recipientAddress, amount, onSuccess]);

  // Handle copy address
  const handleCopy = useCallback(async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(recipientAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [recipientAddress]);

  // Handle retry
  const handleRetry = useCallback(() => {
    sendHook.reset();
  }, [sendHook]);

  const isSending = sendHook.status === 'creating' || sendHook.status === 'sending';
  const isFailed = sendHook.status === 'failed';

  // Truncate address for display
  const truncatedAddress = useMemo(() => {
    if (recipientAddress.length <= 20) return recipientAddress;
    return recipientAddress;
  }, [recipientAddress]);

  return (
    <View style={styles.container}>
      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Large Token Icon */}
        <View style={styles.tokenIconWrapper}>
          <TokenLogo uri={token.logo || undefined} symbol={token.symbol} size={ms(100)} />
        </View>

        {/* Amount */}
        <Text style={styles.amountText}>{amountDisplay}</Text>

        {/* Recipient Address */}
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          accessibilityLabel="Copy recipient address"
        >
          <BlurContainer style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
              {truncatedAddress}
            </Text>
            <ContentCopySvgIcon
              size={ms(20)}
              color={copied ? colors.status.success : colors.text.secondary}
            />
          </BlurContainer>
        </TouchableOpacity>

        {/* Fee Display */}
        {estimatedFee && (
          <Text style={styles.feeText}>
            Network Fee: ~{estimatedFee}
          </Text>
        )}

        {/* Error Message */}
        {isFailed && sendHook.error && (
          <Text style={styles.errorText}>{sendHook.error}</Text>
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={isFailed ? onBack : onCancel}
          activeOpacity={0.7}
          disabled={isSending}
        >
          <Text style={styles.cancelButtonText}>
            {isFailed ? 'CANCEL' : 'CANCEL'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isSending && styles.confirmButtonDisabled]}
          onPress={isFailed ? handleRetry : handleConfirm}
          activeOpacity={0.7}
          disabled={isSending}
        >
          <LinearGradient
            colors={['#FF5C45', '#A12A2AE6']}
            style={styles.confirmButtonGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.4 }}
          >
            {isSending ? (
              <View style={styles.sendingRow}>
                <ActivityIndicator size="small" color={colors.text.primary} />
                <Text style={styles.confirmButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>
                {isFailed ? 'RETRY' : 'CONFIRM'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(18),
  },
  // Token Icon
  tokenIconWrapper: {
    marginBottom: vs(16),
  },
  // Amount
  amountText: {
    fontSize: ms(22),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(24),
  },
  // Address
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: ms(8),
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    gap: s(10),
  },
  addressText: {
    flex: 1,
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
  },
  // Fee
  feeText: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
    marginTop: vs(14),
    textAlign: 'center',
  },
  // Error
  errorText: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.medium,
    color: colors.status.error,
    marginTop: vs(12),
    textAlign: 'center',
  },
  // Bottom Buttons
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: s(18),
    paddingBottom: vs(34),
    paddingTop: vs(12),
    gap: s(12),
  },
  cancelButton: {
    flex: 1,
    height: vs(48),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    backgroundColor: '#1f232f',
    alignItems: 'center',
    justifyContent: 'center',
    ...BUTTON_SHADOW,
  },
  cancelButtonText: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    height: vs(48),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    overflow: 'hidden',
    ...BUTTON_SHADOW,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
});

export default StepConfirmation;
