import type { CSSProperties } from 'react';
import type {
  BridgeChain,
  BridgeToken,
  BridgeEstimate,
  BridgeExchange,
  BridgeRecipientScreenPropsBase,
  BridgeReviewScreenPropsBase,
} from '@salmon/shared/src/types/ui/bridge-screen';

// Re-export shared data types for consumers
export type { BridgeChain, BridgeToken, BridgeEstimate, BridgeExchange };

/**
 * Props for BridgeRecipientScreen sub-component (Web/Extension)
 */
export interface BridgeRecipientScreenProps
  extends BridgeRecipientScreenPropsBase<CSSProperties> {}

/**
 * Props for BridgeReviewScreen sub-component (Web/Extension)
 */
export interface BridgeReviewScreenProps
  extends BridgeReviewScreenPropsBase<CSSProperties> {}
