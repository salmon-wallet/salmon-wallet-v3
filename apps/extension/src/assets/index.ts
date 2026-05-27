/**
 * Asset exports for Salmon Wallet Extension
 *
 * This file provides centralized access to all static assets used in the extension.
 * Assets are located in the public directory and are accessible via the extension's public URL.
 */

// Navigation Icons
export const IconWallet = '/images/IconWallet.png';
export const IconWalletSVG = '/images/IconWallet.svg';
export const IconNFT = '/images/IconNFT.png';
export const IconNFTSVG = '/images/IconNFT.svg';
export const IconSwap = '/images/IconSwap.png';
export const IconSwapSVG = '/images/IconSwap.svg';
export const IconBalance = '/images/IconBalance.png';
export const IconBalanceSVG = '/images/IconBalance.svg';
export const IconSettings = '/images/IconSettings.png';
export const IconSettingsSVG = '/images/IconSettings.svg';

// Transaction Icons
export const IconTransactionSent = '/images/IconTransactionSent.png';
export const IconTransactionReceived = '/images/IconTransactionReceived.png';
export const IconTransactionSwap = '/images/IconTransactionSwap.png';
export const IconTransactionInteraction = '/images/IconTransactionInteraction.png';
export const IconTransactionResultSuccess = '/images/IconTransactionResultSuccess.png';
export const IconTransactionResultFail = '/images/IconTransactionResultFail.png';
export const IconTransactionResultWarning = '/images/IconTransactionResultWarning.png';
export const IconTransactionUnknown = '/images/IconTransactionUnknown.png';
export const IconCallMade = '/images/IconCallMade.png';
export const IconCallReceived = '/images/IconCallReceived.png';

// Logo and Brand Assets
export const AppIcon = '/images/AppIcon.png';
export const Logo = '/images/Logo.png';
export const AppTitle = '/images/AppTitle.png';
export const IconSalmon = '/images/IconSalmon.png';
export const BoolSplashLogo = '/images/BoolSplashLogo.png';
export const BoolSplashLogo2x = '/images/BoolSplashLogo@2x.png';
export const BoolSplashLogo3x = '/images/BoolSplashLogo@3x.png';
export const BoolSplashLogo4x = '/images/BoolSplashLogo@4x.png';

// Common UI Icons
export const IconCopy = '/images/IconCopy.png';
export const IconClose = '/images/IconClose.png';
export const IconAdd = '/images/IconAdd.png';
export const IconSearch = '/images/IconSearch.png';
export const IconChevronLeft = '/images/IconChevronLeft.png';
export const IconChevronRight = '/images/IconChevronRight.png';
export const IconExpandMore = '/images/IconExpandMore.png';
export const IconExpandLess = '/images/IconExpandLess.png';
export const IconArrowBack = '/images/IconArrowBack.png';
export const IconArrowUp = '/images/IconArrowUp.png';
export const IconArrowDown = '/images/IconArrowDown.png';
export const IconEdit = '/images/IconEdit.png';
export const IconDelete = '/images/IconDelete.png';
export const IconInfo = '/images/IconInfo.png';
export const IconSuccess = '/images/IconSuccess.png';
export const IconFailed = '/images/IconFailed.png';
export const IconVisibilityShow = '/images/IconVisibilityShow.png';
export const IconVisibilityHidden = '/images/IconVisibilityHidden.png';
export const IconQRCodeScanner = '/images/IconQRCodeScanner.png';

// Fonts
export const DMSansBold = '/fonts/DMSans-Bold.ttf';
export const DMSansMedium = '/fonts/DMSans-Medium.ttf';
export const DMSansRegular = '/fonts/DMSans-Regular.ttf';

/**
 * Helper function to get the full asset URL
 * This is useful when you need to construct URLs dynamically
 */
export function getAssetUrl(path: string): string {
  return chrome.runtime.getURL(path);
}

/**
 * Navigation icons grouped for easier access
 */
export const NavigationIcons = {
  wallet: IconWallet,
  walletSVG: IconWalletSVG,
  nft: IconNFT,
  nftSVG: IconNFTSVG,
  swap: IconSwap,
  swapSVG: IconSwapSVG,
  balance: IconBalance,
  balanceSVG: IconBalanceSVG,
  settings: IconSettings,
  settingsSVG: IconSettingsSVG,
} as const;

/**
 * Transaction icons grouped by type
 */
export const TransactionIcons = {
  sent: IconTransactionSent,
  received: IconTransactionReceived,
  swap: IconTransactionSwap,
  interaction: IconTransactionInteraction,
  resultSuccess: IconTransactionResultSuccess,
  resultFail: IconTransactionResultFail,
  resultWarning: IconTransactionResultWarning,
  unknown: IconTransactionUnknown,
  callMade: IconCallMade,
  callReceived: IconCallReceived,
} as const;

/**
 * Brand assets grouped
 */
export const BrandAssets = {
  appIcon: AppIcon,
  logo: Logo,
  appTitle: AppTitle,
  salmon: IconSalmon,
  splashLogo: BoolSplashLogo,
  splashLogo2x: BoolSplashLogo2x,
  splashLogo3x: BoolSplashLogo3x,
  splashLogo4x: BoolSplashLogo4x,
} as const;

/**
 * Font files grouped
 */
export const Fonts = {
  dmSansBold: DMSansBold,
  dmSansMedium: DMSansMedium,
  dmSansRegular: DMSansRegular,
} as const;
