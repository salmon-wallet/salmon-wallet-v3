/**
 * Responsive scaling utilities - Web fallback
 *
 * On web, uses window dimensions when available, otherwise falls back
 * to design dimensions (identity scaling). Native version uses
 * react-native Dimensions (see scaling.native.ts).
 */

export const DESIGN_WIDTH = 440;
export const DESIGN_HEIGHT = 956;

const getWindowDimensions = () => {
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
};

const { width, height } = getWindowDimensions();

export const scale = (size: number): number => (width / DESIGN_WIDTH) * size;
export const s = scale;

export const verticalScale = (size: number): number => (height / DESIGN_HEIGHT) * size;
export const vs = verticalScale;

export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;
export const ms = moderateScale;

export const moderateVerticalScale = (size: number, factor = 0.5): number =>
  size + (verticalScale(size) - size) * factor;
export const mvs = moderateVerticalScale;
