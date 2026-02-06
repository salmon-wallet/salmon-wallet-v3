// React Native components
// Cross-platform UI components for Salmon Wallet

// QRCode - QR code display component
export { default as QRCode } from './QRCode';
export type { QRCodeProps } from './QRCode';

// QRScanner - QR code scanning component
export { QRScanner, default as QRScannerDefault } from './QRScanner';
export type { QRScannerProps, QRScanResult } from './QRScanner';

// InputAddress - Address input with validation
export {
  InputAddress,
  useAddressValidation,
  type InputAddressProps,
  type BlockchainType,
  type ValidationState,
  type ValidationCallbackResult,
  type UseAddressValidationReturn,
  type UseAddressValidationOptions,
} from './InputAddress';

// TokenList - Token list display component
export {
  TokenList,
  TokenListItem,
  TokenListSkeleton,
  TokenBadges,
} from './TokenList';
export type {
  TokenListProps,
  TokenListItemProps,
  TokenListSkeletonProps,
  TokenBadgesProps,
} from './TokenList';

// TokenSelector - Token selection with search and pagination
export {
  TokenSelector,
  TokenSelectorModal,
  useTokenSearch,
} from './TokenSelector';
export type {
  TokenSelectorToken,
  TokenSelectorProps,
  TokenSelectorModalProps,
  UseTokenSearchResult,
} from './TokenSelector';

// GradientBackground - Linear gradient wrapper component
export { GradientBackground } from './GradientBackground';
export type { GradientBackgroundProps } from './GradientBackground';

// WalletHeader - Account info and settings navigation
export { WalletHeader } from './WalletHeader';
export type { WalletHeaderProps } from './WalletHeader';

// BalanceCard - Portfolio balance display with gradient
export { BalanceCard, BalanceCardCarousel } from './BalanceCard';
export type {
  BalanceCardProps,
  BalanceCardCarouselProps,
  BlockchainId,
  BlockchainBalance,
  BlockchainNetworkInfo,
} from './BalanceCard';

// ActionButtonRow - Send/Receive/Activity action buttons
export { ActionButtonRow } from './ActionButtonRow';
export type { ActionButtonRowProps, ActionButton } from './ActionButtonRow';

// Button - Reusable button components
export { PrimaryButton, SecondaryButton, TextButton } from './Button';
export type {
  PrimaryButtonProps,
  SecondaryButtonProps,
  TextButtonProps,
} from './Button';

// StepIndicator - Progress indicator for multi-step flows
export { StepIndicator } from './StepIndicator';
export type { StepIndicatorProps } from './StepIndicator';

// PasswordInput - Secure password input with visibility toggle and strength indicator
export { PasswordInput, PasswordStrengthBar } from './PasswordInput';

// SeedPhrase - Seed phrase display and input components
export { SeedWordGrid, SeedWordInput } from './SeedPhrase';

// ScreenHeader - Common header for onboarding/auth screens
export { ScreenHeader } from './ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader';

// LoadingScreen - Animated loading overlay with pulsing logo and spinner
export { LoadingScreen } from './LoadingScreen';
export type { LoadingScreenProps } from './LoadingScreen';

// PriceChart - Token price history chart with time period selector
export { PriceChart } from './PriceChart';
export type { PriceChartProps } from './PriceChart';

// TokenInfo - Token information display (description, market stats, contract)
export { TokenInfo } from './TokenInfo';
export type { TokenInfoProps } from './TokenInfo';

// TokenAbout - Token description/about section with glassmorphism
export { TokenAbout } from './TokenAbout';
export type { TokenAboutProps } from './TokenAbout';

// TokenMarketData - Token market statistics with glassmorphism
export { TokenMarketData } from './TokenMarketData';
export type { TokenMarketDataProps, MarketData } from './TokenMarketData';

// TokenFeatures - Token characteristics/features badges
export { TokenFeatures } from './TokenFeatures';
export type { TokenFeaturesProps } from './TokenFeatures';

// TokenInformationSheet - Bottom sheet modal for token details
export { TokenInformationSheet } from './TokenInformationSheet';
export type { TokenInformationSheetProps, CoinInfo } from './TokenInformationSheet';

// TopSheet - Slide-down modal from top of screen
export { TopSheet } from './TopSheet';
export type {
  TopSheetProps,
  TopSheetAnimationConfig,
  TopSheetRef,
} from './TopSheet';

// SettingsSheet - Slide-down settings panel
export { SettingsSheet } from './SettingsSheet';
export type {
  SettingsSheetProps,
  SettingsOption,
  SettingsSection,
} from './SettingsSheet';

// WalletSwitcherSheet - Account selection sheet
export { WalletSwitcherSheet } from './WalletSwitcherSheet';
export type {
  WalletSwitcherSheetProps,
  AccountListItemProps,
} from './WalletSwitcherSheet';

// BlurContainer - Reusable blur effect component
export { BlurContainer } from './BlurContainer';
export type { BlurContainerProps, BlurTint } from './BlurContainer';

// NftCard - NFT display card for grid layouts
export { NftCard, NftCardSkeleton } from './NftCard';
export type { NftCardProps, NftCardSkeletonProps, NftData } from './NftCard';

// NftDetailSheet - Bottom sheet modal for NFT details
export { NftDetailSheet } from './NftDetailSheet';
export type { NftDetailSheetProps, NftDetailData, NftAttribute } from './NftDetailSheet';

// SVG Icons
export {
  WalletSvgIcon,
  ContentCopySvgIcon,
  SettingsSvgIcon,
  SolanaSvgIcon,
  BitcoinSvgIcon,
  EthereumSvgIcon,
  GridViewSvgIcon,
  HomeSvgIcon,
  SwapSvgIcon,
} from './Icon';

// ScalesBackground - Repeating fish scales pattern background
export { ScalesBackground } from './ScalesBackground';
export type { ScalesBackgroundProps } from './ScalesBackground';

// ReceiveSheet - Bottom sheet for receiving tokens with QR code
export { ReceiveSheet } from './ReceiveSheet';
export type { ReceiveSheetProps } from './ReceiveSheet';

// TransactionHistorySheet - Bottom sheet for transaction history
export { TransactionHistorySheet, TransactionItem } from './TransactionHistorySheet';
export type {
  TransactionHistorySheetProps,
  TransactionItemProps,
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionTokenAmount,
  TransactionFee,
} from './TransactionHistorySheet';

// TransactionDetailModal - Bottom sheet modal for transaction details
export { TransactionDetailModal } from './TransactionDetailModal';
export type { TransactionDetailModalProps } from './TransactionDetailModal';

// SendSheet - Bottom sheet for sending tokens
export { SendSheet } from './SendSheet';
export type {
  SendSheetProps,
  SendToken,
  SendStep,
  SendBlockchainType as SendSheetBlockchainType,
} from './SendSheet';
