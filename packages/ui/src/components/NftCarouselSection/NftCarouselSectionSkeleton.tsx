import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { colors, ms, s, vs } from '@salmon/shared';
import type { NftCarouselSectionSkeletonProps } from './types';

// Card dimensions for carousel (matches Figma node 1702:6142 — ~194x193pt)
const CARD_WIDTH = s(194);
const CARD_HEIGHT = vs(193);
const CARD_BORDER_RADIUS = ms(18);
const CARD_GAP = s(9);
const SKELETON_COUNT = 3;

// Header dimensions
const HEADER_HEIGHT = vs(32);
const ICON_SIZE = s(24);

/**
 * NftCarouselSectionSkeleton - Loading skeleton for NftCarouselSection
 *
 * Shows animated skeleton for:
 * - Section header with icon placeholder
 * - Single row of 3 NFT card placeholders
 */
export const NftCarouselSectionSkeleton: React.FC<NftCarouselSectionSkeletonProps> = ({
  style,
  testID,
}) => {
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

      {/* Cards Skeleton — single horizontal row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <View key={`skeleton-${index}`} style={styles.cardWrapper}>
            <ContentLoader
              speed={1.5}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
              backgroundColor={colors.skeleton.base}
              foregroundColor={colors.skeleton.highlight}
            >
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
