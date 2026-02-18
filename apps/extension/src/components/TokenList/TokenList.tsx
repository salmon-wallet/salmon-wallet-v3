/**
 * TokenList - Scrollable token list component
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses responsive scaling (s, vs, ms) from shared to match mobile proportions.
 */
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  componentSizes,
  s,
  vs,
  ms,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import TokenListItem from './TokenListItem';
import type { TokenListProps, TokenListSkeletonProps } from './types';

const Container = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const ListContent = styled(Box)<{ $maxHeight?: number | string }>(({ $maxHeight }) => ({
  padding: `${vs(spacing.sm)}px 0`,
  overflowY: $maxHeight ? 'auto' : 'visible',
  maxHeight: $maxHeight || 'none',
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
  padding: `${vs(spacing.md)}px ${s(spacing.lg)}px`,
  gap: s(spacing.md),
});

const SkeletonLogo = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
  flexShrink: 0,
});

const SkeletonTextContainer = styled(Box)({
  flex: 1,
});

const SkeletonText = styled(Skeleton)({
  backgroundColor: colors.skeleton.base,
});

const SkeletonValueContainer = styled(Box)({
  alignItems: 'flex-end',
});

const tokenIconSize = s(componentSizes.tokenIcon);

/**
 * TokenListSkeleton - Loading placeholder for token list
 */
export function TokenListSkeleton({ count = 5 }: TokenListSkeletonProps) {
  return (
    <Container>
      <ListContent>
        {Array.from({ length: count }).map((_, index) => (
          <BlurContainer
            key={index}
            borderWidth={borderWidth.tokenListItem}
            style={{ borderRadius: ms(borderRadius.lg), marginBottom: vs(spacing.sm), overflow: 'hidden' }}
          >
            <SkeletonContainer>
              <SkeletonLogo variant="circular" width={tokenIconSize} height={tokenIconSize} />
              <SkeletonTextContainer>
                <SkeletonText variant="text" width="60%" height={ms(16)} sx={{ mb: 0.5 }} />
                <SkeletonText variant="text" width="40%" height={ms(14)} />
              </SkeletonTextContainer>
              <SkeletonValueContainer>
                <SkeletonText variant="text" width={s(60)} height={ms(16)} sx={{ mb: 0.5 }} />
                <SkeletonText variant="text" width={s(40)} height={ms(14)} />
              </SkeletonValueContainer>
            </SkeletonContainer>
          </BlurContainer>
        ))}
      </ListContent>
    </Container>
  );
}

export function TokenList({
  tokens,
  loading = false,
  onTokenPress,
  hiddenBalance = false,
  blockchain,
  maxHeight,
  style,
  className,
}: TokenListProps) {
  if (loading) {
    return <TokenListSkeleton count={5} />;
  }

  return (
    <Container style={style} className={className}>
      <ListContent $maxHeight={maxHeight}>
        {tokens.map((token) => (
          <TokenListItem
            key={token.address}
            token={token}
            onPress={onTokenPress}
            hiddenBalance={hiddenBalance}
            blockchain={blockchain}
          />
        ))}
      </ListContent>
    </Container>
  );
}

export default TokenList;
