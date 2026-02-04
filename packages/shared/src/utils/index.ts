// URL utilities
export { normalizeIpfsUrl, DEAD_DOMAINS } from './url';

// Account utilities
export { getPathIndex } from './account';

// Avatar utilities
export { getAvatar, getRandomAvatar } from './avatar';

// Address utilities
export { getShortAddress } from './address';

// Clipboard utilities (web only - use expo-clipboard for native)
export { copyToClipboard, pasteFromClipboard } from './clipboard';

// Responsive scaling utilities
export {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  scale,
  s,
  verticalScale,
  vs,
  moderateScale,
  ms,
  moderateVerticalScale,
  mvs,
} from './scaling';

// Formatting utilities
export {
  // Types
  type LabelType,
  type Currency,
  // Constants
  hiddenValue,
  // Amount formatting
  formatAmount,
  showAmount,
  showValue,
  // Percentage utilities
  isPositive,
  isNegative,
  isNeutral,
  getLabelValue,
  showPercentage,
  // Currency formatting
  formatCurrency,
  // Change formatting
  showAbsoluteChange,
} from './formatting';
