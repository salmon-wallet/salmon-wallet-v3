import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, borderWidth, ms, vs, s, fontFamilyNative } from '@salmon/shared';
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
    <View style={[styles.container, style]}>
      <BlurView intensity={5} tint="dark" style={styles.blurContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.sm),
    minHeight: vs(40),
  },
  label: {
    fontSize: ms(15),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
  value: {
    fontSize: ms(15),
    fontFamily: fontFamilyNative.extraBold,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
});

export default SwapDetailRow;
