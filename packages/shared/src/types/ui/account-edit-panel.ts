import type { Account } from '../account';

/**
 * Props for the AccountEditPanel component (platform-agnostic)
 */
export interface AccountEditPanelPropsBase {
  /** The account being edited */
  account: Account;
  /** Callback when user wants to edit the account name */
  onEditName: () => void;
  /** Callback when user wants to change the avatar */
  onEditAvatar: () => void;
  /** Callback when user wants to backup seed phrase */
  onBackupSeed: () => void;
  /** Callback when user wants to export private key */
  onExportPrivateKey: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}
