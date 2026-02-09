import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, borderWidth, ms, vs, s } from '@salmon/shared';
import type { SwapAmountInputProps } from './types';

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  light: 'DMSansLight',
  bold: 'DMSansBold',
  black: 'DMSansBlack',
} as const;

/**
 * Format a number to display with appropriate decimals
 */
const formatBalance = (value: number | undefined, decimals = 10): string => {
  if (value === undefined || value === null) return '0';
  if (value === 0) return '0';
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Format USD value
 */
const formatUsd = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.0000';
  return value.toFixed(4);
};

/**
 * SwapAmountInput - Input field for swap amounts with token selector
 */
export const SwapAmountInput: React.FC<SwapAmountInputProps> = ({
  label,
  value,
  onChangeValue,
  token,
  onTokenPress,
  usdValue,
  availableBalance,
  editable = true,
  placeholder = 'Enter an amount',
  style,
  isLoading = false,
}) => {
  const handleChangeText = useCallback(
    (text: string) => {
      // Allow only valid numeric input with decimal
      const sanitized = text.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = sanitized.split('.');
      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
      onChangeValue(formatted);
    },
    [onChangeValue]
  );

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input Row */}
      <View style={styles.inputContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.text.secondary} />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.text.placeholder}
            keyboardType="decimal-pad"
            editable={editable}
          />
        )}

        {/* Token Dropdown */}
        <TouchableOpacity
          style={styles.tokenDropdown}
          onPress={onTokenPress}
          activeOpacity={0.7}
        >
          {token?.logo ? (
            <Image source={{ uri: token.logo }} style={styles.tokenIcon} />
          ) : (
            <View style={[styles.tokenIcon, styles.tokenIconPlaceholder]} />
          )}
          <Text style={styles.tokenSymbol}>{token?.symbol || 'Select'}</Text>
        </TouchableOpacity>
      </View>

      {/* USD Value and Balance Row */}
      {(usdValue !== undefined || availableBalance !== undefined) && (
        <View style={styles.infoRow}>
          <Text style={styles.usdValue}>{formatUsd(usdValue)} USD</Text>
          {availableBalance !== undefined && token && (
            <Text style={styles.availableBalance}>
              Available: {formatBalance(availableBalance)} {token.symbol}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: vs(spacing.sm),
  },
  label: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    letterSpacing: 0.02,
    lineHeight: ms(18),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: borderWidth.tokenListItem,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    height: vs(58),
    paddingHorizontal: s(spacing.md),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: ms(16),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    paddingVertical: 0,
    height: '100%',
  },
  tokenDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a384e',
    borderRadius: borderRadius.sm + 2,
    paddingHorizontal: s(spacing.xs),
    paddingVertical: vs(2),
    gap: s(spacing.sm - 1),
    height: vs(30),
    minWidth: s(88),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  tokenIcon: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
  },
  tokenIconPlaceholder: {
    backgroundColor: colors.skeleton.base,
  },
  tokenSymbol: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    opacity: 0.9,
    letterSpacing: 0.018,
    lineHeight: ms(18),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usdValue: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.black,
    color: colors.text.primary,
    letterSpacing: 0.018,
    lineHeight: ms(21),
  },
  availableBalance: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.light,
    color: colors.text.primary,
    letterSpacing: 0.018,
    lineHeight: ms(21),
  },
});

export default SwapAmountInput;
