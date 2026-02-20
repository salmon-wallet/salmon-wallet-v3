import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, borderWidth, ms, vs, s, fontFamilyNative } from '@salmon/shared';
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
    <View style={[styles.container, style]}>
      <BlurView intensity={5} tint="dark" style={styles.blurContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.amount}>{amount}</Text>
        {usdValue != null && <Text style={styles.usdValue}>{usdValue}</Text>}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: borderWidth.tokenListItem,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  blurContent: {
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
