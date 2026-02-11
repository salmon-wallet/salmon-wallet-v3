/**
 * SwapScreen types for @salmon/ui (React Native)
 *
 * Re-exports shared swap types with ViewStyle for React Native.
 */
import type { ViewStyle } from 'react-native';

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
  SwapScreenStep,
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
  SwapScreenStep,
} from '@salmon/shared';

/**
 * Current step in swap flow (React Native version)
 * @deprecated Use SwapScreenStep from @salmon/shared instead
 */
export type SwapStep = SwapScreenStep;

/**
 * Props for SwapTabSelector component (React Native)
 */
export interface SwapTabSelectorProps extends SwapTabSelectorPropsBase<ViewStyle> {}

/**
 * Props for SwapAmountInput component (React Native)
 */
export interface SwapAmountInputProps extends SwapAmountInputPropsBase<ViewStyle> {}

/**
 * Props for SwapDetailRow component (React Native)
 */
export interface SwapDetailRowProps extends SwapDetailRowPropsBase<ViewStyle> {}

/**
 * Props for SwapReviewCard component (React Native)
 */
export interface SwapReviewCardProps extends SwapReviewCardPropsBase<ViewStyle> {}

/**
 * Props for SwapReviewScreen sub-component (React Native)
 */
export interface SwapReviewScreenProps extends SwapReviewScreenPropsBase<ViewStyle> {}

/**
 * Props for SwapInputScreen sub-component (React Native)
 */
export interface SwapInputScreenProps extends SwapInputScreenPropsBase<ViewStyle> {}

/**
 * Props for main SwapScreen component (React Native)
 */
export interface SwapScreenProps extends SwapScreenPropsBase<ViewStyle> {}
