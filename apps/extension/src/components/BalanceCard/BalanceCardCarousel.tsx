/**
 * BalanceCardCarousel - Arrow-based navigation carousel for BalanceCard
 *
 * Web version replacing mobile's swipe gesture with left/right arrow buttons.
 * CSS transition on gradient change for smooth color fade (~350ms).
 */
import { useState, useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import { colors, spacing, borderRadius } from '@salmon/shared';
import { BalanceCard } from './BalanceCard';
import type { BalanceCardCarouselProps } from './types';

const CarouselWrapper = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
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
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  color: colors.text.primary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const CardContainer = styled(Box)({
  flex: 1,
  transition: 'background 350ms ease',
});

export function BalanceCardCarousel({
  blockchains,
  hiddenBalance,
  onToggleVisibility,
  onBlockchainChange,
  activeIndex: controlledIndex,
  showNetworkLabel = false,
  style,
  className,
}: BalanceCardCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = controlledIndex ?? internalIndex;
  const hasMultiple = blockchains.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setInternalIndex(index);
      const bc = blockchains[index];
      if (bc) {
        onBlockchainChange?.(bc.network.blockchain, index);
      }
    },
    [blockchains, onBlockchainChange],
  );

  const goLeft = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goRight = useCallback(() => {
    if (currentIndex < blockchains.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, blockchains.length, goTo]);

  if (blockchains.length === 0) return null;

  const current = blockchains[currentIndex];
  if (!current) return null;

  return (
    <CarouselWrapper style={style} className={className}>
      {hasMultiple && (
        <LeftArrow
          $visible={currentIndex > 0}
          onClick={goLeft}
          aria-label="Previous blockchain"
        >
          ‹
        </LeftArrow>
      )}

      <CardContainer>
        <BalanceCard
          network={current.network}
          blockchain={current.network.blockchain}
          usdTotal={current.usdTotal}
          changePercent={current.changePercent}
          changeAmount={current.changeAmount}
          hiddenBalance={hiddenBalance}
          onToggleVisibility={onToggleVisibility}
          loading={current.loading}
          showNetworkLabel={showNetworkLabel}
          currentIndex={currentIndex}
          totalCount={blockchains.length}
        />
      </CardContainer>

      {hasMultiple && (
        <RightArrow
          $visible={currentIndex < blockchains.length - 1}
          onClick={goRight}
          aria-label="Next blockchain"
        >
          ›
        </RightArrow>
      )}
    </CarouselWrapper>
  );
}

export default BalanceCardCarousel;
