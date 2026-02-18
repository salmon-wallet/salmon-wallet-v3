import type { ViewStyle } from 'react-native';
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
 * Props for the SendSheet component (React Native)
 */
export interface SendSheetProps extends SendSheetPropsBase<ViewStyle> {}

/**
 * Props for the address and amount step (React Native)
 */
export interface StepAddressAmountProps extends StepAddressAmountPropsBase {}
