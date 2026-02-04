import { colors, ms, s, vs } from '@salmon/shared';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { BalanceCardSkeletonProps } from './types';

/**
 * BalanceCardSkeleton component for loading state
 *
 * Displays placeholder rectangles for balance and 24h change
 * with a pulsing animation to indicate loading.
 *
 * Features:
 * - Animated pulse effect (opacity 0.3 -> 1)
 * - Placeholder for balance ($0,000.00) - large rectangle
 * - Placeholder for 24h change - smaller rectangle
 * - Uses theme skeleton colors
 * - Maintains same layout dimensions to prevent layout shift
 *
 * @example
 * ```tsx
 * <BalanceCardSkeleton animated testID="balance-skeleton" />
 * ```
 */
const BalanceCardSkeletonComponent: React.FC<BalanceCardSkeletonProps> = ({
  style,
  testID,
  animated = true,
}) => {
  const [pulseAnim] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animated, pulseAnim]);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Balance placeholder - matches balance text dimensions */}
      <Animated.View
        style={[
          styles.balancePlaceholder,
          animated && { opacity: pulseAnim },
        ]}
      />

      {/* 24h change placeholder - smaller rectangle */}
      <Animated.View
        style={[
          styles.changePlaceholder,
          animated && { opacity: pulseAnim },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(18),
  },
  // Balance placeholder: matches the balance text height (~37px) and approximate width
  balancePlaceholder: {
    width: s(180),
    height: vs(37),
    borderRadius: ms(8),
    backgroundColor: colors.skeleton.base,
    // Shadow to match balance row
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Change placeholder: matches the change row height (~13px line height) and approximate width
  changePlaceholder: {
    width: s(120),
    height: vs(16),
    borderRadius: ms(4),
    backgroundColor: colors.skeleton.base,
    // Shadow to match change row
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export const BalanceCardSkeleton = React.memo(BalanceCardSkeletonComponent);

export default BalanceCardSkeleton;
