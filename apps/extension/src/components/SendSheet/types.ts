/**
 * SendSheet types for web/extension version
 *
 * Adapted from packages/ui (React Native) SendSheet types.
 * Uses CSSProperties instead of ViewStyle for web compatibility.
 */

import type { CSSProperties } from 'react';
import type {
  SendStep,
  SendToken,
  SendSheetPropsBase,
  StepTokenSelectProps,
  StepAddressAmountPropsBase,
  StepConfirmationProps,
  BlockchainType,
} from '@salmon/shared';

// Re-export shared types for convenience
export type { SendStep, SendToken, BlockchainType, StepTokenSelectProps, StepConfirmationProps };

/**
 * Props for the SendSheet component (Web/Extension)
 */
export interface SendSheetProps extends SendSheetPropsBase<CSSProperties> {
  /** Additional CSS class */
  className?: string;
}

/**
 * Props for the address and amount step (Web/Extension)
 */
export interface StepAddressAmountProps extends StepAddressAmountPropsBase {}
