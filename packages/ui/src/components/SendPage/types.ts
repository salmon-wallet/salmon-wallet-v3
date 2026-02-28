/**
 * SendPage types for web/extension version
 *
 * Page-based send flow (replaces the former SendSheet dialog).
 * Uses CSSProperties instead of ViewStyle for web compatibility.
 */

import type {
  SendStep,
  SendToken,
  StepTokenSelectProps,
  StepAddressAmountPropsBase,
  StepConfirmationProps,
  BlockchainType,
  BlockchainAccount,
} from '@salmon/shared';

// Re-export shared types for convenience
export type { SendStep, SendToken, BlockchainType, StepTokenSelectProps, StepConfirmationProps };

/**
 * Props for the SendPage component (Web/Extension)
 */
export interface SendPageProps {
  /** Available tokens from useBalance */
  tokens: SendToken[];
  /** Blockchain type for address validation and transfer routing */
  blockchain: BlockchainType;
  /** The active blockchain account */
  account: BlockchainAccount;
  /** Navigate back to home */
  onBack: () => void;
  /** Callback when transaction completes successfully */
  onSuccess?: (txId: string) => void;
  /** Show unverified/unknown tokens (developer mode) */
  showUnverifiedTokens?: boolean;
}

/**
 * Props for the address and amount step (Web/Extension)
 */
export interface StepAddressAmountProps extends StepAddressAmountPropsBase {}
