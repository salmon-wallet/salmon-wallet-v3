/**
 * Type definitions for TransactionHistorySheet (Web/Extension)
 *
 * Core transaction types are imported from @salmon/shared
 * This file only contains platform-specific component props for web
 */

import type React from 'react';
import type {
  Blockchain,
  NetworkEnvironment,
  Transaction,
  TransactionItemPropsBase,
  TransactionHistorySheetPropsBase,
} from '@salmon/shared';

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
 * Props for TransactionItem component (Web/Extension)
 */
export interface TransactionItemProps
  extends TransactionItemPropsBase<React.CSSProperties> {
  /** Click handler to open detail view */
  onDetailClick?: (transaction: Transaction) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for TransactionHistorySheet component (Web/Extension)
 */
export interface TransactionHistorySheetProps
  extends TransactionHistorySheetPropsBase<React.CSSProperties> {
  /** Callback when a transaction detail is requested */
  onTransactionDetailClick?: (transaction: Transaction) => void;
  /** Additional CSS class for the dialog */
  className?: string;
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
