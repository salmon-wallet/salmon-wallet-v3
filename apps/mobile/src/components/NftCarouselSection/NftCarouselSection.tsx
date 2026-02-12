import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, ms, s, vs } from '@salmon/shared';
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon';
import { BlurContainer } from '../BlurContainer';
import type { NftCarouselSectionProps, NftBlockchain } from './types';
import type { NftData } from '../NftCard';
import { NftCarouselSectionSkeleton } from './NftCarouselSectionSkeleton';

// Card dimensions for carousel (matches Figma node 1702:6142 — ~194x193pt)
const CARD_WIDTH = s(194);
const CARD_HEIGHT = vs(193);
const CARD_BORDER_RADIUS = ms(18);
const CARD_GAP = s(9);

// Fallback gradient for NFTs without images
const FALLBACK_GRADIENT = {
  colors: ['rgb(255, 92, 69)', 'rgba(161, 42, 42, 0.9)'] as const,
  start: { x: 0.12, y: 0.5 },
  end: { x: 0.83, y: 0.5 },
};

/**
 * Get blockchain icon component based on blockchain type
 */
const getBlockchainIcon = (blockchain: NftBlockchain, size: number = 24) => {
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon size={size} color={colors.text.primary} />;
    case 'ethereum':
      return <EthereumSvgIcon size={size} color={colors.text.primary} />;
    case 'bitcoin':
      return <BitcoinSvgIcon size={size} color={colors.text.primary} />;
    default:
      return null;
  }
};

/**
 * Chevron right icon for "See All" button
 */
const ChevronRightIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = colors.text.secondary,
}) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>{'>'}</Text>
  </View>
);

/**
 * Mini NFT Card for carousel display
 */
interface MiniNftCardProps {
  nft: NftData;
  onPress?: () => void;
}

const MiniNftCard: React.FC<MiniNftCardProps> = ({ nft, onPress }) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  const showFallback = !nft.image || imageError;

  return (
    <TouchableOpacity
      style={styles.miniCard}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`NFT: ${nft.name}`}
    >
      {/* Background */}
      {showFallback ? (
        <LinearGradient
          colors={[...FALLBACK_GRADIENT.colors]}
          start={FALLBACK_GRADIENT.start}
          end={FALLBACK_GRADIENT.end}
          style={styles.cardBackground}
        />
      ) : (
        <>
          <Image
            source={nft.image}
            style={styles.cardImage}
            contentFit="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            recyclingKey={nft.mint}
            autoplay={true}
          />
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <LinearGradient
                colors={[...FALLBACK_GRADIENT.colors]}
                start={FALLBACK_GRADIENT.start}
                end={FALLBACK_GRADIENT.end}
                style={styles.cardBackground}
              />
              <ActivityIndicator size="small" color={colors.text.primary} />
            </View>
          )}
        </>
      )}

      {/* Name badge */}
      <View style={styles.nameBadgeContainer}>
        <BlurContainer
          style={styles.nameBadge}
          blurIntensity={6}
          backgroundColor="rgba(0, 0, 0, 0.6)"
          borderColor="rgba(255, 92, 69, 0.8)"
          borderWidth={0.5}
        >
          <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
            {nft.name || 'Unnamed NFT'}
          </Text>
        </BlurContainer>
      </View>
    </TouchableOpacity>
  );
};

/**
 * NftCarouselSection - Horizontal single-row carousel of NFTs
 *
 * Horizontal scrolling carousel grouped by blockchain.
 * Cards peek at the edge to hint at scrollability.
 *
 * @example
 * ```tsx
 * <NftCarouselSection
 *   title="Solana"
 *   blockchain="solana"
 *   nfts={solanaCollection}
 *   onNftPress={(nft) => showDetail(nft)}
 *   onSeeAllPress={() => openSeeAllSheet('solana')}
 * />
 * ```
 */
export const NftCarouselSection: React.FC<NftCarouselSectionProps> = ({
  title,
  blockchain,
  nfts,
  loading = false,
  onNftPress,
  onSeeAllPress,
  style,
  testID,
  renderBeforeCarousel,
}) => {
  const handleNftPress = useCallback(
    (nft: NftData) => {
      onNftPress?.(nft);
    },
    [onNftPress]
  );

  const handleSeeAllPress = useCallback(() => {
    onSeeAllPress?.();
  }, [onSeeAllPress]);

  // Show skeleton while loading
  if (loading) {
    return <NftCarouselSectionSkeleton blockchain={blockchain} style={style} testID={testID} />;
  }

  // Don't render if no NFTs
  if (!nfts || nfts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleSeeAllPress}
        activeOpacity={onSeeAllPress ? 0.7 : 1}
        disabled={!onSeeAllPress}
      >
        <View style={styles.headerLeft}>
          {getBlockchainIcon(blockchain, s(24))}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>({nfts.length})</Text>
        </View>
        {onSeeAllPress && (
          <View style={styles.headerRight}>
            <ChevronRightIcon size={s(20)} color={colors.text.secondary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Optional content before carousel (e.g., SubAccountSelector) */}
      {renderBeforeCarousel}

      {/* Carousel Content — single horizontal row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {nfts.map((nft) => (
          <MiniNftCard
            key={nft.mint}
            nft={nft}
            onPress={() => handleNftPress(nft)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: vs(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(18),
    marginBottom: vs(12),
    height: vs(32),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(18),
    fontWeight: '600',
    color: colors.text.primary,
  },
  count: {
    fontFamily: 'DMSans-Regular',
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: s(18),
    gap: CARD_GAP,
  },
  // Mini Card Styles
  miniCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
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
  cardBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardImage: {
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
  nameBadgeContainer: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
    right: s(8),
    alignItems: 'center',
  },
  nameBadge: {
    borderRadius: ms(9),
    paddingVertical: vs(6),
    paddingHorizontal: s(16),
    width: '100%',
    overflow: 'hidden',
  },
  nameText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(13),
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
  },
});

export default NftCarouselSection;
