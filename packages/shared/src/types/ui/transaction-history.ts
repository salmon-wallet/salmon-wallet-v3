import type { Transaction } from '../index';

/**
 * Props for TransactionItem component (base - platform-agnostic)
 */
export interface TransactionItemPropsBase<TStyle> {
  /** Transaction data */
  transaction: Transaction;
  /** Press handler */
  onPress?: (transaction: Transaction) => void;
  /** Whether to hide balance values */
  hiddenBalance?: boolean;
  /** Custom styles */
  style?: TStyle;
}

/**
 * Props for TransactionHistorySheet component (base - platform-agnostic)
 */
export interface TransactionHistorySheetPropsBase<TStyle> {
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
  /** Error message to display */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Custom styles for the sheet container */
  style?: TStyle;
}
