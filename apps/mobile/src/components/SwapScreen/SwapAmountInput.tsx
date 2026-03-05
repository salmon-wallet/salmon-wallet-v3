import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, fontSize, shadows, ms, vs, s, formatTokenBalance, useCurrencyContext, fontFamilyNative } from '@salmon/shared';
import { TokenLogo } from '../TokenLogo';
import { BlurContainer } from '../BlurContainer';
import type { SwapAmountInputProps } from './types';

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
  const { t } = useTranslation();
  const [{ currency }, { formatPrecise }] = useCurrencyContext();
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
      <BlurContainer
        borderColor={value ? colors.accent.primary : undefined}
        style={styles.inputContainer}
      >
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
            placeholderTextColor={colors.text.tertiary}
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
          <TokenLogo uri={token?.logo || undefined} symbol={token?.symbol} size={ms(22)} />
          <Text style={styles.tokenSymbol}>{token?.symbol || t('actions.select', 'Select')}</Text>
        </TouchableOpacity>
      </BlurContainer>

      {/* USD Value and Balance Row */}
      {(usdValue !== undefined || availableBalance !== undefined) && (
        <View style={styles.infoRow}>
          <Text style={styles.usdValue}>{formatPrecise(usdValue)} {currency.toUpperCase()}</Text>
          {availableBalance !== undefined && token && (
            <Text style={styles.availableBalance}>
              Available: {formatTokenBalance(availableBalance)} {token.symbol}
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
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    letterSpacing: 0.02,
    lineHeight: ms(18),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: ms(fontSize.md),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    paddingVertical: 0,
    height: '100%',
    opacity: 1,
  },
  tokenDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button.secondaryBackground,
    borderRadius: borderRadius.sm + 2,
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xxs),
    gap: s(spacing.sm - 1),
    height: vs(36),
    minWidth: s(100),
    ...shadows.sm,
  },
  tokenSymbol: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.bold,
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
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    letterSpacing: 0.018,
    lineHeight: ms(21),
  },
  availableBalance: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.primary,
    letterSpacing: 0.018,
    lineHeight: ms(21),
  },
});

export default SwapAmountInput;
