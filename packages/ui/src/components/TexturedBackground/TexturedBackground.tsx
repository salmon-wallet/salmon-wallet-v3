/**
 * TexturedBackground - Tiled fish-scale texture pattern background
 *
 * Web version using CSS radial-gradient patterns for browser extension.
 * Replicates the visual appearance of the BackgroundTexture PNG asset
 * (a dark fish-scale pattern with filled scales on a dark background)
 * without requiring a large image file.
 *
 * Unlike ScalesBackground which renders outline-only SVG strokes,
 * TexturedBackground produces filled, solid-looking scales with
 * subtle edge highlights for a richer textured appearance.
 */
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import type { TexturedBackgroundProps } from './types';

const Container = styled(Box)<{
  $topOffset: number;
  $opacity: number;
  $fillColor: string;
  $edgeColor: string;
  $backgroundColor: string;
  $scaleSize: number;
}>(({ $topOffset, $opacity, $fillColor, $edgeColor, $backgroundColor, $scaleSize }) => {
  // Each scale is a radial-gradient circle, offset in alternating rows
  // to produce the classic fish-scale / scallop tiling pattern
  const halfSize = $scaleSize / 2;

  return {
    position: 'absolute',
    top: $topOffset,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    opacity: $opacity,
    backgroundColor: $backgroundColor,
    backgroundImage: [
      // Row 1 scales
      `radial-gradient(circle at 50% 0%, ${$fillColor} ${halfSize - 1}px, ${$edgeColor} ${halfSize - 1}px, ${$edgeColor} ${halfSize}px, transparent ${halfSize}px)`,
      // Row 2 scales (offset by half)
      `radial-gradient(circle at 50% 0%, ${$fillColor} ${halfSize - 1}px, ${$edgeColor} ${halfSize - 1}px, ${$edgeColor} ${halfSize}px, transparent ${halfSize}px)`,
    ].join(', '),
    backgroundSize: `${$scaleSize}px ${halfSize}px, ${$scaleSize}px ${halfSize}px`,
    backgroundPosition: `0px 0px, ${halfSize}px ${halfSize / 2}px`,
  };
});

/**
 * TexturedBackground - Tiled fish-scale texture pattern
 *
 * Creates a dark, filled fish-scale pattern using pure CSS gradients.
 * Designed to match the BackgroundTexture PNG asset appearance without
 * requiring image file loading.
 *
 * @example
 * ```tsx
 * // Basic usage - full container coverage
 * <TexturedBackground />
 *
 * // With reduced opacity and custom offset
 * <TexturedBackground opacity={0.4} topOffset={60} />
 *
 * // With custom scale colors
 * <TexturedBackground
 *   fillColor="rgba(25, 27, 38, 1)"
 *   edgeColor="rgba(55, 58, 72, 0.5)"
 *   backgroundColor="rgba(12, 13, 20, 1)"
 * />
 * ```
 */
export function TexturedBackground({
  fillColor = 'rgba(20, 22, 30, 1)',
  edgeColor = 'rgba(45, 48, 62, 0.6)',
  backgroundColor = 'rgba(10, 11, 16, 1)',
  scaleSize = 30,
  opacity = 1,
  topOffset = 0,
  style,
  className,
}: TexturedBackgroundProps) {
  return (
    <Container
      $topOffset={topOffset}
      $opacity={opacity}
      $fillColor={fillColor}
      $edgeColor={edgeColor}
      $backgroundColor={backgroundColor}
      $scaleSize={scaleSize}
      style={style}
      className={className}
    />
  );
}
