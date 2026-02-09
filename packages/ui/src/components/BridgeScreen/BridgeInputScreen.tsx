import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, ms, vs, s } from '@salmon/shared';
import { BridgeAmountInput } from './BridgeAmountInput';
import { PrimaryButton } from '../Button';
import type { BridgeInputScreenProps } from './types';

const FONT_FAMILY = {
  medium: 'DMSansMedium',
} as const;

/**
 * BridgeInputScreen - First step of bridge flow
 * Shows source/destination token selectors and amounts
 */
export const BridgeInputScreen: React.FC<BridgeInputScreenProps> = ({
  inToken,
  outToken,
  inAmount,
  outAmount,
  onInAmountChange,
  onInTokenPress,
  onOutTokenPress,
  inUsdValue,
  isLoadingEstimate = false,
  minAmount,
  canContinue,
  onContinue,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Header Text */}
      <Text style={styles.headerText}>
        Bridge tokens across chains
      </Text>

      {/* Input Fields */}
      <View style={styles.inputsContainer}>
        {/* You Send */}
        <BridgeAmountInput
          label="You Send"
          value={inAmount}
          onChangeValue={onInAmountChange}
          token={inToken}
          onTokenPress={onInTokenPress}
          usdValue={inUsdValue}
          availableBalance={inToken?.balance}
          editable={true}
          placeholder="Enter an amount"
          minAmount={minAmount}
        />

        {/* Arrow/Divider */}
        <View style={styles.arrowContainer}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowText}>to</Text>
          </View>
          <View style={styles.arrowLine} />
        </View>

        {/* You Receive */}
        <BridgeAmountInput
          label="You Receive (estimated)"
          value={outAmount}
          onChangeValue={() => {}}
          token={outToken}
          onTokenPress={onOutTokenPress}
          editable={false}
          placeholder="0"
          isLoading={isLoadingEstimate}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={canContinue ? gradients.primaryButton.colors : gradients.disabled.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={styles.buttonGradient}
        >
          <PrimaryButton
            onPress={onContinue}
            disabled={!canContinue}
            style={styles.button}
          >
            Continue
          </PrimaryButton>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: s(spacing.headerPadding),
    paddingTop: vs(spacing['2xl']),
    paddingBottom: vs(spacing['2xl']),
  },
  headerText: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: vs(spacing['2xl']),
    letterSpacing: 0.02,
    lineHeight: ms(20),
  },
  inputsContainer: {
    gap: vs(spacing.lg),
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(spacing.xs),
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  arrowCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: colors.background.tokenItem,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: s(spacing.sm),
  },
  arrowText: {
    fontSize: ms(11),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
    letterSpacing: 0.02,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: vs(spacing['2xl']),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonGradient: {
    borderRadius: borderRadius.lg,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    minWidth: s(180),
    height: vs(42),
    backgroundColor: 'transparent',
  },
});

export default BridgeInputScreen;
