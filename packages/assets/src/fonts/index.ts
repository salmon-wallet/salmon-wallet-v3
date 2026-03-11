/**
 * Font assets for Salmon Wallet
 *
 * DM Sans - Primary font family
 */

// DM Sans font family
export { default as DMSansBlack } from './DMSans-Black.ttf';
export { default as DMSansBold } from './DMSans-Bold.ttf';
export { default as DMSansExtraBold } from './DMSans-ExtraBold.ttf';
export { default as DMSansLight } from './DMSans-Light.ttf';
export { default as DMSansMedium } from './DMSans-Medium.ttf';
export { default as DMSansRegular } from './DMSans-Regular.ttf';
export { default as DMSansSemiBold } from './DMSans-SemiBold.ttf';

/**
 * Font family constants
 */
export const Fonts = {
  DMSans: {
    Black: require('./DMSans-Black.ttf'),
    Bold: require('./DMSans-Bold.ttf'),
    ExtraBold: require('./DMSans-ExtraBold.ttf'),
    Light: require('./DMSans-Light.ttf'),
    Medium: require('./DMSans-Medium.ttf'),
    Regular: require('./DMSans-Regular.ttf'),
    SemiBold: require('./DMSans-SemiBold.ttf'),
  },
} as const;
