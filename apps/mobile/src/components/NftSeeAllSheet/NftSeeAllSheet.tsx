import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  colors,
  fontFamilyNative,
  fontSize,
  componentSizes,
  ms,
  vs,
  s,
  spacing,
} from '@salmon/shared';
import { useBottomSheetChrome } from '../../../hooks/useBottomSheetChrome';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { getGridItemWidth } from '../../../hooks/responsiveLayout';

import { BottomSheetContainer } from '../BottomSheetContainer';
import { NftCard, NftCardSkeleton } from '../NftCard';
import { SolanaSvgIcon, BitcoinSvgIcon } from '../Icon';
import type { NftSeeAllSheetProps } from './types';
import type { NftBlockchain } from '../NftCarouselSection';
import type { NftData } from '../NftCard';

// Grid constants
const GRID_GAP = s(18);
const HORIZONTAL_PADDING = s(18);

/**
 * Get blockchain icon component based on blockchain type
 */
const getBlockchainIcon = (blockchain: NftBlockchain, size: number = 24) => {
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon size={size} color={colors.text.primary} />;
    case 'bitcoin':
      return <BitcoinSvgIcon size={size} color={colors.text.primary} />;
    default:
      return null;
  }
};

/**
 * Skeleton grid for loading state
 */
const SkeletonGrid: React.FC<{ columns: number; cardWidth: number }> = ({
  columns,
  cardWidth,
}) => {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          {Array.from({ length: columns }, (_, column) => (
            <NftCardSkeleton
              key={column}
              style={[styles.skeletonCard, { width: cardWidth }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

/**
 * NftSeeAllSheet - Fullscreen bottom sheet with NFT grid
 *
 * Shows all NFTs from a blockchain in a 2-column grid layout.
 * Features drag-to-dismiss, smooth animations, and proper Android back handling.
 *
 * @example
 * ```tsx
 * <NftSeeAllSheet
 *   visible={showSeeAll}
 *   onClose={() => setShowSeeAll(false)}
 *   title="Solana NFTs"
 *   blockchain="solana"
 *   nfts={solanaCollection}
 *   onNftPress={(nft) => showDetail(nft)}
 * />
 * ```
 */
export const NftSeeAllSheet: React.FC<NftSeeAllSheetProps> = ({
  visible,
  onClose,
  title,
  blockchain,
  nfts,
  loading = false,
  onNftPress,
  style,
}) => {
  // Top fade gradient opacity (driven by scroll offset)
  const topFadeOpacity = useMemo(() => new Animated.Value(0), []);
  const { bottomInset, spaciousContentBottomPadding } = useBottomSheetChrome();
  const { nftColumns, bottomSheetMaxWidth } = useResponsiveLayout();
  const gridColumns = Math.min(nftColumns, 3);
  const gridCardWidth = getGridItemWidth(
    bottomSheetMaxWidth,
    gridColumns,
    GRID_GAP,
    HORIZONTAL_PADDING
  );

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const opacity = Math.min(offsetY / componentSizes.sheetFadeGradientHeight, 1);
      topFadeOpacity.setValue(opacity);
    },
    [topFadeOpacity]
  );

  // Render NFT item
  const renderNftItem = useCallback(
    ({ item }: { item: NftData }) => {
      return (
        <NftCard
          nft={item}
          onPress={() => onNftPress?.(item)}
          style={[styles.nftCard, { width: gridCardWidth }]}
        />
      );
    },
    [gridCardWidth, onNftPress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: NftData) => item.mint, []);

  // Custom header: blockchain icon + title + count
  const headerContent = (
    <View style={styles.titleContainer}>
      {getBlockchainIcon(blockchain, ms(24))}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>({nfts.length})</Text>
    </View>
  );

  return (
    <BottomSheetContainer
      visible={visible}
      onClose={onClose}
      headerContent={headerContent}
      showFadeGradient
      fadeGradientTop={vs(12) + vs(8) + ms(24) + vs(16)}
      scrollOffsetValue={topFadeOpacity}
      showTextureOverlay
      style={[styles.sheetContainer, style]}
    >
      {/* Grid Content */}
      {loading ? (
        <View style={styles.scrollContent}>
          <SkeletonGrid columns={gridColumns} cardWidth={gridCardWidth} />
        </View>
      ) : (
        <FlatList
          data={nfts}
          key={gridColumns}
          renderItem={renderNftItem}
          keyExtractor={keyExtractor}
          numColumns={gridColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: spaciousContentBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: bottomInset }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    height: '90%',
    minHeight: undefined,
    maxHeight: undefined,
    overflow: 'hidden',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.sm),
    marginBottom: vs(spacing.lg),
    paddingHorizontal: s(spacing.headerPadding),
  },
  title: {
    fontSize: ms(fontSize['2xl']),
    fontFamily: fontFamilyNative.extraBold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: ms(-0.32, 0.3),
  },
  count: {
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  nftCard: {
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
  },
  // Skeleton styles
  skeletonGrid: {
    paddingTop: vs(spacing.sm),
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  skeletonCard: {
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
  },
});

export default NftSeeAllSheet;
