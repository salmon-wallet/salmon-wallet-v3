import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, borderRadius, ms, vs, s, fontFamilyNative } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { SwapDetailRowProps } from './types';

/**
 * SwapDetailRow - A single row in the swap details section
 * Displays label on left and value on right with glassmorphism effect
 */
export const SwapDetailRow: React.FC<SwapDetailRowProps> = ({
  label,
  value,
  style,
}) => {
  return (
    <BlurContainer
      style={[styles.container, style]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </BlurContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.sm),
    minHeight: vs(40),
  },
  label: {
    fontSize: ms(fontSize.md),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
  value: {
    fontSize: ms(fontSize.md),
    fontFamily: fontFamilyNative.extraBold,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
});

export default SwapDetailRow;
