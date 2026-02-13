/**
 * NftCard - NFT display card for grid layouts
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { colors, fontFamily, fontWeight, borderRadius } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { NftCardProps } from './types';

/**
 * Orange gradient colors for fallback background
 * Gradient: linear-gradient(91.6deg, rgb(255, 92, 69) 12%, rgba(161, 42, 42, 0.9) 83%)
 */
const FALLBACK_GRADIENT =
  'linear-gradient(91.6deg, rgb(255, 92, 69) 12%, rgba(161, 42, 42, 0.9) 83%)';

/** Card dimensions */
const CARD_WIDTH = 194;
const CARD_HEIGHT = 193;
const CARD_BORDER_RADIUS = 18;

const Container = styled(Box)<{ $clickable: boolean }>(({ $clickable }) => ({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  borderRadius: CARD_BORDER_RADIUS,
  overflow: 'hidden',
  position: 'relative',
  cursor: $clickable ? 'pointer' : 'default',
  boxShadow: '0px 3px 9px rgba(0, 0, 0, 0.4)',
  transition: 'opacity 0.2s ease',
  flexShrink: 0,
  '&:hover': $clickable
    ? {
        opacity: 0.85,
      }
    : {},
  '&:active': $clickable
    ? {
        opacity: 0.8,
      }
    : {},
}));

const NftImage = styled('img')({
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  objectFit: 'cover',
});

const FallbackGradient = styled(Box)({
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  background: FALLBACK_GRADIENT,
});

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const NameBadgeContainer = styled(Box)({
  position: 'absolute',
  bottom: 8,
  left: 8,
  right: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const NameText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 13,
  fontWeight: fontWeight.semibold,
  color: '#e0e0e0',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  // Position above the BlurContainer pseudo-element overlay
  position: 'relative',
  zIndex: 1,
});

/**
 * NftCard component for displaying NFTs in a grid layout
 *
 * Features:
 * - ~194x193px card with 18px border radius
 * - NFT image covers the entire card
 * - Orange gradient fallback when no image or image fails to load
 * - Name badge at bottom with glassmorphism effect
 * - Accessible with press handling
 *
 * @example
 * ```tsx
 * <NftCard
 *   nft={{
 *     mint: 'abc123',
 *     name: 'Cool NFT #1',
 *     image: 'https://example.com/nft.png',
 *     collectionName: 'Cool Collection',
 *   }}
 *   onPress={() => console.log('NFT pressed')}
 * />
 * ```
 */
export function NftCard({ nft, onPress, style, className, testID }: NftCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const showFallback = !nft.image || imageError;
  const displayName = nft.name || 'Unnamed NFT';

  return (
    <Container
      $clickable={!!onPress}
      onClick={onPress}
      style={style}
      className={className}
      role="button"
      aria-label={`NFT: ${nft.name}`}
      data-testid={testID}
    >
      {/* Background: image or gradient fallback */}
      {showFallback ? (
        <FallbackGradient />
      ) : (
        <>
          <NftImage
            src={nft.image}
            alt={`NFT image for ${nft.name}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageLoading && (
            <LoadingOverlay>
              <FallbackGradient />
              <CircularProgress
                size={20}
                sx={{
                  color: colors.text.primary,
                  position: 'absolute',
                }}
              />
            </LoadingOverlay>
          )}
        </>
      )}

      {/* Name badge at bottom */}
      <NameBadgeContainer>
        <BlurContainer
          blurIntensity={6}
          backgroundColor="rgba(0, 0, 0, 0.6)"
          borderColor="rgba(255, 92, 69, 0.8)"
          borderWidth={0.5}
          style={{
            borderRadius: borderRadius.md,
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 16,
            paddingRight: 16,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <NameText>{displayName}</NameText>
        </BlurContainer>
      </NameBadgeContainer>
    </Container>
  );
}

export default NftCard;
