/**
 * @salmon/ui-extension - React DOM components for browser extension
 *
 * Web UI components using MUI and @emotion/styled,
 * designed to mirror @salmon/ui structure for React Native.
 *
 * All components use design tokens from @salmon/shared for
 * consistent styling across platforms.
 */

// Button components - Primary and Secondary action buttons
export { PrimaryButton, SecondaryButton } from './Button';
export type { PrimaryButtonProps, SecondaryButtonProps, ButtonBaseProps } from './Button';

// Icon components - Common SVG icons
export {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshIcon,
  SendIcon,
  ReceiveIcon,
  SettingsIcon,
  CopyIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ActivityIcon,
  WalletIcon,
} from './Icon';
export type { IconProps } from './Icon';

// WalletHeader - Account info and settings navigation
export { WalletHeader } from './WalletHeader';
export type { WalletHeaderProps } from './WalletHeader';

// BalanceCard - Portfolio balance display with gradient
export { BalanceCard } from './BalanceCard';
export type { BalanceCardProps } from './BalanceCard';

// ActionButtonRow - Send/Receive/Activity action buttons
export { ActionButtonRow } from './ActionButtonRow';
export type { ActionButtonRowProps, ActionButton } from './ActionButtonRow';

// TokenList - Token list display components
export { TokenList, TokenListItem, TokenListSkeleton } from './TokenList';
export type {
  TokenListProps,
  TokenListItemProps,
  TokenListSkeletonProps,
} from './TokenList';

// LoadingScreen - Animated loading overlay
export { LoadingScreen } from './LoadingScreen';
export type { LoadingScreenProps } from './LoadingScreen';

// PriceChart - Token price history chart with time period selector
export { PriceChart } from './PriceChart';
export type { PriceChartProps } from './PriceChart';

// TokenInfo - Token information display (description, market stats, contract)
export { TokenInfo } from './TokenInfo';
export type { TokenInfoProps } from './TokenInfo';

// TokenFeatures - Token characteristics/features badges
export { TokenFeatures } from './TokenFeatures';
export type { TokenFeaturesProps } from './TokenFeatures';

// SettingsSheet - Slide-out settings panel
export { SettingsSheet } from './SettingsSheet';
export type {
  SettingsSheetProps,
  SettingsSection,
  SettingsItem,
} from './SettingsSheet';

// WalletSwitcherSheet - Account selection dialog
export { WalletSwitcherSheet } from './WalletSwitcherSheet';
export type {
  WalletSwitcherSheetProps,
  AccountListItemProps,
} from './WalletSwitcherSheet';

// Icon - Unified icon component
export { Icon } from './Icon';
export type { UnifiedIconProps } from './Icon';
