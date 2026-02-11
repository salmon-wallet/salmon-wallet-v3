/**
 * UI Component Types (Platform-Agnostic)
 *
 * This module exports base types for UI components that are used across
 * both mobile (@salmon/ui) and web (@salmon/ui-extension) packages.
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
  SendBlockchainType,
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
