/**
 * NftCarouselSection - Horizontal NFT carousel with arrow navigation
 *
 * Netflix-style section for a single blockchain's NFTs.
 * Arrow button styling mirrors BalanceCardCarousel.
 */
import { useState, useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, borderRadius, type NftBlockchain } from '@salmon/shared';
import { NftCard } from '../NftCard';
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon, ChevronRightIcon } from '../Icon';
import { NftCarouselSectionSkeleton } from './NftCarouselSectionSkeleton';
import type { NftCarouselSectionProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const CARD_WIDTH = 194;
const CARD_GAP = 9;
const VISIBLE_COUNT = 2;

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

const HeaderButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: colors.text.primary,
  transition: 'opacity 0.2s ease',
  '&:hover': {
    opacity: 0.75,
  },
});

const Title = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  flex: 1,
  textAlign: 'left',
});

const Count = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

const CarouselWrapper = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const Strip = styled(Box)({
  display: 'flex',
  gap: CARD_GAP,
  transition: 'transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
});

const ArrowButton = styled('button')<{ $visible: boolean }>(({ $visible }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: 28,
  height: 28,
  borderRadius: borderRadius.full,
  border: 'none',
  padding: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  color: colors.text.primary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  lineHeight: 1,
  fontSize: 16,
  fontWeight: 600,
  opacity: $visible ? 1 : 0,
  pointerEvents: $visible ? 'auto' : 'none',
  transition: 'opacity 200ms ease, background-color 200ms ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
}));

const LeftArrow = styled(ArrowButton)({
  left: spacing.xs,
});

const RightArrow = styled(ArrowButton)({
  right: spacing.xs,
});

// ============================================================================
// Helpers
// ============================================================================

function getBlockchainIcon(blockchain: NftBlockchain) {
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon sx={{ width: 24, height: 24 }} />;
    case 'ethereum':
      return <EthereumSvgIcon sx={{ width: 24, height: 24 }} />;
    case 'bitcoin':
      return <BitcoinSvgIcon sx={{ width: 24, height: 24 }} />;
  }
}

// ============================================================================
// Component
// ============================================================================

export function NftCarouselSection({
  title,
  blockchain,
  nfts,
  loading,
  onNftPress,
  onSeeAllPress,
  style,
  className,
}: NftCarouselSectionProps) {
  const [windowStart, setWindowStart] = useState(0);

  const goLeft = useCallback(() => {
    setWindowStart((prev) => Math.max(0, prev - 1));
  }, []);

  const goRight = useCallback(() => {
    setWindowStart((prev) => Math.min(nfts.length - VISIBLE_COUNT, prev + 1));
  }, [nfts.length]);

  if (loading) {
    return <NftCarouselSectionSkeleton style={style} className={className} />;
  }

  if (nfts.length === 0) return null;

  const showLeftArrow = windowStart > 0;
  const showRightArrow = windowStart + VISIBLE_COUNT < nfts.length;
  const translateX = -windowStart * (CARD_WIDTH + CARD_GAP);

  return (
    <Container style={style} className={className}>
      {/* Header */}
      <HeaderButton onClick={onSeeAllPress} aria-label={`See all ${title}`}>
        {getBlockchainIcon(blockchain)}
        <Title>{title}</Title>
        <Count>({nfts.length})</Count>
        <ChevronRightIcon sx={{ width: 18, height: 18, color: colors.text.secondary }} />
      </HeaderButton>

      {/* Carousel */}
      <CarouselWrapper>
        {nfts.length > VISIBLE_COUNT && (
          <LeftArrow $visible={showLeftArrow} onClick={goLeft} aria-label="Previous NFTs">
            &#8249;
          </LeftArrow>
        )}

        <Strip style={{ transform: `translateX(${translateX}px)` }}>
          {nfts.map((nft, index) => (
            <NftCard
              key={`${nft.mint}-${index}`}
              nft={nft}
              onPress={onNftPress ? () => onNftPress(nft) : undefined}
            />
          ))}
        </Strip>

        {nfts.length > VISIBLE_COUNT && (
          <RightArrow $visible={showRightArrow} onClick={goRight} aria-label="Next NFTs">
            &#8250;
          </RightArrow>
        )}
      </CarouselWrapper>
    </Container>
  );
}
