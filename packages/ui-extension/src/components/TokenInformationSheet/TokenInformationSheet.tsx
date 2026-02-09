/**
 * TokenInformationSheet - Dialog for displaying detailed token information
 *
 * Web version using MUI Dialog for browser extension.
 * Migrated from React Native TokenInformationSheet (bottom sheet modal).
 *
 * Features:
 * - MUI Dialog container following WalletSwitcherSheet pattern
 * - Scrollable content with token information sub-components
 * - Price chart, market data, badges, and about sections
 * - Loading skeleton states
 * - ScalesBackground decorative pattern
 *
 * @example
 * ```tsx
 * <TokenInformationSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   token={selectedToken}
 *   chartData={priceData}
 *   chartPeriod="1M"
 *   onChartPeriodChange={setPeriod}
 *   coinInfo={coinInfo}
 *   marketData={marketData}
 *   loading={false}
 * />
 * ```
 */

import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import CloseIcon from '@mui/icons-material/Close';

import {
  colors,
  spacing,
  borderRadius,
} from '@salmon/shared';

import { PriceChart } from '../PriceChart';
import { TokenListItem } from '../TokenList';
import { TokenMarketData } from '../TokenMarketData';
import { TokenAbout } from '../TokenAbout';
import { ScalesBackground } from '../ScalesBackground';
import { TokenBadgesSection } from './TokenBadgesSection';
import type { TokenInformationSheetProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.border.default}`,
    minWidth: 380,
    maxWidth: 440,
    maxHeight: '85vh',
    overflow: 'hidden',
    position: 'relative',
  },
});

const StyledDialogTitle = styled(DialogTitle)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 2,
});

const TitleText = styled(Typography)({
  fontSize: 20,
  fontWeight: 800,
  color: colors.text.primary,
  letterSpacing: -0.12,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: colors.border.default,
    borderRadius: 2,
  },
});

const ContentContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  padding: `${spacing.lg}px ${spacing.xl}px`,
  paddingBottom: spacing['2xl'],
});

const TokenItemSkeletonContainer = styled(Box)({
  backgroundColor: colors.background.tokenItem,
  borderRadius: 12,
  overflow: 'hidden',
  padding: `${spacing.md}px`,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
});

const SkeletonTextColumn = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

const SkeletonValueColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 4,
});

// ============================================================================
// TokenListItemSkeleton Component
// ============================================================================

/**
 * TokenListItem skeleton for loading state
 */
const TokenListItemSkeleton: React.FC = () => {
  return (
    <TokenItemSkeletonContainer>
      {/* Logo circle */}
      <Skeleton
        variant="circular"
        width={36}
        height={36}
        sx={{ bgcolor: colors.skeleton.base, flexShrink: 0 }}
      />
      {/* Token name & price info */}
      <SkeletonTextColumn>
        <Skeleton
          variant="text"
          width={100}
          height={14}
          sx={{ bgcolor: colors.skeleton.base }}
        />
        <Skeleton
          variant="text"
          width={80}
          height={12}
          sx={{ bgcolor: colors.skeleton.base }}
        />
      </SkeletonTextColumn>
      {/* USD value & token amount */}
      <SkeletonValueColumn>
        <Skeleton
          variant="text"
          width={60}
          height={16}
          sx={{ bgcolor: colors.skeleton.base }}
        />
        <Skeleton
          variant="text"
          width={40}
          height={12}
          sx={{ bgcolor: colors.skeleton.base }}
        />
      </SkeletonValueColumn>
    </TokenItemSkeletonContainer>
  );
};

// ============================================================================
// TokenInformationSheet Component
// ============================================================================

export function TokenInformationSheet({
  visible,
  onClose,
  token,
  chartData,
  chartPeriod,
  onChartPeriodChange,
  coinInfo,
  marketData,
  loading = false,
  style,
  className,
}: TokenInformationSheetProps): React.ReactElement | null {
  // Handle token press (no-op for display purposes)
  const handleTokenPress = useCallback(() => {
    // No action needed - token is already selected
  }, []);

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="token-information-title"
      className={className}
      PaperProps={{
        style,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: colors.dialog.overlay,
          },
        },
      }}
    >
      {/* Scales Background - positioned behind content */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: `${borderRadius.xl}px`,
        }}
      >
        <ScalesBackground />
      </Box>

      {/* Title Header */}
      <StyledDialogTitle id="token-information-title">
        <TitleText>Token Information</TitleText>
        <CloseButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      {/* Scrollable Content */}
      <StyledDialogContent>
        <ContentContainer>
          {/* PriceChart - full width */}
          {(loading || chartData.length > 0) && (
            <PriceChart
              data={chartData}
              selectedPeriod={chartPeriod}
              onPeriodChange={onChartPeriodChange}
              loading={loading}
              style={{ margin: `0 -${spacing.xl}px` }}
            />
          )}

          {/* TokenListItem */}
          {loading ? (
            <TokenListItemSkeleton />
          ) : (
            <TokenListItem
              token={token}
              onPress={handleTokenPress}
              hiddenBalance={false}
            />
          )}

          {/* TokenMarketData (Info) */}
          <TokenMarketData
            data={marketData}
            symbol={token.symbol}
            title="Info"
            loading={loading}
          />

          {/* TokenBadgesSection - Before About */}
          <TokenBadgesSection
            tags={token.tags}
            loading={loading}
          />

          {/* TokenAbout - At the bottom */}
          <TokenAbout
            description={coinInfo?.description}
            loading={loading}
          />
        </ContentContainer>
      </StyledDialogContent>
    </StyledDialog>
  );
}

export default TokenInformationSheet;
