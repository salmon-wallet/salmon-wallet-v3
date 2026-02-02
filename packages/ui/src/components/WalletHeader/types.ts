import type { ViewStyle } from 'react-native';

/**
 * Props for the WalletHeader component
 */
export interface WalletHeaderProps {
  /** Account name to display */
  accountName: string;
  /** Full wallet address */
  address: string;
  /** Callback when copy button is pressed */
  onCopyAddress?: () => void;
  /** Callback when settings button is pressed */
  onSettingsPress?: () => void;
  /** Callback when wallet/account switcher button is pressed */
  onWalletPress?: () => void;
  /** Optional custom styles for the container */
  style?: ViewStyle;
}
