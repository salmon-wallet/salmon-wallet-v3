/**
 * BlurContainer - A reusable blur effect component
 *
 * Web version using CSS backdrop-filter for browser extension
 */
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import { colors } from '@salmon/shared';
import type { BlurContainerProps, BlurTint } from './types';

/**
 * Get background overlay color based on tint.
 *
 * Kept subtle — the background color already provides the main tint,
 * this overlay just adds a light directional bias to match the native
 * BlurView look on iOS/Android.
 */
function getTintColor(tint: BlurTint): string {
  switch (tint) {
    case 'light':
      return 'rgba(255, 255, 255, 0.08)';
    case 'dark':
      return 'rgba(0, 0, 0, 0.10)';
    case 'default':
    default:
      return 'rgba(0, 0, 0, 0.08)';
  }
}

const BlurBox = styled(Box)<{
  $blurIntensity: number;
  $tintColor: string;
  $backgroundColor: string;
  $borderColor: string;
  $borderWidth: number;
}>(({ $blurIntensity, $tintColor, $backgroundColor, $borderColor, $borderWidth }) => ({
  backdropFilter: `blur(${$blurIntensity}px)`,
  WebkitBackdropFilter: `blur(${$blurIntensity}px)`, // Safari support
  backgroundColor: $backgroundColor,
  borderColor: $borderColor,
  borderWidth: $borderWidth,
  borderStyle: 'solid',
  overflow: 'hidden',
  // Add subtle overlay based on tint
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: $tintColor,
    pointerEvents: 'none',
  },
}));

/**
 * BlurContainer - A reusable blur effect component
 *
 * Provides a consistent blur effect across the app using CSS backdrop-filter.
 * Uses colors.background.tokenItem as default background with blur intensity 8.
 *
 * @example
 * ```tsx
 * // Basic usage (uses defaults)
 * <BlurContainer style={{ borderRadius: 8, padding: 16 }}>
 *   <div>Content with blur effect</div>
 * </BlurContainer>
 *
 * // With custom settings
 * <BlurContainer
 *   blurIntensity={20}
 *   blurTint="light"
 *   borderColor={colors.accent.primary}
 * >
 *   <div>Custom blur content</div>
 * </BlurContainer>
 * ```
 */
/**
 * Default background for web — slightly more opaque than the mobile token
 * (`rgba(56, 63, 82, 0.1)`) to compensate for CSS backdrop-filter being
 * visually lighter than expo-blur's native BlurView.
 */
const WEB_DEFAULT_BG = 'rgba(56, 63, 82, 0.20)';

export function BlurContainer({
  children,
  style,
  blurIntensity = 12,
  blurTint = 'dark',
  backgroundColor = WEB_DEFAULT_BG,
  borderColor = colors.border.default,
  borderWidth = 1,
  className,
}: BlurContainerProps) {
  const tintColor = getTintColor(blurTint);

  return (
    <BlurBox
      $blurIntensity={blurIntensity}
      $tintColor={tintColor}
      $backgroundColor={backgroundColor}
      $borderColor={borderColor}
      $borderWidth={borderWidth}
      style={style}
      className={className}
    >
      {children}
    </BlurBox>
  );
}

export default BlurContainer;
