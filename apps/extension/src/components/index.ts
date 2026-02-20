/**
 *
 * Web UI components using MUI and @emotion/styled,
 * designed to mirror the mobile components structure for React Native.
 *
 * All components use design tokens from @salmon/shared for
 * consistent styling across platforms.
 */

// Button components - Primary, Secondary, and Text action buttons
export { PrimaryButton, SecondaryButton, TextButton } from './Button';
export type {
  ButtonBaseProps, PrimaryButtonProps,
  SecondaryButtonProps,
  TextButtonProps
} from './Button';

// Icon components - Common SVG icons
export {
  ActivityIcon, ChevronDownIcon, ChevronRightIcon, CopyIcon, EyeIcon,
  EyeOffIcon, LockIcon, ReceiveIcon, RefreshIcon,
  SendIcon, SettingsIcon, WalletIcon
} from './Icon';
export type { IconProps } from './Icon';

// WalletHeader - Account info and settings navigation
export { WalletHeader } from './WalletHeader';
export type { WalletHeaderProps } from './WalletHeader';

// BalanceCard - Portfolio balance display with gradient
export { BalanceCard, BalanceCardCarousel } from './BalanceCard';
export type { BalanceCardCarouselProps, BalanceCardProps } from './BalanceCard';

// ActionButtonRow - Send/Receive/Activity action buttons
export { ActionButtonRow } from './ActionButtonRow';
export type { ActionButton, ActionButtonRowProps } from './ActionButtonRow';

// TokenList - Token list display components
export { TokenList, TokenListItem, TokenListSkeleton } from './TokenList';
export type {
  TokenListItemProps, TokenListProps, TokenListSkeletonProps
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
export type { MarketData, TokenMarketDataProps } from './TokenMarketData';

// TokenFeatures - Token characteristics/features badges
export { TokenFeatures } from './TokenFeatures';
export type { TokenFeaturesProps } from './TokenFeatures';

// SettingsSheet - Slide-out settings panel
export { SettingsSheet } from './SettingsSheet';
export type {
  SettingsItem, SettingsSection, SettingsSheetProps
} from './SettingsSheet';

// WalletSwitcherSheet - Account selection dialog
export { WalletSwitcherSheet } from './WalletSwitcherSheet';
export type {
  AccountListItemProps, WalletSwitcherSheetProps
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
  useAddressValidation
} from './InputAddress';
export type {
  BlockchainType, InputAddressProps, UseAddressValidationOptions, UseAddressValidationReturn, ValidationCallbackResult, ValidationState
} from './InputAddress';

// NftCard - NFT display card for grid layouts
export { NftCard, NftCardSkeleton } from './NftCard';
export type { NftCardProps, NftCardSkeletonProps, NftData } from './NftCard';

// NftDetailPage - Full-page NFT detail view with image, attributes, and actions
export { NftDetailPage } from './NftDetailPage';
export type { NftAttribute, NftDetailData, NftDetailPageProps } from './NftDetailPage';

// NftCarouselSection - Horizontal NFT carousel with arrow navigation
export { NftCarouselSection, NftCarouselSectionSkeleton } from './NftCarouselSection';
export type { NftCarouselSectionProps, NftCarouselSectionSkeletonProps } from './NftCarouselSection';

// NftSeeAllPage - Full-page grid view of all NFTs for a blockchain section
export { NftSeeAllPage } from './NftSeeAllPage';
export type { NftSeeAllPageProps } from './NftSeeAllPage';

// TokenSelector - Token selection with search and pagination
export {
  TokenSelector,
  TokenSelectorModal,
  useTokenSearch
} from './TokenSelector';
export type {
  TokenSelectorModalProps, TokenSelectorProps, TokenSelectorToken, UseTokenSearchResult
} from './TokenSelector';

// TokenDetailPage - Full-page token detail view with chart, market data, badges
export { TokenBadgesSection, TokenDetailPage } from './TokenDetailPage';
export type {
  TokenBadgesSectionProps, TokenDetailPageProps
} from './TokenDetailPage';

// ReceiveSheet - Receive address dialog with QR code
export { ReceiveSheet } from './ReceiveSheet';
export type { ReceiveSheetProps } from './ReceiveSheet';

// TransactionDetailModal - Transaction detail dialog
export { TransactionDetailModal } from './TransactionDetailModal';
export type { TransactionDetailModalProps } from './TransactionDetailModal';

// TransactionHistoryPage - Full-page transaction history with pagination
export {
  AddressCopyRow, ConversionRateDisplay,
  ExplorerLinkButton, PriceImpactBadge, SwapRouteVisualization, TransactionHistoryPage,
  TransactionItem
} from './TransactionHistoryPage';
export type {
  AddressCopyRowProps, ConversionRateDisplayProps,
  ExplorerLinkButtonProps, PriceImpactBadgeProps, SwapRoute, SwapRouteHop, SwapRouteVisualizationProps, Transaction, TransactionFee, TransactionHistoryPageProps,
  TransactionItemProps, TransactionTokenAmount, TransactionStatus as TxStatus, TransactionType as TxType
} from './TransactionHistoryPage';

// SendPage - Full-page multi-step send flow with token selection, address/amount entry, and confirmation
export { SendPage } from './SendPage';
export type {
  SendPageProps, SendStep, SendToken, StepAddressAmountProps,
  StepConfirmationProps, StepTokenSelectProps
} from './SendPage';

// SwapScreen - Swap and Bridge interface
export {
  SwapAmountInput,
  SwapDetailRow, SwapInputScreen, SwapReviewCard, SwapReviewScreen, SwapScreen,
  SwapTabSelector
} from './SwapScreen';
export type {
  BridgeEstimateSimple,
  BridgeExchangeSimple,
  // Bridge types used in SwapScreen
  BridgeTokenSimple, SwapAmountInputProps, SwapChainType, SwapDetailRowProps, SwapInputScreenProps, SwapQuote, SwapReviewCardProps, SwapReviewScreenProps, SwapScreenProps, SwapStep, SwapTab, SwapTabSelectorProps, SwapToken
} from './SwapScreen';

// BaseDialog - Base compound component for MUI dialogs
export { BaseDialog, MessageText } from './BaseDialog';
export type {
  ActionButtonProps, ActionsProps, BaseDialogProps, TextFieldProps as BaseDialogTextFieldProps,
  CancelButtonProps, ContentProps, HeaderProps
} from './BaseDialog';

// ConfirmDialog - Reusable confirmation dialog for destructive actions
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

// EditAccountDialog - Account name editing dialog
export { EditAccountDialog } from './EditAccountDialog';
export type { EditAccountDialogProps } from './EditAccountDialog';

// NftSendDialog - Dialog for sending NFTs to another address
export { NftSendDialog } from './NftSendDialog';
export type { NftSendDialogProps } from './NftSendDialog';

// SeedPhrase - Seed word display grid and validation input
export { SeedWordGrid, SeedWordInput } from './SeedPhrase';

// NetworkSelector - Network selection for settings
export { NetworkSelector } from './NetworkSelector';

// ExplorerSelector - Block explorer selection for settings
export { ExplorerSelector } from './ExplorerSelector';

// LanguageSelector - Language selection for settings
export { LanguageSelector } from './LanguageSelector';

// TrustedAppsSelector - Connected dApps management for settings
export { TrustedAppsSelector } from './TrustedAppsSelector';

// SupportSelector - Help & Support for settings
export { SupportSelector } from './SupportSelector';

// CurrencySelector - Currency selection for settings
export { CurrencySelector } from './CurrencySelector';

// DerivedAccountCard - Selectable account card for derived account discovery
export { DerivedAccountCard, DerivedAccountCardSkeleton } from './DerivedAccountCard';
export type {
  DerivedAccountCardProps,
  DerivedAccountCardSkeletonProps
} from './DerivedAccountCard';

