/**
 * Type definitions for TransactionHistorySheet (web/extension version)
 *
 * These mirror the types in packages/ui but adapted for web:
 * - No ViewStyle (RN) - uses React.CSSProperties instead
 * - Same data structures for Transaction, TransactionTokenAmount, etc.
 */

import type React from 'react';
import type { Blockchain, NetworkEnvironment } from '@salmon/shared';

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
  /** Click handler to open detail view */
  onDetailClick?: (transaction: Transaction) => void;
  /** Whether to hide balance values */
  hiddenBalance?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
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
  /** Callback when a transaction detail is requested */
  onTransactionDetailClick?: (transaction: Transaction) => void;
  /** Error message to display */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Additional CSS class for the dialog */
  className?: string;
  /** Additional inline styles for the dialog paper */
  style?: React.CSSProperties;
}

/**
 * Props for PriceImpactBadge component
 */
export interface PriceImpactBadgeProps {
  /** Price impact as a string percentage (e.g., "0.5", "1.2") */
  value: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the warning/check icon */
  showIcon?: boolean;
}

/**
 * Props for ConversionRateDisplay component
 */
export interface ConversionRateDisplayProps {
  /** Input token symbol */
  fromSymbol: string;
  /** Output token symbol */
  toSymbol: string;
  /** The conversion rate (how many toTokens per 1 fromToken) */
  rate: string;
  /** Optional size variant */
  size?: 'small' | 'medium';
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for AddressCopyRow component
 */
export interface AddressCopyRowProps {
  /** Label for the address (e.g., "From", "To", "Contract") */
  label: string;
  /** The full address to display and copy */
  address: string;
  /** How to truncate the address */
  truncate?: 'short' | 'medium' | 'long' | false;
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for ExplorerLinkButton component
 */
export interface ExplorerLinkButtonProps {
  /** Transaction hash/signature */
  txHash: string;
  /** Blockchain type */
  blockchain?: Blockchain;
  /** Network environment */
  environment?: NetworkEnvironment;
  /** Which explorer to use (if single button mode) */
  explorerKey?: string;
  /** Whether to show as menu with multiple options */
  showMenu?: boolean;
  /** Callback when explorer is opened */
  onPress?: (url: string, explorerName: string) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for SwapRouteVisualization component
 */
export interface SwapRouteVisualizationProps {
  /** Transaction data */
  transaction: Transaction;
  /** Whether the visualization is expanded */
  expanded: boolean;
}
