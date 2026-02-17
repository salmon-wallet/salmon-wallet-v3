/**
 * TokenDetailPage - Full-page token detail view
 *
 * Replaces the former TokenInformationSheet dialog.
 * Renders as a full page with back navigation, matching the
 * page-navigation pattern used by other extension pages.
 *
 * Content: price chart, token item, market data, badges, about.
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { colors, spacing } from '@salmon/shared';

import { PriceChart } from '../PriceChart';
import { TokenListItem } from '../TokenList';
import { TokenMarketData } from '../TokenMarketData';
import { TokenAbout } from '../TokenAbout';
import { ScalesBackground } from '../ScalesBackground';
import { TokenBadgesSection } from './TokenBadgesSection';
import type { TokenDetailPageProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.background.secondary,
  position: 'relative',
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const Title = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const ScrollContent = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
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

const TokenListItemSkeleton: React.FC = () => {
  return (
    <TokenItemSkeletonContainer>
      <Skeleton
        variant="circular"
        width={36}
        height={36}
        sx={{ bgcolor: colors.skeleton.base, flexShrink: 0 }}
      />
      <SkeletonTextColumn>
        <Skeleton variant="text" width={100} height={14} sx={{ bgcolor: colors.skeleton.base }} />
        <Skeleton variant="text" width={80} height={12} sx={{ bgcolor: colors.skeleton.base }} />
      </SkeletonTextColumn>
      <SkeletonValueColumn>
        <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: colors.skeleton.base }} />
        <Skeleton variant="text" width={40} height={12} sx={{ bgcolor: colors.skeleton.base }} />
      </SkeletonValueColumn>
    </TokenItemSkeletonContainer>
  );
};

// ============================================================================
// TokenDetailPage Component
// ============================================================================

export function TokenDetailPage({
  token,
  blockchain = 'solana',
  chartData,
  chartPeriod,
  onChartPeriodChange,
  coinInfo,
  marketData,
  loading = false,
  onBack,
  style,
  className,
}: TokenDetailPageProps): React.ReactElement {
  const handleTokenPress = useCallback(() => {
    // No action needed - token is already selected
  }, []);

  return (
    <Container style={style} className={className}>
      <ScalesBackground style={{ zIndex: 0 }} />

      <Header>
        <BackButton onClick={onBack} aria-label="Back">
          <ArrowBackIcon />
        </BackButton>
        <Title>Token Information</Title>
      </Header>

      <ScrollContent>
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
              blockchain={blockchain}
            />
          )}

          {/* TokenMarketData (Info) */}
          <TokenMarketData
            data={marketData}
            symbol={token.symbol}
            title="Info"
            loading={loading}
          />

          {/* TokenBadgesSection */}
          <TokenBadgesSection
            tags={token.tags}
            loading={loading}
          />

          {/* TokenAbout */}
          <TokenAbout
            description={coinInfo?.description}
            loading={loading}
          />
        </ContentContainer>
      </ScrollContent>
    </Container>
  );
}

export default TokenDetailPage;
