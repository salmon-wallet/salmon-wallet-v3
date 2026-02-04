import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, ms, s, spacing, vs } from '@salmon/shared';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { BlurContainer } from '../BlurContainer';

interface TokenBadgesSectionProps {
  tags?: string[];
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * Badge configuration with icon, color, and human-readable label
 */
interface BadgeConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

/**
 * Complete mapping of token tags to their visual representation
 */
const BADGE_CONFIG: Record<string, BadgeConfig> = {
  // Verification & trust tags
  verified: {
    icon: 'checkmark-circle',
    color: colors.palette.green,
    label: 'Verified',
  },
  strict: {
    icon: 'shield',
    color: colors.palette.amber,
    label: 'Strict',
  },
  major: {
    icon: 'trophy',
    color: colors.palette.amber,
    label: 'Major',
  },
  'moonshot-verified': {
    icon: 'shield-checkmark',
    color: colors.palette.cyan,
    label: 'Moonshot',
  },

  // Community tags
  community: {
    icon: 'people',
    color: colors.palette.blue,
    label: 'Community',
  },
  'community-assist': {
    icon: 'hand-right',
    color: colors.palette.blue,
    label: 'Community Assist',
  },

  // Token types
  lst: {
    icon: 'water',
    color: colors.palette.cyan,
    label: 'LST',
  },
  'original-lst': {
    icon: 'medal',
    color: colors.palette.cyan,
    label: 'Original LST',
  },
  stable: {
    icon: 'logo-usd',
    color: colors.palette.green,
    label: 'Stablecoin',
  },
  'token-2022': {
    icon: 'cube',
    color: colors.palette.purple,
    label: 'Token-2022',
  },
  yb: {
    icon: 'analytics',
    color: colors.palette.indigo,
    label: 'Yield Bearing',
  },

  // Launchpad & trading
  launchpad: {
    icon: 'rocket',
    color: colors.palette.pink,
    label: 'Launchpad',
  },
  moonshot: {
    icon: 'moon',
    color: colors.palette.purple,
    label: 'Moonshot',
  },
  'birdeye-trending': {
    icon: 'trending-up',
    color: colors.palette.orange,
    label: 'Trending',
  },
  'pumpfun-graduates': {
    icon: 'school',
    color: colors.palette.pink,
    label: 'Pump.fun',
  },

  // Financial products
  'jup-lend-earn': {
    icon: 'cash',
    color: colors.palette.green,
    label: 'Jupiter Lend',
  },
  prestocks: {
    icon: 'bar-chart',
    color: colors.palette.blue,
    label: 'Pre-stocks',
  },
  xstocks: {
    icon: 'pie-chart',
    color: colors.palette.indigo,
    label: 'X-stocks',
  },

  // Registry & metadata
  'old-registry': {
    icon: 'document-text',
    color: colors.text.secondary,
    label: 'Legacy Registry',
  },
  'solana-fm': {
    icon: 'search',
    color: colors.palette.indigo,
    label: 'Solana FM',
  },
  wormhole: {
    icon: 'link',
    color: colors.palette.purple,
    label: 'Wormhole',
  },
  deduplicated: {
    icon: 'git-branch',
    color: colors.text.tertiary,
    label: 'Deduplicated',
  },
  duplicate: {
    icon: 'copy',
    color: colors.text.tertiary,
    label: 'Duplicate',
  },
  deprecated: {
    icon: 'warning',
    color: colors.status.error,
    label: 'Deprecated',
  },
  internal: {
    icon: 'lock-closed',
    color: colors.text.secondary,
    label: 'Internal',
  },
};

/**
 * Individual badge item with icon and label
 */
const BadgeItem: React.FC<{ tag: string }> = ({ tag }) => {
  const config = BADGE_CONFIG[tag];

  if (!config) {
    return null;
  }

  return (
    <View style={styles.badgeItem}>
      <View style={[styles.badgeIcon, { backgroundColor: `${config.color}15` }]}>
        <Ionicons name={config.icon} size={ms(18)} color={config.color} />
      </View>
      <Text style={[styles.badgeLabel, { color: config.color }]} numberOfLines={1}>
        {config.label}
      </Text>
    </View>
  );
};

/**
 * TokenBadgesSection component for displaying all token tags/badges
 * Shows verification status, token type, community info, and more
 * Each badge displays an icon with its name below for clarity
 */
export const TokenBadgesSection: React.FC<TokenBadgesSectionProps> = ({
  tags,
  loading = false,
  style,
}) => {
  if (loading) {
    return (
      <BlurContainer style={[styles.glassWrapper, style]}>
        <View style={styles.container}>
          <ContentLoader
            speed={1.5}
            width="100%"
            height={80}
            backgroundColor={colors.skeleton.base}
            foregroundColor={colors.skeleton.highlight}
          >
            <Rect x="0" y="0" rx="4" ry="4" width="60" height="18" />
            <Rect x="0" y="30" rx="4" ry="4" width="50" height="40" />
            <Rect x="60" y="30" rx="4" ry="4" width="50" height="40" />
            <Rect x="120" y="30" rx="4" ry="4" width="50" height="40" />
          </ContentLoader>
        </View>
      </BlurContainer>
    );
  }

  // Filter to only known tags
  const validTags = tags?.filter((tag) => BADGE_CONFIG[tag]) || [];

  // Return null if no valid tags
  if (validTags.length === 0) {
    return null;
  }

  return (
    <BlurContainer style={[styles.glassWrapper, style]}>
      <View style={styles.container}>
        <Text style={styles.title}>Badges</Text>
        <View style={styles.badgesContainer}>
          {validTags.map((tag) => (
            <BadgeItem key={tag} tag={tag} />
          ))}
        </View>
      </View>
    </BlurContainer>
  );
};

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: 18,
    marginHorizontal: s(spacing['2xl']),
    overflow: 'hidden',
  },
  container: {
    padding: s(spacing.md),
  },
  title: {
    fontSize: ms(14),
    fontFamily: 'DMSansSemiBold',
    color: colors.text.primary,
    marginBottom: vs(spacing.md),
    letterSpacing: ms(-0.07, 0.3),
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(spacing.lg),
  },
  badgeItem: {
    alignItems: 'center',
    minWidth: s(55),
  },
  badgeIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(spacing.xs),
  },
  badgeLabel: {
    fontSize: ms(10),
    fontFamily: 'DMSansMedium',
    textAlign: 'center',
    letterSpacing: ms(-0.05, 0.3),
  },
});

export default TokenBadgesSection;
