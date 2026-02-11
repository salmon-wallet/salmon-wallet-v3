import type { Account } from '../index';

/**
 * Props for the WalletSwitcherSheet component (platform-agnostic, no style prop)
 */
export interface WalletSwitcherSheetPropsBase {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** Array of user accounts to display */
  accounts: Account[];
  /** The ID of the currently active account */
  activeAccountId: string;
  /** Callback when user selects a different account */
  onSelectAccount: (accountId: string) => void;
  /** Callback when user taps the "Add Account" button */
  onAddAccount: () => void;
  /** Callback when user taps the "Edit Account" button */
  onEditAccount?: (accountId: string) => void;
  /** Callback when user confirms deletion of an account */
  onDeleteAccount?: (accountId: string) => void;
}

/**
 * Props for individual account list items (base - platform-agnostic)
 */
export interface AccountListItemPropsBase {
  /** The account data to display */
  account: Account;
  /** Whether this account is currently active */
  isActive: boolean;
  /** Callback when the item is pressed/clicked */
  onPress: () => void;
  /** Callback when the edit button is pressed */
  onEdit?: () => void;
  /** Callback when the delete button is pressed */
  onDelete?: () => void;
  /** Whether the delete button should be enabled */
  canDelete: boolean;
}
