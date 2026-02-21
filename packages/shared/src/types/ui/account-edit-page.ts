import type { Account } from '../account';

/**
 * Props for the AccountEditPage component (platform-agnostic)
 */
export interface AccountEditPagePropsBase {
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
