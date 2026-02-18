/**
 * UI Component Types (Platform-Agnostic)
 *
 * This module exports base types for UI components that are used across
 * both mobile (apps/mobile) and web (apps/extension) apps.
 *
 * Platform-specific versions (with ViewStyle or CSSProperties) should
 * extend these base types in their respective packages.
 */

// Token Selector
export type {
  TokenSelectorToken,
  TokenSelectorPropsBase,
  TokenSelectorModalPropsBase,
  UseTokenSearchResult,
} from './token-selector';

// Token Market Data
export type { MarketData, TokenMarketDataPropsBase } from './token-market-data';

// Token Info
export type { TokenInfoPropsBase } from './token-info';

// Price Chart
export type { PriceChartPropsBase } from './price-chart';

// Send Sheet
export type {
  SendStep,
  SendToken,
  SendSheetPropsBase,
  StepTokenSelectProps,
  StepAddressAmountPropsBase,
  StepConfirmationProps,
} from './send-sheet';

// Transaction History
export type {
  TransactionItemPropsBase,
  TransactionHistorySheetPropsBase,
} from './transaction-history';

// Input Address
export type { InputAddressPropsBase } from './input-address';

// Balance Card
export type {
  BlockchainId,
  BlockchainNetworkInfo,
  BlockchainBalance,
  BalanceCardPropsBase,
  BalanceCardCarouselPropsBase,
  BalanceCardSkeletonPropsBase,
} from './balance-card';

// Action Button Row
export type { ActionButtonBase, ActionButtonRowPropsBase } from './action-button-row';

// Step Indicator
export type { StepIndicatorProps } from './step-indicator';

// QR Code
export type { QRCodePropsBase } from './qr-code';

// Receive Sheet
export type { ReceiveSheetPropsBase } from './receive-sheet';

// Token About
export type { TokenAboutPropsBase } from './token-about';

// Token Features
export type { TokenFeaturesPropsBase } from './token-features';

// Blur Container
export type { BlurTint, BlurContainerPropsBase } from './blur-container';

// Gradient Background
export type { GradientBackgroundPropsBase } from './gradient-background';

// Bridge Screen
// Note: BridgeChain, BridgeToken, BridgeEstimate, BridgeExchange are UI-specific
// data shapes that differ from the API/domain types in types/bridge.ts.
// They are not re-exported here to avoid name collisions — import them
// directly from '@salmon/shared/types/ui/bridge-screen' if needed.
export type {
  RecipientAddressInputPropsBase,
  BridgeRecipientScreenPropsBase,
  BridgeReviewScreenPropsBase,
} from './bridge-screen';

// Token Information Sheet
export type {
  TokenInformationSheetPropsBase,
  TokenBadgesSectionPropsBase,
} from './token-information-sheet';

// Transaction Detail Modal
export type { TransactionDetailModalPropsBase } from './transaction-detail-modal';

// Wallet Header
export type { WalletHeaderPropsBase } from './wallet-header';

// Wallet Switcher Sheet
export type {
  WalletSwitcherSheetPropsBase,
  AccountListItemPropsBase,
} from './wallet-switcher-sheet';
