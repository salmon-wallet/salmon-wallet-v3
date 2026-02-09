import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { colors, ms, s, vs } from '@salmon/shared';
import type { NftCarouselSectionSkeletonProps } from './types';

// Card dimensions for carousel (smaller than grid cards)
const CARD_WIDTH = s(140);
const CARD_HEIGHT = vs(160);
const CARD_BORDER_RADIUS = ms(14);
const CARD_GAP = s(12);
const ROW_GAP = vs(12);

// Header dimensions
const HEADER_HEIGHT = vs(32);
const ICON_SIZE = s(24);

/**
 * NftCarouselSectionSkeleton - Loading skeleton for NftCarouselSection
 *
 * Shows animated skeleton for:
 * - Section header with icon placeholder
 * - Two rows of NFT card placeholders
 */
export const NftCarouselSectionSkeleton: React.FC<NftCarouselSectionSkeletonProps> = ({
  count = 4,
  style,
  testID,
}) => {
  // Calculate how many cards per row (half of count, min 2)
  const cardsPerRow = Math.max(2, Math.ceil(count / 2));

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <ContentLoader
          speed={1.5}
          width={s(150)}
          height={HEADER_HEIGHT}
          viewBox={`0 0 ${s(150)} ${HEADER_HEIGHT}`}
          backgroundColor={colors.skeleton.base}
          foregroundColor={colors.skeleton.highlight}
        >
          {/* Icon circle */}
          <Rect
            x="0"
            y={(HEADER_HEIGHT - ICON_SIZE) / 2}
            rx={ICON_SIZE / 2}
            ry={ICON_SIZE / 2}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
          {/* Title */}
          <Rect
            x={ICON_SIZE + s(8)}
            y={(HEADER_HEIGHT - ms(18)) / 2}
            rx={ms(4)}
            ry={ms(4)}
            width={s(80)}
            height={ms(18)}
          />
        </ContentLoader>
      </View>

      {/* Cards Skeleton - Horizontal ScrollView with 2 rows */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.rowsContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            {Array.from({ length: cardsPerRow }).map((_, index) => (
              <View key={`row1-${index}`} style={styles.cardWrapper}>
                <ContentLoader
                  speed={1.5}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
                  backgroundColor={colors.skeleton.base}
                  foregroundColor={colors.skeleton.highlight}
                >
                  {/* Card background */}
                  <Rect
                    x="0"
                    y="0"
                    rx={CARD_BORDER_RADIUS}
                    ry={CARD_BORDER_RADIUS}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                  />
                </ContentLoader>
              </View>
            ))}
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            {Array.from({ length: cardsPerRow }).map((_, index) => (
              <View key={`row2-${index}`} style={styles.cardWrapper}>
                <ContentLoader
                  speed={1.5}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
                  backgroundColor={colors.skeleton.base}
                  foregroundColor={colors.skeleton.highlight}
                >
                  {/* Card background */}
                  <Rect
                    x="0"
                    y="0"
                    rx={CARD_BORDER_RADIUS}
                    ry={CARD_BORDER_RADIUS}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                  />
                </ContentLoader>
              </View>
            ))}
          </View>
        </View>
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
    height: HEADER_HEIGHT,
  },
  scrollContent: {
    paddingHorizontal: s(18),
  },
  rowsContainer: {
    gap: ROW_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
});

export default NftCarouselSectionSkeleton;
