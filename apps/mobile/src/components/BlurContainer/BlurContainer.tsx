import { colors } from '@salmon/shared';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { BlurContainerProps } from './types';

// Android: higher opacity background to compensate for lack of native blur
const ANDROID_BG = 'rgba(56, 63, 82, 0.35)';

/**
 * BlurContainer - A reusable blur effect component
 *
 * On iOS uses expo-blur BlurView with native gaussian blur.
 * On Android uses a solid semi-transparent background instead, which is
 * more performant and visually consistent than the experimental blur.
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
  blurIntensity = 8,
  blurTint = 'dark',
  backgroundColor = colors.background.tokenItem,
  borderColor = colors.border.default,
  borderWidth = 1,
}: BlurContainerProps) {
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: ANDROID_BG,
            borderColor,
            borderWidth,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

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
