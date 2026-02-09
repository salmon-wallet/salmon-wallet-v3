import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, ms, vs, s } from '@salmon/shared';
import { SwapAmountInput } from './SwapAmountInput';
import { PrimaryButton } from '../Button';
import type { SwapInputScreenProps } from './types';

/**
 * SwapInputScreen - First step of swap flow
 * Shows input/output token selectors and amounts
 */
export const SwapInputScreen: React.FC<SwapInputScreenProps> = ({
  inToken,
  outToken,
  inAmount,
  outAmount,
  onInAmountChange,
  onInTokenPress,
  onOutTokenPress,
  inUsdValue,
  isLoadingQuote = false,
  canReview,
  onReview,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Input Fields */}
      <View style={styles.inputsContainer}>
        {/* You Send */}
        <SwapAmountInput
          label="You Send"
          value={inAmount}
          onChangeValue={onInAmountChange}
          token={inToken}
          onTokenPress={onInTokenPress}
          usdValue={inUsdValue}
          availableBalance={inToken?.balance}
          editable={true}
          placeholder="Enter an amount"
        />

        {/* You Receive */}
        <SwapAmountInput
          label="You Receive"
          value={outAmount}
          onChangeValue={() => {}}
          token={outToken}
          onTokenPress={onOutTokenPress}
          editable={false}
          placeholder="0"
          isLoading={isLoadingQuote}
        />
      </View>

      {/* Review Button */}
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={canReview ? gradients.primaryButton.colors : gradients.disabled.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={styles.buttonGradient}
        >
          <PrimaryButton
            onPress={onReview}
            disabled={!canReview}
            style={styles.button}
          >
            Review & Swap
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
    paddingTop: vs(spacing['3xl'] + spacing['3xl']),
    paddingBottom: vs(spacing['2xl']),
  },
  inputsContainer: {
    gap: vs(spacing['2xl']),
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

export default SwapInputScreen;
