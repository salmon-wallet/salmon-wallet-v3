/**
 * TokenList - Scrollable token list component
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { colors, spacing, borderRadius } from '@salmon/shared';
import type { Token } from '@salmon/shared';
import TokenListItem from './TokenListItem';
import type { TokenListProps, TokenListSkeletonProps } from './types';

const Container = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const ListContent = styled(Box)<{ maxHeight?: number | string }>(({ maxHeight }) => ({
  padding: `${spacing.sm}px 0`,
  overflowY: maxHeight ? 'auto' : 'visible',
  maxHeight: maxHeight || 'none',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: colors.border.default,
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: colors.text.secondary,
  },
}));

const SkeletonContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: borderRadius.lg,
  marginBottom: spacing.sm,
});

const SkeletonLogo = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
});

const SkeletonTextContainer = styled(Box)({
  flex: 1,
  marginLeft: spacing.md,
});

const SkeletonText = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
});

const SkeletonValueContainer = styled(Box)({
  alignItems: 'flex-end',
  marginLeft: spacing.sm,
});

/**
 * TokenListSkeleton - Loading placeholder for token list
 */
export function TokenListSkeleton({ count = 5 }: TokenListSkeletonProps) {
  return (
    <Container>
      <ListContent>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonContainer key={index}>
            <SkeletonLogo variant="circular" width={48} height={48} />
            <SkeletonTextContainer>
              <SkeletonText variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
              <SkeletonText variant="text" width="40%" height={16} />
            </SkeletonTextContainer>
            <SkeletonValueContainer>
              <SkeletonText variant="text" width={60} height={20} sx={{ mb: 0.5 }} />
              <SkeletonText variant="text" width={40} height={16} />
            </SkeletonValueContainer>
          </SkeletonContainer>
        ))}
      </ListContent>
    </Container>
  );
}

/**
 * TokenList component for displaying a list of cryptocurrency tokens
 *
 * Displays token information including logo, name, balance, USD value,
 * and 24-hour price change. Shows a skeleton loader while data is loading.
 *
 * @example
 * ```tsx
 * const tokens = [
 *   {
 *     address: 'So11111111111111111111111111111111111111112',
 *     name: 'Solana',
 *     symbol: 'SOL',
 *     logo: 'https://...',
 *     uiAmount: '10.5',
 *     usdBalance: 1050.00,
 *     last24HoursChange: { perc: 5.2 }
 *   },
 *   // ... more tokens
 * ];
 *
 * <TokenList
 *   tokens={tokens}
 *   loading={false}
 *   onTokenPress={(token) => navigate(`/token/${token.address}`)}
 *   hiddenBalance={false}
 *   maxHeight={400}
 * />
 * ```
 */
export function TokenList({
  tokens,
  loading = false,
  onTokenPress,
  hiddenBalance = false,
  maxHeight,
  style,
  className,
}: TokenListProps) {
  // Show skeleton while loading
  if (loading) {
    return <TokenListSkeleton count={5} />;
  }

  return (
    <Container style={style} className={className}>
      <ListContent maxHeight={maxHeight}>
        {tokens.map((token) => (
          <TokenListItem
            key={token.address}
            token={token}
            onPress={onTokenPress}
            hiddenBalance={hiddenBalance}
          />
        ))}
      </ListContent>
    </Container>
  );
}

export default TokenList;
