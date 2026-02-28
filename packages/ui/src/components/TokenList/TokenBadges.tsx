/**
 * TokenBadges - Displays small icon badges for token tags
 *
 * Web version using MUI icons and @emotion/styled for browser extension.
 * Adapted from the mobile React Native implementation.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CubeIcon from '@mui/icons-material/ViewInAr';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import NightlightIcon from '@mui/icons-material/Nightlight';
import PanToolIcon from '@mui/icons-material/PanTool';
import PieChartIcon from '@mui/icons-material/PieChart';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import Box from '@mui/material/Box';
import { colors, spacing, borderRadius, s, vs, ms } from '@salmon/shared';
import { styled } from '../../utils/styled';
import type { TokenBadgesProps } from './types';

/**
 * Mapping of token tags to MUI icon components
 */
const TAG_ICON_MAP: Record<string, SvgIconComponent> = {
  // Verification & trust tags
  verified: CheckCircleIcon,
  strict: ShieldIcon,
  major: EmojiEventsIcon,
  'moonshot-verified': VerifiedUserIcon,

  // Community tags
  community: GroupIcon,
  'community-assist': PanToolIcon,

  // Token types
  lst: WaterDropIcon,
  'original-lst': MilitaryTechIcon,
  stable: AttachMoneyIcon,
  'token-2022': CubeIcon,
  yb: AnalyticsIcon,

  // Launchpad & trading
  launchpad: RocketLaunchIcon,
  moonshot: NightlightIcon,
  'birdeye-trending': TrendingUpIcon,
  'pumpfun-graduates': SchoolIcon,

  // Financial products
  'jup-lend-earn': MonetizationOnIcon,
  prestocks: BarChartIcon,
  xstocks: PieChartIcon,

  // Registry & metadata
  'old-registry': DescriptionIcon,
  'solana-fm': SearchIcon,
  wormhole: LinkIcon,
  deduplicated: ForkRightIcon,
  duplicate: ContentCopyIcon,
  deprecated: WarningIcon,
  internal: LockIcon,
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

// --- Styled components ---

const BadgesContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: s(spacing.xs),
  flexWrap: 'nowrap',
  flexShrink: 0,
  marginLeft: s(spacing.sm),
});

const BadgeBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$bgColor',
})<{ $bgColor: string }>(({ $bgColor }) => ({
  width: s(18),
  height: vs(18),
  borderRadius: borderRadius.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: $bgColor,
}));

/**
 * Individual badge component for a single tag
 */
function TokenBadge({ tag }: { tag: string }) {
  const IconComponent = TAG_ICON_MAP[tag];
  const color = TAG_COLOR_MAP[tag] || colors.text.secondary;

  // Don't render if icon mapping doesn't exist
  if (!IconComponent) {
    return null;
  }

  return (
    <BadgeBox $bgColor={`${color}15`}>
      <IconComponent sx={{ fontSize: ms(10), color }} />
    </BadgeBox>
  );
}

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
export function TokenBadges({ tags }: TokenBadgesProps) {
  // Don't render anything if no tags
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <BadgesContainer>
      {tags.map((tag) => (
        <TokenBadge key={tag} tag={tag} />
      ))}
    </BadgesContainer>
  );
}

export default TokenBadges;
