import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ContentLoader, Rect } from '@salmon/shared';
import {
  borderRadius,
  colors,
  componentSizes,
  spacing,
  s,
} from '@salmon/shared';
import type { DerivedAccountCardSkeletonProps } from './types';

/**
 * Skeleton placeholder for a derived account card.
 * Uses react-content-loader for smooth shimmer animation.
 * Matches DerivedAccountCard layout to prevent layout shift.
 */
const DerivedAccountCardSkeletonComponent: React.FC<DerivedAccountCardSkeletonProps> = ({
  style,
  testID,
  animated = true,
}) => {
  const checkboxSize = s(componentSizes.checkboxSize);
  const checkboxMarginRight = s(spacing.lg);
  const padding = s(spacing.lg);

  // Content area width (card minus padding and checkbox)
  const contentStartX = checkboxSize + checkboxMarginRight;
  const cardInnerWidth = 340; // approximate inner width
  const contentWidth = cardInnerWidth - contentStartX;

  // Vertical layout
  const addressHeight = 16;
  const pathHeight = 12;
  const gap = 6;
  const totalHeight = addressHeight + gap + pathHeight;
  const topOffset = 0;

  return (
    <View style={[styles.card, style]} testID={testID}>
      <ContentLoader
        speed={animated ? 1.5 : 0}
        width={cardInnerWidth}
        height={totalHeight}
        viewBox={`0 0 ${cardInnerWidth} ${totalHeight}`}
        backgroundColor={colors.skeleton.base}
        foregroundColor={colors.skeleton.highlight}
        accessibilityLabel="Loading account information"
      >
        {/* Checkbox */}
        <Rect
          x="0"
          y={String((totalHeight - checkboxSize) / 2)}
          rx="6"
          ry="6"
          width={String(checkboxSize)}
          height={String(checkboxSize)}
        />

        {/* Address */}
        <Rect
          x={String(contentStartX)}
          y={String(topOffset)}
          rx="4"
          ry="4"
          width={String(contentWidth * 0.55)}
          height={String(addressHeight)}
        />

        {/* Network · Path */}
        <Rect
          x={String(contentStartX)}
          y={String(topOffset + addressHeight + gap)}
          rx="4"
          ry="4"
          width={String(contentWidth * 0.4)}
          height={String(pathHeight)}
        />

        {/* Balance (right aligned) */}
        <Rect
          x={String(cardInnerWidth - 70)}
          y={String((totalHeight - 16) / 2)}
          rx="4"
          ry="4"
          width="70"
          height="16"
        />
      </ContentLoader>
    </View>
  );
};

export const DerivedAccountCardSkeleton = React.memo(DerivedAccountCardSkeletonComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.skeleton.base,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
