import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
        <View style={styles.balanceSkeleton} />
      </View>

      {/* Value info skeleton */}
      <View style={styles.valueContainer}>
        <View style={styles.usdSkeleton} />
        <View style={styles.changeSkeleton} />
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  logoSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  balanceSkeleton: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  usdSkeleton: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  changeSkeleton: {
    width: 50,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default TokenListSkeleton;
