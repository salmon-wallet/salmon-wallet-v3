/**
 * WalletHeader types for @salmon/ui-extension
 */
import type { CSSProperties } from 'react';

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
  /** Callback when account name/avatar area is pressed (for wallet switcher) */
  onWalletPress?: () => void;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
