import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { GlassContainerProps } from './types';

/**
 * Check if native Liquid Glass is available (iOS 26+)
 * This is evaluated once at module load time for performance
 */
export const isNativeLiquidGlassAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * GlassContainer - A reusable glass effect component
 *
 * Provides a consistent glass/blur effect across the app:
 * - iOS 26+: Uses native Liquid Glass effect via expo-glass-effect
 * - iOS < 26 / Android: Falls back to BlurView with enhanced glass simulation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <GlassContainer style={styles.card}>
 *   <Text>Content with glass effect</Text>
 * </GlassContainer>
 *
 * // With custom fallback settings
 * <GlassContainer
 *   glassStyle="regular"
 *   fallbackBlurIntensity={40}
 *   fallbackBlurTint="light"
 * >
 *   <Text>Custom glass content</Text>
 * </GlassContainer>
 * ```
 */
export function GlassContainer({
  children,
  style,
  glassStyle = 'clear',
  tintColor,
  fallbackBlurIntensity = 20,
  fallbackBlurTint = 'dark',
  fallbackBackgroundColor = 'rgba(30, 30, 30, 0.5)',
  fallbackBorderColor = 'rgba(255, 255, 255, 0.1)',
  fallbackBorderWidth = 1,
}: GlassContainerProps) {
  if (isNativeLiquidGlassAvailable) {
    return (
      <GlassView glassEffectStyle={glassStyle} tintColor={tintColor} style={style}>
        {children}
      </GlassView>
    );
  }

  // Fallback: Enhanced BlurView for iOS < 26 and Android
  return (
    <BlurView
      intensity={fallbackBlurIntensity}
      tint={fallbackBlurTint}
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.fallbackContainer,
        {
          backgroundColor: fallbackBackgroundColor,
          borderColor: fallbackBorderColor,
          borderWidth: fallbackBorderWidth,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    overflow: 'hidden',
  },
});

export default GlassContainer;
