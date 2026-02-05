import type { ViewStyle } from 'react-native';

/**
 * Transaction type constants matching the salmon-api/v2 patterns
 */
export type TransactionType =
  | 'send'
  | 'receive'
  | 'swap'
  | 'mint'
  | 'burn'
  | 'stake'
  | 'loan'
  | 'interaction'
  | 'unknown';

/**
 * Transaction status
 */
export type TransactionStatus = 'completed' | 'failed' | 'pending';

/**
 * Token amount in a transaction
 */
export interface TransactionTokenAmount {
  /** Raw amount (in smallest unit) */
  amount: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name?: string;
  /** Token logo URL */
  logo?: string | null;
  /** Token contract/mint address */
  contract: string;
  /** Source address (for receives) */
  source?: string;
  /** Destination address (for sends) */
  destination?: string;
  /** Whether this is an NFT */
  isNft?: boolean;
}

/**
 * Transaction fee information
 */
export interface TransactionFee {
  /** Fee amount in smallest unit */
  amount: number;
  /** Fee decimals */
  decimals: number;
  /** Fee token symbol */
  symbol: string;
}

/**
 * Processed transaction for display in the UI
 */
export interface Transaction {
  /** Transaction ID (signature) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction type */
  type: TransactionType;
  /** Fee information */
  fee?: TransactionFee;
  /** Inputs (tokens received) */
  inputs: TransactionTokenAmount[];
  /** Outputs (tokens sent) */
  outputs: TransactionTokenAmount[];
  /** Human-readable description from Helius */
  description?: string;
  /** Source protocol (e.g., 'JUPITER', 'MAGIC_EDEN') */
  source?: string;
  /** Original Helius transaction type */
  heliusType?: string;
}

/**
 * Props for TransactionItem component
 */
export interface TransactionItemProps {
  /** Transaction data */
  transaction: Transaction;
  /** Press handler */
  onPress?: (transaction: Transaction) => void;
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
  /** Error message to display */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Custom styles for the sheet container */
  style?: ViewStyle;
}
