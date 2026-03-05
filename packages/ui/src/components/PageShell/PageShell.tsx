/**
 * PageShell - Shared page layout wrapper for full-page extension views
 *
 * Eliminates the duplicated Container / Header / BackButton / HeaderTitle /
 * ScrollContent pattern that appears identically in:
 *   TokenDetailPage, TransactionHistoryPage, NftDetailPage,
 *   NftSeeAllPage, SendPage, and SettingsPanelContent.
 *
 * Usage:
 *   <PageShell title="Token Information" onBack={onBack} showScalesBackground>
 *     {/* page-specific content *\/}
 *   </PageShell>
 */

import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { colors, spacing, fontFamily, fontWeight, fontSize } from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';

// ============================================================================
// Types
// ============================================================================

export interface PageShellProps {
  /** Page header title */
  title: React.ReactNode;
  /** Callback when the back button is pressed */
  onBack: () => void;
  /** Page body content rendered inside the scrollable area */
  children: React.ReactNode;
  /**
   * Background colour variant.
   * - 'secondary' (default) — used by TokenDetailPage, NftDetailPage, etc.
   * - 'primary' — used by SettingsPanelContent
   */
  backgroundColor?: 'primary' | 'secondary';
  /**
   * Whether the header height mode uses `height: 100vh` (default) or
   * `minHeight: 100vh` (used by SettingsPanelContent whose content can exceed
   * the viewport).
   */
  fullHeight?: boolean;
  /**
   * Render the decorative ScalesBackground behind the content.
   * Off by default; enable for token/NFT/send pages.
   */
  showScalesBackground?: boolean;
  /**
   * Extra props forwarded to <ScalesBackground />.
   * Only meaningful when showScalesBackground is true.
   * Use this to pass custom strokeColor / strokeWidth / patternHeight / style.
   */
  scalesBackgroundProps?: React.ComponentProps<typeof ScalesBackground>;
  /**
   * Optional node rendered on the right side of the header (e.g. a refresh
   * button).  The title automatically flexes to fill remaining space so this
   * node stays pinned to the right edge.
   */
  headerRight?: React.ReactNode;
  /**
   * Extra inline styles applied to the ScrollContent wrapper.
   * Use this to add padding when the page owns it at the scroll level
   * (e.g. TransactionHistoryPage).
   */
  scrollContentStyle?: React.CSSProperties;
  /**
   * Additional props forwarded verbatim to the ScrollContent Box.
   * Use this for page-level ref forwarding, onScroll handlers, etc.
   * (e.g. TransactionHistoryPage passes ref + onScroll for infinite scroll).
   */
  scrollContentProps?: React.ComponentPropsWithRef<'div'>;
  /**
   * Optional max-width in pixels. When provided, the Container is centred
   * horizontally with `margin: 0 auto` — useful for the standalone web app.
   */
  maxWidth?: number;
  /** Optional className forwarded to the outermost Container */
  className?: string;
  /** Optional inline style forwarded to the outermost Container */
  style?: React.CSSProperties;
}

// ============================================================================
// Shared Styled Components
// ============================================================================

export const Container = styled(Box)<{
  $backgroundColor: string;
  $fullHeight: boolean;
  $maxWidth?: number;
}>(({ $backgroundColor, $fullHeight, $maxWidth }) => ({
  display: 'flex',
  flexDirection: 'column',
  ...($fullHeight ? { height: '100vh' } : { minHeight: '100vh' }),
  backgroundColor: $backgroundColor,
  position: 'relative',
  ...($maxWidth != null && { maxWidth: $maxWidth, margin: '0 auto', width: '100%' }),
}));

export const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

export const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: colors.background.card,
  },
});

export const HeaderTitle = styled(Typography)({
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
});

export const ScrollContent = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
});

// ============================================================================
// PageShell Component
// ============================================================================

export function PageShell({
  title,
  onBack,
  children,
  backgroundColor = 'secondary',
  fullHeight = true,
  showScalesBackground = false,
  scalesBackgroundProps,
  headerRight,
  scrollContentStyle,
  scrollContentProps,
  maxWidth,
  className,
  style,
}: PageShellProps): React.ReactElement {
  const resolvedBg =
    backgroundColor === 'primary'
      ? colors.background.primary
      : colors.background.secondary;

  return (
    <Container
      $backgroundColor={resolvedBg}
      $fullHeight={fullHeight}
      $maxWidth={maxWidth}
      className={className}
      style={style}
    >
      {showScalesBackground && (
        <ScalesBackground style={{ zIndex: 0 }} {...scalesBackgroundProps} />
      )}

      <Header>
        <BackButton onClick={onBack} aria-label="Back">
          <ArrowBackIcon />
        </BackButton>
        <HeaderTitle>{title}</HeaderTitle>
        {headerRight}
      </Header>

      <ScrollContent style={scrollContentStyle} {...scrollContentProps}>
        {children}
      </ScrollContent>
    </Container>
  );
}

export default PageShell;
