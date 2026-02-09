/**
 * TokenBadgesSection - Displays token tags/badges in a grid
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Migrated from React Native TokenBadgesSection component.
 *
 * Shows verification status, token type, community info, and more.
 * Each badge displays an icon with its name below for clarity.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

// MUI Icons - mapped from Ionicons equivalents
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShieldIcon from '@mui/icons-material/Shield';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GroupIcon from '@mui/icons-material/Group';
import PanToolIcon from '@mui/icons-material/PanTool';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import SavingsIcon from '@mui/icons-material/Savings';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';

import { colors, spacing } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { TokenBadgesSectionProps } from './types';

// ============================================================================
// Badge Configuration
// ============================================================================

/**
 * Badge configuration with icon component, color, and human-readable label
 */
interface BadgeConfig {
  icon: React.ElementType;
  color: string;
  label: string;
}

/**
 * Complete mapping of token tags to their visual representation
 */
const BADGE_CONFIG: Record<string, BadgeConfig> = {
  // Verification & trust tags
  verified: {
    icon: CheckCircleIcon,
    color: colors.palette.green,
    label: 'Verified',
  },
  strict: {
    icon: ShieldIcon,
    color: colors.palette.amber,
    label: 'Strict',
  },
  major: {
    icon: EmojiEventsIcon,
    color: colors.palette.amber,
    label: 'Major',
  },
  'moonshot-verified': {
    icon: VerifiedUserIcon,
    color: colors.palette.cyan,
    label: 'Moonshot',
  },

  // Community tags
  community: {
    icon: GroupIcon,
    color: colors.palette.blue,
    label: 'Community',
  },
  'community-assist': {
    icon: PanToolIcon,
    color: colors.palette.blue,
    label: 'Community Assist',
  },

  // Token types
  lst: {
    icon: WaterDropIcon,
    color: colors.palette.cyan,
    label: 'LST',
  },
  'original-lst': {
    icon: MilitaryTechIcon,
    color: colors.palette.cyan,
    label: 'Original LST',
  },
  stable: {
    icon: AttachMoneyIcon,
    color: colors.palette.green,
    label: 'Stablecoin',
  },
  'token-2022': {
    icon: ViewInArIcon,
    color: colors.palette.purple,
    label: 'Token-2022',
  },
  yb: {
    icon: AnalyticsIcon,
    color: colors.palette.indigo,
    label: 'Yield Bearing',
  },

  // Launchpad & trading
  launchpad: {
    icon: RocketLaunchIcon,
    color: colors.palette.pink,
    label: 'Launchpad',
  },
  moonshot: {
    icon: DarkModeIcon,
    color: colors.palette.purple,
    label: 'Moonshot',
  },
  'birdeye-trending': {
    icon: TrendingUpIcon,
    color: colors.palette.orange,
    label: 'Trending',
  },
  'pumpfun-graduates': {
    icon: SchoolIcon,
    color: colors.palette.pink,
    label: 'Pump.fun',
  },

  // Financial products
  'jup-lend-earn': {
    icon: SavingsIcon,
    color: colors.palette.green,
    label: 'Jupiter Lend',
  },
  prestocks: {
    icon: BarChartIcon,
    color: colors.palette.blue,
    label: 'Pre-stocks',
  },
  xstocks: {
    icon: PieChartIcon,
    color: colors.palette.indigo,
    label: 'X-stocks',
  },

  // Registry & metadata
  'old-registry': {
    icon: DescriptionIcon,
    color: colors.text.secondary,
    label: 'Legacy Registry',
  },
  'solana-fm': {
    icon: SearchIcon,
    color: colors.palette.indigo,
    label: 'Solana FM',
  },
  wormhole: {
    icon: LinkIcon,
    color: colors.palette.purple,
    label: 'Wormhole',
  },
  deduplicated: {
    icon: AccountTreeIcon,
    color: colors.text.tertiary,
    label: 'Deduplicated',
  },
  duplicate: {
    icon: ContentCopyIcon,
    color: colors.text.tertiary,
    label: 'Duplicate',
  },
  deprecated: {
    icon: WarningIcon,
    color: colors.status.error,
    label: 'Deprecated',
  },
  internal: {
    icon: LockIcon,
    color: colors.text.secondary,
    label: 'Internal',
  },
};

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  padding: spacing.md,
});

const Title = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: spacing.md,
  letterSpacing: -0.07,
});

const BadgesGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: spacing.lg,
});

const BadgeItemContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 55,
});

const BadgeIconWrapper = styled(Box)<{ badgeColor: string }>(({ badgeColor }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.xs,
  backgroundColor: `${badgeColor}15`,
}));

const BadgeLabel = styled(Typography)<{ badgeColor: string }>(({ badgeColor }) => ({
  fontSize: 10,
  fontWeight: 500,
  textAlign: 'center',
  letterSpacing: -0.05,
  color: badgeColor,
}));

const SkeletonContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

const SkeletonBadgesRow = styled(Box)({
  display: 'flex',
  gap: spacing.lg,
});

// ============================================================================
// BadgeItem Component
// ============================================================================

/**
 * Individual badge item with icon and label
 */
const BadgeItem: React.FC<{ tag: string }> = ({ tag }) => {
  const config = BADGE_CONFIG[tag];

  if (!config) {
    return null;
  }

  const IconComponent = config.icon;

  return (
    <BadgeItemContainer>
      <BadgeIconWrapper badgeColor={config.color}>
        <IconComponent sx={{ fontSize: 18, color: config.color }} />
      </BadgeIconWrapper>
      <BadgeLabel badgeColor={config.color} noWrap>
        {config.label}
      </BadgeLabel>
    </BadgeItemContainer>
  );
};

// ============================================================================
// TokenBadgesSection Component
// ============================================================================

/**
 * TokenBadgesSection component for displaying all token tags/badges.
 * Shows verification status, token type, community info, and more.
 * Each badge displays an icon with its name below for clarity.
 */
export const TokenBadgesSection: React.FC<TokenBadgesSectionProps> = ({
  tags,
  loading = false,
  style,
  className,
}) => {
  if (loading) {
    return (
      <BlurContainer
        style={{ borderRadius: 18, overflow: 'hidden', ...style }}
        className={className}
      >
        <Container>
          <SkeletonContainer>
            <Skeleton
              variant="text"
              width={60}
              height={18}
              sx={{ bgcolor: colors.skeleton.base }}
            />
            <SkeletonBadgesRow>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ bgcolor: colors.skeleton.base }}
                  />
                  <Skeleton
                    variant="text"
                    width={50}
                    height={12}
                    sx={{ bgcolor: colors.skeleton.base }}
                  />
                </Box>
              ))}
            </SkeletonBadgesRow>
          </SkeletonContainer>
        </Container>
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
    <BlurContainer
      style={{ borderRadius: 18, overflow: 'hidden', ...style }}
      className={className}
    >
      <Container>
        <Title>Badges</Title>
        <BadgesGrid>
          {validTags.map((tag) => (
            <BadgeItem key={tag} tag={tag} />
          ))}
        </BadgesGrid>
      </Container>
    </BlurContainer>
  );
};

export default TokenBadgesSection;
