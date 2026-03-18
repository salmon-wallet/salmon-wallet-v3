import type { ViewStyle } from 'react-native';
import type { WalletHeaderPropsBase } from '@salmon/shared';

/**
 * Props for the WalletHeader component (React Native)
 */
export interface WalletHeaderProps extends WalletHeaderPropsBase<ViewStyle> {
  /** When true, content fades in from opacity 0 → 1. Used after unlock animation. */
  animateIn?: boolean;
}
