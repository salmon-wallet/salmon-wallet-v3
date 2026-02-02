/**
 * WalletSwitcherSheet Type Definitions
 *
 * Types for the wallet/account switcher sheet component that allows users
 * to view, select, and manage their wallet accounts.
 */

import type { Account } from '@salmon/shared';

/**
 * Props for the WalletSwitcherSheet component
 */
export interface WalletSwitcherSheetProps {
  /**
   * Whether the sheet is visible.
   * When changed from false to true, the sheet slides down into view.
   * When changed from true to false, the sheet slides up out of view.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   * Called when:
   * - User taps on the backdrop
   * - User presses the close button
   * - User presses the Android back button
   */
  onClose: () => void;

  /**
   * Array of user accounts to display in the list.
   * Typically provided by useAccounts hook.
   */
  accounts: Account[];

  /**
   * The ID of the currently active account.
   * Used to highlight the active account in the list.
   */
  activeAccountId: string;

  /**
   * Callback when user selects a different account.
   * @param accountId - The ID of the selected account
   */
  onSelectAccount: (accountId: string) => void;

  /**
   * Callback when user taps the "Add Account" button.
   * Should navigate to account creation/import flow.
   */
  onAddAccount: () => void;

  /**
   * Callback when user taps the "Edit Account" button.
   * Should navigate to account edit flow.
   * @param accountId - The ID of the account to edit
   */
  onEditAccount?: (accountId: string) => void;

  /**
   * Callback when user confirms deletion of an account.
   * Called after user confirms the deletion in the alert dialog.
   * @param accountId - The ID of the account to delete
   */
  onDeleteAccount?: (accountId: string) => void;
}

/**
 * Props for individual account list items
 */
export interface AccountListItemProps {
  /**
   * The account data to display
   */
  account: Account;

  /**
   * Whether this account is currently active
   */
  isActive: boolean;

  /**
   * Callback when the item is pressed
   */
  onPress: () => void;

  /**
   * Callback when the edit button is pressed
   */
  onEdit?: () => void;

  /**
   * Callback when the delete button is pressed
   */
  onDelete?: () => void;

  /**
   * Whether the delete button should be disabled
   * (e.g., when this is the last account)
   */
  canDelete: boolean;
}
