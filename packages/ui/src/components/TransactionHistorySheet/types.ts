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
 * NFT attribute for metadata
 */
export interface NftAttribute {
  /** Trait type (e.g., 'Background', 'Eyes', 'Hat') */
  trait_type: string;
  /** Trait value */
  value: string | number;
}

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
  /** NFT collection name */
  nftCollection?: string;
  /** Whether the NFT collection is verified */
  nftCollectionVerified?: boolean;
  /** NFT media URL (image/video) */
  nftMedia?: string;
  /** NFT metadata attributes */
  nftAttributes?: NftAttribute[];
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
 * Swap route hop information (for multi-hop swaps)
 */
export interface SwapRouteHop {
  /** DEX/AMM label (e.g., 'Raydium', 'Orca', 'Meteora') */
  dex: string;
  /** Percentage of the swap going through this route (0-100) */
  percent: number;
  /** Input token for this hop */
  inputToken: {
    symbol: string;
    amount: string;
    decimals: number;
    logo?: string | null;
  };
  /** Output token for this hop */
  outputToken: {
    symbol: string;
    amount: string;
    decimals: number;
    logo?: string | null;
  };
  /** Fee for this hop */
  fee?: {
    amount: string;
    symbol: string;
  };
}

/**
 * Conversion rate information for swap display
 */
export interface SwapConversionRate {
  /** Input token symbol */
  fromSymbol: string;
  /** Output token symbol */
  toSymbol: string;
  /** Conversion rate (e.g., '1.5' means 1 fromToken = 1.5 toToken) */
  rate: string;
}

/**
 * Swap route information for visualization
 */
export interface SwapRoute {
  /** List of hops in the swap route */
  hops: SwapRouteHop[];
  /** Price impact percentage */
  priceImpact?: string;
  /** Total fees across all hops */
  totalFee?: {
    amount: string;
    symbol: string;
  };
  /** Conversion rate between input and output tokens */
  conversionRate?: SwapConversionRate;
  /** Total input amount for the swap */
  inputAmount?: string;
  /** Total output amount for the swap */
  outputAmount?: string;
}

/**
 * Confirmation status of a transaction on the Solana network
 */
export type TransactionConfirmationStatus = 'processed' | 'confirmed' | 'finalized';

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
  /** Swap route information for multi-hop swaps */
  swapRoute?: SwapRoute;
  /** Block slot number where the transaction was included */
  slot?: number;
  /** Block timestamp (Unix timestamp in seconds) */
  blockTime?: number;
  /** Network confirmation status of the transaction */
  confirmationStatus?: TransactionConfirmationStatus;
  /** Address that paid for the transaction fee */
  feePayer?: string;
  /** Program instructions involved in the transaction */
  instructions?: Array<{
    programId: string;
    innerInstructionsCount: number;
  }>;
  /** Swap-specific fees (only for swap transactions) */
  swapFees?: {
    nativeFees: Array<{
      account: string;
      amount: string;
    }>;
    tokenFees: Array<{
      account: string;
      amount: string;
      mint: string;
    }>;
  };
  /** Inner swaps for multi-hop routes */
  innerSwaps?: Array<{
    tokenInputs: Array<{
      fromUserAccount: string;
      toUserAccount: string;
      fromTokenAccount: string;
      toTokenAccount: string;
      tokenAmount: number;
      mint: string;
    }>;
    tokenOutputs: Array<{
      fromUserAccount: string;
      toUserAccount: string;
      fromTokenAccount: string;
      toTokenAccount: string;
      tokenAmount: number;
      mint: string;
    }>;
    programInfo: {
      source: string;
      account: string;
      programName: string;
      instructionName: string;
    };
  }>;
  /** Number of accounts involved in the transaction */
  accountsInvolved?: number;
}

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
