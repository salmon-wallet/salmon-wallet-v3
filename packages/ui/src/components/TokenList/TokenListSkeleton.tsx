import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@salmon/shared';
import type { TokenListSkeletonProps } from './types';

/**
 * Skeleton placeholder for a single token item
 */
const SkeletonItem: React.FC = () => {
  // Use useMemo to create a stable Animated.Value that persists across renders
  // This is the recommended pattern for React Native animations
  const animatedValue = React.useMemo(() => new Animated.Value(0.3), []);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  return (
    <Animated.View style={[styles.item, { opacity: animatedValue }]}>
      {/* Token logo skeleton */}
      <View style={styles.logoSkeleton} />

      {/* Token info skeleton */}
      <View style={styles.infoContainer}>
        <View style={styles.nameSkeleton} />
        <View style={styles.priceSkeleton} />
      </View>

      {/* Value info skeleton */}
      <View style={styles.valueContainer}>
        <View style={styles.usdSkeleton} />
        <View style={styles.amountSkeleton} />
      </View>
    </Animated.View>
  );
};

/**
 * Loading skeleton for TokenList component
 *
 * Displays animated placeholder items while token data is loading.
 *
 * @example
 * ```tsx
 * <TokenListSkeleton count={5} />
 * ```
 */
const TokenListSkeleton: React.FC<TokenListSkeletonProps> = ({ count = 5 }) => {
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <View style={styles.container}>
      {items.map((index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background.tokenItem,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 10,
    marginHorizontal: 24,
    gap: 16,
  },
  logoSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.skeleton.base,
  },
  infoContainer: {
    flex: 1,
  },
  nameSkeleton: {
    width: 100,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.skeleton.base,
    marginBottom: 6,
  },
  priceSkeleton: {
    width: 140,
    height: 15,
    borderRadius: 4,
    backgroundColor: colors.skeleton.base,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  usdSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.skeleton.base,
    marginBottom: 4,
  },
  amountSkeleton: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.skeleton.base,
  },
});

export default TokenListSkeleton;
