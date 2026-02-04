import { colors, ms, s, vs } from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurContainer } from '../BlurContainer';
import type { NftCardProps, NftCardSkeletonProps } from './types';

/**
 * Orange gradient colors for fallback background
 * Gradient: linear-gradient(91.6deg, rgb(255, 92, 69) 12%, rgba(161, 42, 42, 0.9) 83%)
 */
const FALLBACK_GRADIENT = {
  colors: ['rgb(255, 92, 69)', 'rgba(161, 42, 42, 0.9)'] as const,
  start: { x: 0.12, y: 0.5 },
  end: { x: 0.83, y: 0.5 },
};

/**
 * NftCard component for displaying NFTs in a grid layout
 *
 * Features:
 * - ~194x193px responsive card with 18px border radius
 * - NFT image covers the entire card
 * - Orange gradient fallback when no image or image fails to load
 * - Name badge at bottom with glassmorphism effect
 * - Accessible with press handling
 *
 * @example
 * ```tsx
 * <NftCard
 *   nft={{
 *     mint: 'abc123',
 *     name: 'Cool NFT #1',
 *     image: 'https://example.com/nft.png',
 *     collectionName: 'Cool Collection',
 *   }}
 *   onPress={() => console.log('NFT pressed')}
 * />
 * ```
 */
export const NftCard: React.FC<NftCardProps> = ({
  nft,
  onPress,
  style,
  testID,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoadStart = useCallback(() => {
    setImageLoading(true);
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const showFallback = !nft.image || imageError;

  /**
   * Render the background content (image or gradient fallback)
   */
  const renderBackground = () => {
    if (showFallback) {
      return (
        <LinearGradient
          colors={[...FALLBACK_GRADIENT.colors]}
          start={FALLBACK_GRADIENT.start}
          end={FALLBACK_GRADIENT.end}
          style={styles.fallbackGradient}
        />
      );
    }

    return (
      <>
        <Image
          source={{ uri: nft.image }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={handleImageLoadStart}
          onLoadEnd={handleImageLoadEnd}
          onError={handleImageError}
          accessibilityLabel={`NFT image for ${nft.name}`}
        />
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <LinearGradient
              colors={[...FALLBACK_GRADIENT.colors]}
              start={FALLBACK_GRADIENT.start}
              end={FALLBACK_GRADIENT.end}
              style={styles.fallbackGradient}
            />
            <ActivityIndicator
              size="small"
              color={colors.text.primary}
              style={styles.loader}
            />
          </View>
        )}
      </>
    );
  };

  /**
   * Render the name badge at the bottom of the card
   */
  const renderNameBadge = () => {
    const displayName = nft.name || 'Unnamed NFT';

    return (
      <View style={styles.nameBadgeContainer}>
        <BlurContainer
          style={styles.nameBadge}
          blurIntensity={6}
          backgroundColor="rgba(0, 0, 0, 0.6)"
          borderColor="rgba(255, 92, 69, 0.8)"
          borderWidth={0.5}
        >
          <Text
            style={styles.nameText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
        </BlurContainer>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`NFT: ${nft.name}`}
      accessibilityHint={onPress ? 'Double tap to view NFT details' : undefined}
      testID={testID}
    >
      {renderBackground()}
      {renderNameBadge()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Card size: ~194x193px with responsive scaling
    width: s(194),
    height: vs(193),
    borderRadius: ms(18),
    overflow: 'hidden',
    // Shadow: 0px 3px 9px rgba(0,0,0,0.4)
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 9,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallbackGradient: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
  },
  nameBadgeContainer: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
    right: s(8),
    alignItems: 'center',
  },
  nameBadge: {
    // Border radius: 9px (BlurContainer handles background/border)
    borderRadius: ms(9),
    // Padding: 6px vertical
    paddingVertical: vs(6),
    paddingHorizontal: s(16),
    width: '100%',
    overflow: 'hidden',
  },
  nameText: {
    // DM Sans SemiBold, ~13px, color #e0e0e0
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(13),
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
  },
});

/**
 * NftCardSkeleton component for loading state
 *
 * Displays the orange gradient background with the name badge
 * but no image, matching the Figma skeleton design.
 */
export const NftCardSkeleton = React.memo<NftCardSkeletonProps>(
  ({ style, testID, animated = true }) => {
    const [pulseAnim] = useState(() => new Animated.Value(0.6));

    // Memoize gradient colors array to prevent unnecessary re-renders
    const gradientColors = useMemo(
      () => [...FALLBACK_GRADIENT.colors] as const,
      []
    );

    // Memoize animated style to prevent object recreation on each render
    const animatedStyle = useMemo(
      () => [styles.container, style, animated && { opacity: pulseAnim }],
      [style, animated, pulseAnim]
    );

    React.useEffect(() => {
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
            toValue: 0.6,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
      return () => animation.stop();
    }, [animated]); // pulseAnim is stable (created once via useState)

    return (
      <Animated.View style={animatedStyle} testID={testID}>
        <LinearGradient
          colors={gradientColors}
          start={FALLBACK_GRADIENT.start}
          end={FALLBACK_GRADIENT.end}
          style={styles.fallbackGradient}
        />
        <View style={styles.nameBadgeContainer}>
          <BlurContainer
            style={styles.nameBadge}
            blurIntensity={6}
            backgroundColor="rgba(0, 0, 0, 0.6)"
            borderColor="rgba(255, 92, 69, 0.8)"
            borderWidth={0.5}
          >
            <Text style={styles.nameText}>NFT Name</Text>
          </BlurContainer>
        </View>
      </Animated.View>
    );
  }
);

export default NftCard;
