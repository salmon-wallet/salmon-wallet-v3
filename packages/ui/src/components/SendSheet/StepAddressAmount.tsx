import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  borderRadius,
  ms,
  vs,
  s,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { StepAddressAmountProps } from './types';

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

const QUICK_FILL_OPTIONS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: 'MAX', value: 1 },
] as const;

// ============================================================================
// Component
// ============================================================================

export const StepAddressAmount: React.FC<StepAddressAmountProps> = ({
  token,
  blockchain,
  onBack,
  onReview,
  onCancel,
}) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Parse balance
  const tokenBalance = useMemo(() => {
    return typeof token.uiAmount === 'string'
      ? parseFloat(token.uiAmount)
      : token.uiAmount;
  }, [token.uiAmount]);

  // USD conversion
  const usdValue = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (!token.price || numAmount === 0) return '0.0000';
    return (numAmount * token.price).toFixed(4);
  }, [amount, token.price]);

  // Balance display
  const balanceDisplay = useMemo(() => {
    if (tokenBalance === 0) return `0 ${token.symbol}`;
    return `${Number(tokenBalance.toFixed(4))} ${token.symbol}`;
  }, [tokenBalance, token.symbol]);

  // Validate form
  const isValid = useMemo(() => {
    const numAmount = parseFloat(amount);
    return (
      address.trim().length > 0 &&
      !isNaN(numAmount) &&
      numAmount > 0 &&
      numAmount <= tokenBalance
    );
  }, [address, amount, tokenBalance]);

  // Handle quick fill
  const handleQuickFill = useCallback(
    (percentage: number) => {
      const fillAmount = tokenBalance * percentage;
      // Truncate to reasonable decimal places based on token decimals
      const decimals = token.decimals ?? 9;
      const truncated = Math.floor(fillAmount * 10 ** decimals) / 10 ** decimals;
      setAmount(truncated > 0 ? truncated.toString() : '0');
    },
    [tokenBalance, token.decimals]
  );

  // Handle review press
  const handleReview = useCallback(() => {
    if (isValid) {
      onReview(address.trim(), amount);
    }
  }, [isValid, address, amount, onReview]);

  // Placeholder text based on blockchain
  const addressPlaceholder = useMemo(() => {
    switch (blockchain) {
      case 'solana':
        return 'Solana Address';
      case 'ethereum':
        return 'Ethereum Address';
      case 'bitcoin':
        return 'Bitcoin Address';
      default:
        return 'Recipient Address';
    }
  }, [blockchain]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected Token Card */}
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel={`Selected token: ${token.name}`}
        >
          <BlurContainer style={styles.tokenCard}>
          <View style={styles.tokenCardLeft}>
            {token.logo ? (
              <Image
                source={{ uri: token.logo }}
                style={styles.tokenCardLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.tokenCardLogo, styles.tokenCardLogoFallback]}>
                <Text style={styles.tokenCardLogoFallbackText}>
                  {token.symbol?.slice(0, 2).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.tokenCardName} numberOfLines={1}>
              {token.symbol}
            </Text>
          </View>
          <Text style={styles.tokenCardBalance} numberOfLines={1}>
            {balanceDisplay}
          </Text>
          </BlurContainer>
        </TouchableOpacity>

        {/* Recipient */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Recipient</Text>
          <BlurContainer style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={addressPlaceholder}
              placeholderTextColor={colors.text.secondary}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          </BlurContainer>
        </View>

        {/* Amount */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <BlurContainer style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.text.secondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoCorrect={false}
            />
            <View style={styles.quickFillButtons}>
              {QUICK_FILL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.quickFillButton}
                  onPress={() => handleQuickFill(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickFillText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurContainer>
        </View>

        {/* USD Conversion */}
        <Text style={styles.usdConversion}>{usdValue} USD</Text>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reviewButton, !isValid && styles.reviewButtonDisabled]}
          onPress={handleReview}
          activeOpacity={0.7}
          disabled={!isValid}
        >
          <LinearGradient
            colors={isValid ? ['#FF5C45', 'rgba(161, 42, 42, 0.9)'] : ['#555555', '#444444']}
            style={styles.reviewButtonGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.4 }}
          >
            <Text style={styles.reviewButtonText}>Review & Send</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(18),
    paddingBottom: vs(20),
  },
  // Token Card
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ms(14),
    paddingVertical: vs(14),
    paddingHorizontal: s(14),
    marginBottom: vs(24),
  },
  tokenCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenCardLogo: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    marginRight: s(10),
  },
  tokenCardLogoFallback: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenCardLogoFallbackText: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
  },
  tokenCardName: {
    fontSize: ms(16),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
  },
  tokenCardBalance: {
    fontSize: ms(16),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
  },
  // Fields
  fieldGroup: {
    marginBottom: vs(20),
  },
  fieldLabel: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  inputContainer: {
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    height: vs(48),
    justifyContent: 'center',
  },
  textInput: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  // Amount
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    height: vs(48),
  },
  amountInput: {
    flex: 1,
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: s(6),
  },
  quickFillButton: {
    backgroundColor: '#2A384E',
    borderRadius: ms(6),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  quickFillText: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  // USD
  usdConversion: {
    fontSize: ms(20),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: vs(4),
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 12,
  },
  cancelButtonText: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.text.primary,
  },
  reviewButton: {
    flex: 1,
    height: vs(48),
    borderRadius: ms(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 12,
  },
  reviewButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.border.default,
  },
  reviewButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
  },
});

export default StepAddressAmount;
