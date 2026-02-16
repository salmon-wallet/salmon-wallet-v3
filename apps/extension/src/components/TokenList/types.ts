/**
 * TokenList types for @salmon/ui-extension
 */
import type { CSSProperties } from 'react';
import type { Token } from '@salmon/shared';

export type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Props for the TokenListItem component
 */
export interface TokenListItemProps {
  /** Token data to display */
  token: Token;
  /** Callback when token item is pressed */
  onPress: (token: Token) => void;
  /** Whether to hide balance values */
  hiddenBalance?: boolean;
  /** Blockchain type for layout variation */
  blockchain?: BlockchainType;
  /** Optional custom styles */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for the TokenList component
 */
export interface TokenListProps {
  /** Array of tokens to display */
  tokens: Token[];
  /** Whether the list is in a loading state */
  loading?: boolean;
  /** Callback when a token is pressed */
  onTokenPress: (token: Token) => void;
  /** Whether to hide balance values (privacy mode) */
  hiddenBalance?: boolean;
  /** Blockchain type for layout variation */
  blockchain?: BlockchainType;
  /** Maximum height for the list (enables scrolling) */
  maxHeight?: number | string;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for the TokenListSkeleton component
 */
export interface TokenListSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
}
