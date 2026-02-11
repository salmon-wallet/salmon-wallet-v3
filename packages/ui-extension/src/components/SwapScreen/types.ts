/**
 * SwapScreen types for @salmon/ui-extension (Web)
 *
 * Re-exports shared swap types with CSSProperties for web.
 */
import type { CSSProperties } from 'react';

// Re-export all base types from shared
export type {
  // Network & Chain
  SwapNetworkId,
  SwapChainType,
  // Backend API types
  SwapOrderResponse,
  SwapQuote,
  // UI types
  SwapToken,
  SwapTab,
  SwapStepBase,
  BridgeTokenSimple,
  BridgeEstimateSimple,
  BridgeExchangeSimple,
} from '@salmon/shared';

// Import generic prop types from shared
import type {
  SwapTabSelectorProps as SwapTabSelectorPropsBase,
  SwapAmountInputProps as SwapAmountInputPropsBase,
  SwapDetailRowProps as SwapDetailRowPropsBase,
  SwapReviewCardProps as SwapReviewCardPropsBase,
  SwapReviewScreenProps as SwapReviewScreenPropsBase,
  SwapInputScreenProps as SwapInputScreenPropsBase,
  SwapScreenProps as SwapScreenPropsBase,
} from '@salmon/shared';

/**
 * Current step in swap flow (Web version - includes recipient step)
 */
export type SwapStep = 'input' | 'recipient' | 'review' | 'processing' | 'success' | 'error';

/**
 * Props for SwapTabSelector component (Web)
 */
export interface SwapTabSelectorProps extends SwapTabSelectorPropsBase<CSSProperties> {}

/**
 * Props for SwapAmountInput component (Web)
 */
export interface SwapAmountInputProps extends SwapAmountInputPropsBase<CSSProperties> {}

/**
 * Props for SwapDetailRow component (Web)
 */
export interface SwapDetailRowProps extends SwapDetailRowPropsBase<CSSProperties> {}

/**
 * Props for SwapReviewCard component (Web)
 */
export interface SwapReviewCardProps extends SwapReviewCardPropsBase<CSSProperties> {}

/**
 * Props for SwapReviewScreen sub-component (Web)
 */
export interface SwapReviewScreenProps extends SwapReviewScreenPropsBase<CSSProperties> {}

/**
 * Props for SwapInputScreen sub-component (Web)
 */
export interface SwapInputScreenProps extends SwapInputScreenPropsBase<CSSProperties> {}

/**
 * Props for main SwapScreen component (Web)
 */
export interface SwapScreenProps extends SwapScreenPropsBase<CSSProperties> {}
