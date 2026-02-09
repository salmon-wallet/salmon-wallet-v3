/**
 * BridgeScreen - Cross-chain bridge interface components
 *
 * Provides a complete bridge flow with token selection, amount input,
 * recipient address entry, and confirmation.
 *
 * @module BridgeScreen
 */

export { BridgeScreen } from './BridgeScreen';
export { BridgeInputScreen } from './BridgeInputScreen';
export { BridgeRecipientScreen } from './BridgeRecipientScreen';
export { BridgeReviewScreen } from './BridgeReviewScreen';
export { BridgeAmountInput } from './BridgeAmountInput';
export { RecipientAddressInput } from './RecipientAddressInput';

export type {
  // Core types
  BridgeChain,
  BridgeToken,
  BridgeEstimate,
  BridgeExchange,
  BridgeStep,
  // Component props
  BridgeScreenProps,
  BridgeInputScreenProps,
  BridgeRecipientScreenProps,
  BridgeReviewScreenProps,
  BridgeAmountInputProps,
  RecipientAddressInputProps,
  ChainSelectorProps,
  BridgeTokenSelectorProps,
} from './types';
