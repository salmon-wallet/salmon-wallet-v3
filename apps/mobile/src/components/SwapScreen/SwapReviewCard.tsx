import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, ms, vs, s, fontFamilyNative } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { SwapReviewCardProps } from './types';

/**
 * SwapReviewCard - Card displaying token amount for review screen
 * Shows label (You Send/You Receive) and the amount with symbol
 */
export const SwapReviewCard: React.FC<SwapReviewCardProps> = ({
  label,
  amount,
  usdValue,
  style,
}) => {
  return (
    <BlurContainer
      style={[styles.container, style]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{amount}</Text>
      {usdValue != null && <Text style={styles.usdValue}>{usdValue}</Text>}
    </BlurContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.sm),
    minHeight: vs(75),
    justifyContent: 'center',
  },
  label: {
    fontSize: ms(15),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
  amount: {
    fontSize: ms(25),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    letterSpacing: -0.12,
    lineHeight: ms(25),
    marginTop: vs(2),
  },
  usdValue: {
    fontSize: ms(13),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    letterSpacing: -0.065,
    lineHeight: ms(13 * 1.4),
    marginTop: vs(2),
  },
});

export default SwapReviewCard;
