/**
 * @salmon/ui-extension - React DOM components for browser extension
 *
 * Web UI components using MUI and @emotion/styled,
 * designed to mirror @salmon/ui structure for React Native.
 *
 * All components use design tokens from @salmon/shared for
 * consistent styling across platforms.
 */

// Button components - Primary, Secondary, and Text action buttons
export { PrimaryButton, SecondaryButton, TextButton } from './Button';
export type {
  PrimaryButtonProps,
  SecondaryButtonProps,
  TextButtonProps,
  ButtonBaseProps,
} from './Button';

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
export { BalanceCard, BalanceCardCarousel } from './BalanceCard';
export type { BalanceCardProps, BalanceCardCarouselProps } from './BalanceCard';

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

// TokenAbout - Token description/about section with glassmorphism
export { TokenAbout } from './TokenAbout';
export type { TokenAboutProps } from './TokenAbout';

// TokenMarketData - Token market statistics with glassmorphism
export { TokenMarketData } from './TokenMarketData';
export type { TokenMarketDataProps, MarketData } from './TokenMarketData';

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

// ScreenHeader - Common header for onboarding/auth screens
export { ScreenHeader } from './ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader';

// StepIndicator - Progress indicator for multi-step flows
export { StepIndicator } from './StepIndicator';
export type { StepIndicatorProps } from './StepIndicator';

// GradientBackground - Linear gradient container component
export { GradientBackground } from './GradientBackground';
export type { GradientBackgroundProps } from './GradientBackground';

// BlurContainer - Blur effect container with backdrop-filter
export { BlurContainer } from './BlurContainer';
export type { BlurContainerProps, BlurTint } from './BlurContainer';

// ScalesBackground - Repeating fish scales pattern background
export { ScalesBackground } from './ScalesBackground';
export type { ScalesBackgroundProps } from './ScalesBackground';

// TexturedBackground - Tiled fish-scale texture pattern background
export { TexturedBackground } from './TexturedBackground';
export type { TexturedBackgroundProps } from './TexturedBackground';

// PasswordInput - Secure password input with visibility toggle and strength indicator
export { PasswordInput, PasswordStrengthBar } from './PasswordInput';
export type { PasswordInputProps, PasswordStrengthBarProps } from './PasswordInput';

// QRCode - QR code display component
export { QRCode } from './QRCode';
export type { QRCodeProps } from './QRCode';

// InputAddress - Address input with validation
export {
  InputAddress,
  useAddressValidation,
} from './InputAddress';
export type {
  InputAddressProps,
  BlockchainType,
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from './InputAddress';

// NftCard - NFT display card for grid layouts
export { NftCard, NftCardSkeleton } from './NftCard';
export type { NftCardProps, NftCardSkeletonProps, NftData } from './NftCard';

// NftDetailSheet - NFT detail dialog with image, attributes, and actions
export { NftDetailSheet } from './NftDetailSheet';
export type { NftDetailSheetProps, NftDetailData, NftAttribute } from './NftDetailSheet';

// NftCarouselSection - Horizontal NFT carousel with arrow navigation
export { NftCarouselSection, NftCarouselSectionSkeleton } from './NftCarouselSection';
export type { NftCarouselSectionProps, NftCarouselSectionSkeletonProps } from './NftCarouselSection';

// NftSeeAllSheet - Full grid view of all NFTs for a blockchain section
export { NftSeeAllSheet } from './NftSeeAllSheet';
export type { NftSeeAllSheetProps } from './NftSeeAllSheet';

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

// TokenInformationSheet - Token details dialog with chart, market data, badges
export { TokenInformationSheet, TokenBadgesSection } from './TokenInformationSheet';
export type {
  TokenInformationSheetProps,
  TokenBadgesSectionProps,
} from './TokenInformationSheet';

// ReceiveSheet - Receive address dialog with QR code
export { ReceiveSheet } from './ReceiveSheet';
export type { ReceiveSheetProps } from './ReceiveSheet';

// TransactionDetailModal - Transaction detail dialog
export { TransactionDetailModal } from './TransactionDetailModal';
export type { TransactionDetailModalProps } from './TransactionDetailModal';

// TransactionHistorySheet - Transaction history dialog with pagination
export {
  TransactionHistorySheet,
  TransactionItem,
  SwapRouteVisualization,
  PriceImpactBadge,
  ConversionRateDisplay,
  ExplorerLinkButton,
  AddressCopyRow,
} from './TransactionHistorySheet';
export type {
  TransactionHistorySheetProps,
  TransactionItemProps,
  Transaction,
  TransactionType as TxType,
  TransactionStatus as TxStatus,
  TransactionTokenAmount,
  TransactionFee,
  SwapRouteHop,
  SwapRoute,
  SwapRouteVisualizationProps,
  PriceImpactBadgeProps,
  ConversionRateDisplayProps,
  ExplorerLinkButtonProps,
  AddressCopyRowProps,
} from './TransactionHistorySheet';

// SendSheet - Multi-step send dialog with token selection, address/amount entry, and confirmation
export { SendSheet } from './SendSheet';
export type {
  SendSheetProps,
  SendToken,
  SendStep,
  StepTokenSelectProps,
  StepAddressAmountProps,
  StepConfirmationProps,
} from './SendSheet';

// SwapScreen - Swap and Bridge interface
export {
  SwapScreen,
  SwapTabSelector,
  SwapAmountInput,
  SwapDetailRow,
  SwapReviewCard,
  SwapInputScreen,
  SwapReviewScreen,
} from './SwapScreen';
export type {
  SwapToken,
  SwapQuote,
  SwapTab,
  SwapStep,
  SwapChainType,
  SwapScreenProps,
  SwapTabSelectorProps,
  SwapAmountInputProps,
  SwapDetailRowProps,
  SwapReviewCardProps,
  SwapInputScreenProps,
  SwapReviewScreenProps,
  // Bridge types used in SwapScreen
  BridgeTokenSimple,
  BridgeEstimateSimple,
  BridgeExchangeSimple,
} from './SwapScreen';

// BaseDialog - Base compound component for MUI dialogs
export { BaseDialog, MessageText } from './BaseDialog';
export type {
  BaseDialogProps,
  HeaderProps,
  ContentProps,
  ActionsProps,
  TextFieldProps as BaseDialogTextFieldProps,
  CancelButtonProps,
  ActionButtonProps,
} from './BaseDialog';

// ConfirmDialog - Reusable confirmation dialog for destructive actions
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

// EditAccountDialog - Account name editing dialog
export { EditAccountDialog } from './EditAccountDialog';
export type { EditAccountDialogProps } from './EditAccountDialog';

// SeedPhrase - Seed word display grid and validation input
export { SeedWordGrid, SeedWordInput } from './SeedPhrase';

// DerivedAccountCard - Selectable account card for derived account discovery
export { DerivedAccountCard, DerivedAccountCardSkeleton } from './DerivedAccountCard';
export type {
  DerivedAccountCardProps,
  DerivedAccountCardSkeletonProps,
} from './DerivedAccountCard';
