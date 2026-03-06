import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, componentSizes, ms, s, spacing, vs } from '@salmon/shared';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { TokenBadgesProps } from './types';

/**
 * Mapping of token tags to Ionicons icon names
 */
const TAG_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Verification & trust tags
  verified: 'checkmark-circle',
  strict: 'shield',
  major: 'trophy',
  'moonshot-verified': 'shield-checkmark',

  // Community tags
  community: 'people',
  'community-assist': 'hand-right',

  // Token types
  lst: 'water',
  'original-lst': 'medal',
  stable: 'logo-usd',
  'token-2022': 'cube',
  yb: 'analytics',

  // Launchpad & trading
  launchpad: 'rocket',
  moonshot: 'moon',
  'birdeye-trending': 'trending-up',
  'pumpfun-graduates': 'school',

  // Financial products
  'jup-lend-earn': 'cash',
  prestocks: 'bar-chart',
  xstocks: 'pie-chart',

  // Registry & metadata
  'old-registry': 'document-text',
  'solana-fm': 'search',
  wormhole: 'link',
  deduplicated: 'git-branch',
  duplicate: 'copy',
  deprecated: 'warning',
  internal: 'lock-closed',
};

/**
 * Mapping of token tags to badge colors
 * Uses colors from the design system palette
 */
const TAG_COLOR_MAP: Record<string, string> = {
  // Verification & trust tags
  verified: colors.palette.orange,
  strict: colors.palette.amber,
  major: colors.palette.amber,
  'moonshot-verified': colors.palette.cyan,

  // Community tags
  community: colors.palette.blue,
  'community-assist': colors.palette.blue,

  // Token types
  lst: colors.palette.cyan,
  'original-lst': colors.palette.cyan,
  stable: colors.palette.green,
  'token-2022': colors.palette.purple,
  yb: colors.palette.indigo,

  // Launchpad & trading
  launchpad: colors.palette.pink,
  moonshot: colors.palette.purple,
  'birdeye-trending': colors.palette.orange,
  'pumpfun-graduates': colors.palette.pink,

  // Financial products
  'jup-lend-earn': colors.palette.green,
  prestocks: colors.palette.blue,
  xstocks: colors.palette.indigo,

  // Registry & metadata
  'old-registry': colors.text.secondary,
  'solana-fm': colors.palette.indigo,
  wormhole: colors.palette.purple,
  deduplicated: colors.text.tertiary,
  duplicate: colors.text.tertiary,
  deprecated: colors.status.error,
  internal: colors.text.secondary,
};

/**
 * Individual badge component for a single tag
 */
const TokenBadge: React.FC<{ tag: string }> = ({ tag }) => {
  const iconName = TAG_ICON_MAP[tag];
  const color = TAG_COLOR_MAP[tag] || colors.text.secondary;

  // Don't render if icon mapping doesn't exist
  if (!iconName) {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
      <Ionicons name={iconName} size={ms(10)} color={color} />
    </View>
  );
};

/**
 * TokenBadges component that displays multiple badges for token tags
 *
 * Displays small icon badges for token characteristics like verification status,
 * community tokens, trending tokens, and more. Each badge uses an appropriate
 * icon and color from the design system.
 *
 * @example
 * ```tsx
 * <TokenBadges tags={['verified', 'community', 'birdeye-trending']} />
 * ```
 */
const TokenBadges: React.FC<TokenBadgesProps> = ({ tags }) => {
  // Don't render anything if no tags
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {tags.map((tag) => (
        <TokenBadge key={tag} tag={tag} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    flexWrap: 'wrap',
    marginLeft: s(spacing.sm),
  },
  badge: {
    width: s(componentSizes.iconSizeXSmall),
    height: vs(componentSizes.iconSizeXSmall),
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TokenBadges;
