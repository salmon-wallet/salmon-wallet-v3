/**
 * Type definitions for TransactionHistorySheet (Mobile/React Native)
 *
 * Core transaction types are imported from @salmon/shared
 * This file only contains platform-specific component props
 */

import type { ViewStyle } from 'react-native';
import type { Transaction } from '@salmon/shared';

// Re-export shared types for convenience
export type {
  TransactionType,
  TransactionDisplayStatus as TransactionStatus,
  NftAttribute,
  TransactionTokenAmount,
  TransactionFee,
  SwapRouteHop,
  SwapConversionRate,
  SwapRoute,
  TransactionConfirmationStatus,
  Transaction,
} from '@salmon/shared';

/**
 * Props for TransactionItem component
 */
export interface TransactionItemProps {
  /** Transaction data */
  transaction: Transaction;
  /** Press handler */
  onPress?: (transaction: Transaction) => void;
  /** Long press handler to open detail modal */
  onLongPressDetail?: (transaction: Transaction) => void;
  /** Whether to hide balance values */
  hiddenBalance?: boolean;
  /** Custom styles */
  style?: ViewStyle;
}

/**
 * Props for TransactionHistorySheet component
 */
export interface TransactionHistorySheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when sheet is closed */
  onClose: () => void;
  /** Transactions to display */
  transactions: Transaction[];
  /** Whether transactions are loading */
  loading?: boolean;
  /** Whether more transactions are being fetched */
  loadingMore?: boolean;
  /** Callback to load more transactions */
  onLoadMore?: () => void;
  /** Whether there are more transactions to load */
  hasMore?: boolean;
  /** Whether balance values should be hidden */
  hiddenBalance?: boolean;
  /** Callback when a transaction is pressed */
  onTransactionPress?: (transaction: Transaction) => void;
  /** Callback when a transaction is long pressed (to open detail modal) */
  onTransactionLongPress?: (transaction: Transaction) => void;
  /** Error message to display */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Custom styles for the sheet container */
  style?: ViewStyle;
}
