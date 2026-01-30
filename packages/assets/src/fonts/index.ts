/**
 * Font assets for Salmon Wallet
 *
 * DM Sans - Primary font family
 * Space Mono - Monospace font for addresses and technical text
 */

// DM Sans font family
export { default as DMSansBold } from './DMSans-Bold.ttf';
export { default as DMSansMedium } from './DMSans-Medium.ttf';
export { default as DMSansRegular } from './DMSans-Regular.ttf';

// Space Mono font family
export { default as SpaceMonoRegular } from './SpaceMono-Regular.ttf';

/**
 * Font family constants
 */
export const Fonts = {
  DMSans: {
    Bold: require('./DMSans-Bold.ttf'),
    Medium: require('./DMSans-Medium.ttf'),
    Regular: require('./DMSans-Regular.ttf'),
  },
  SpaceMono: {
    Regular: require('./SpaceMono-Regular.ttf'),
  },
} as const;
