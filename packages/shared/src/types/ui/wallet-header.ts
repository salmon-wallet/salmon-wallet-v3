/**
 * Props for the WalletHeader component (base - platform-agnostic)
 */
export interface WalletHeaderPropsBase<TStyle = any> {
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
  /** Developer mode - shows more address characters (8+8 instead of 4+4) */
  developerMode?: boolean;
  /** Optional custom styles for the container */
  style?: TStyle;
}
