import { colors } from '@salmon/shared';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet } from 'react-native';
import type { BlurContainerProps } from './types';

/**
 * BlurContainer - A reusable blur effect component
 *
 * Provides a consistent blur effect across the app using expo-blur BlurView.
 * Uses #383F52 at 10% opacity as background with blur intensity 40.
 *
 * @example
 * ```tsx
 * // Basic usage (uses defaults)
 * <BlurContainer style={styles.card}>
 *   <Text>Content with blur effect</Text>
 * </BlurContainer>
 *
 * // With custom settings
 * <BlurContainer
 *   blurIntensity={60}
 *   borderColor={colors.accent.primary}
 * >
 *   <Text>Custom blur content</Text>
 * </BlurContainer>
 * ```
 */
export function BlurContainer({
  children,
  style,
  blurIntensity = 40,
  blurTint = 'dark',
  backgroundColor = colors.background.tokenItem,
  borderColor = colors.border.default,
  borderWidth = 1,
}: BlurContainerProps) {
  return (
    <BlurView
      intensity={blurIntensity}
      tint={blurTint}
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default BlurContainer;
