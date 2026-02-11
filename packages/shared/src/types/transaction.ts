/**
 * Transaction types and utilities for the Salmon Wallet
 * @module types/transaction
 */

// ============================================================================
// Transaction Display Types (for UI components)
// ============================================================================

/**
 * Transaction types for display and classification
 * Covers all blockchain transaction categories
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
 * Transaction display status for history views
 * Simplified status for UI display (3 states)
 * Note: Different from internal TransactionStatus which has 13 states
 */
export type TransactionDisplayStatus = 'completed' | 'failed' | 'pending';

/**
 * NFT attribute for metadata
 * Re-export from blockchain/solana/nft for convenience
 */
export type { NftAttribute } from '../blockchain/solana/nft';

/**
 * Token amount in a transaction
 * Supports both regular tokens and NFTs
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
  nftAttributes?: import('../blockchain/solana/nft').NftAttribute[];
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
 * Complete transaction data for display in UI
 * Supports all transaction types with full metadata
 */
export interface Transaction {
  /** Transaction ID (signature) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status */
  status: TransactionDisplayStatus;
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

// ============================================================================
// Internal Transaction Status (for wallet lifecycle management)
// ============================================================================

/**
 * Enum representing all possible transaction statuses in the wallet.
 * Used to track the lifecycle of transactions across different operations.
 * Note: This is different from TransactionDisplayStatus which is for UI
 */
export const TRANSACTION_STATUS = {
  /** Transaction completed successfully */
  SUCCESS: 'success',
  /** Transaction failed */
  FAIL: 'fail',
  /** Transaction completed with warnings */
  WARNING: 'warning',
  /** Transaction is being created */
  CREATING: 'creating',
  /** Transaction is being sent to the network */
  SENDING: 'sending',
  /** NFT is being listed for sale */
  LISTING: 'listing',
  /** NFT listing is being cancelled */
  UNLISTING: 'unlisting',
  /** Creating an offer for an NFT */
  CREATING_OFFER: 'creating-offer',
  /** Canceling an existing offer */
  CANCELING_OFFER: 'canceling-offer',
  /** Purchasing an NFT */
  BUYING: 'buying',
  /** Token swap is in progress */
  SWAPPING: 'swapping',
  /** Cross-chain bridge transfer is in progress */
  BRIDGING: 'bridging',
  /** Bridge transfer completed successfully */
  BRIDGE_SUCCESS: 'bridge_success',
} as const;

/**
 * Type representing all possible transaction status values.
 * Derived from the TRANSACTION_STATUS constant for type safety.
 */
export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

/**
 * Human-readable labels for each transaction status.
 * Used for displaying status information in the UI.
 */
const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.SUCCESS]: 'Success',
  [TRANSACTION_STATUS.FAIL]: 'Failed',
  [TRANSACTION_STATUS.WARNING]: 'Warning',
  [TRANSACTION_STATUS.CREATING]: 'Creating',
  [TRANSACTION_STATUS.SENDING]: 'Sending',
  [TRANSACTION_STATUS.LISTING]: 'Listing',
  [TRANSACTION_STATUS.UNLISTING]: 'Unlisting',
  [TRANSACTION_STATUS.CREATING_OFFER]: 'Creating Offer',
  [TRANSACTION_STATUS.CANCELING_OFFER]: 'Canceling Offer',
  [TRANSACTION_STATUS.BUYING]: 'Buying',
  [TRANSACTION_STATUS.SWAPPING]: 'Swapping',
  [TRANSACTION_STATUS.BRIDGING]: 'Bridging',
  [TRANSACTION_STATUS.BRIDGE_SUCCESS]: 'Bridge Complete',
};

/**
 * Returns a human-readable label for the given transaction status.
 *
 * @param status - The transaction status to get a label for
 * @returns A human-readable string representation of the status
 *
 * @example
 * ```typescript
 * const label = getTransactionStatusLabel('swapping');
 * console.log(label); // "Swapping"
 * ```
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  return TRANSACTION_STATUS_LABELS[status] ?? 'Unknown';
}

/**
 * Checks if a transaction status indicates the transaction is still in progress.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction is still processing
 *
 * @example
 * ```typescript
 * const isProcessing = isTransactionPending('sending');
 * console.log(isProcessing); // true
 * ```
 */
export function isTransactionPending(status: TransactionStatus): boolean {
  const pendingStatuses: TransactionStatus[] = [
    TRANSACTION_STATUS.CREATING,
    TRANSACTION_STATUS.SENDING,
    TRANSACTION_STATUS.LISTING,
    TRANSACTION_STATUS.UNLISTING,
    TRANSACTION_STATUS.CREATING_OFFER,
    TRANSACTION_STATUS.CANCELING_OFFER,
    TRANSACTION_STATUS.BUYING,
    TRANSACTION_STATUS.SWAPPING,
    TRANSACTION_STATUS.BRIDGING,
  ];

  return pendingStatuses.includes(status);
}

/**
 * Checks if a transaction status indicates success or completion.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction completed successfully
 */
export function isTransactionSuccess(status: TransactionStatus): boolean {
  return (
    status === TRANSACTION_STATUS.SUCCESS ||
    status === TRANSACTION_STATUS.BRIDGE_SUCCESS
  );
}

/**
 * Checks if a transaction status indicates failure.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction failed
 */
export function isTransactionFailed(status: TransactionStatus): boolean {
  return status === TRANSACTION_STATUS.FAIL;
}
