/**
 * WalletSwitcherSheet Component Types
 *
 * Type definitions for the WalletSwitcherSheet component which provides
 * a dialog for selecting and managing wallet accounts in the browser extension.
 */

import type { Account } from '@salmon/shared';

/**
 * Props for the WalletSwitcherSheet component
 */
export interface WalletSwitcherSheetProps {
  /**
   * Whether the wallet switcher sheet is visible.
   * When true, the dialog is displayed.
   * When false, the dialog is hidden.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   * Called when:
   * - User clicks on the backdrop
   * - User clicks the close button
   * - User presses Escape key
   */
  onClose: () => void;

  /**
   * Array of available accounts to display in the switcher.
   */
  accounts: Account[];

  /**
   * The ID of the currently active account.
   * Used to show a checkmark indicator on the selected account.
   */
  activeAccountId: string;

  /**
   * Callback when a user selects a different account.
   * @param accountId - The ID of the selected account
   */
  onSelectAccount: (accountId: string) => void;

  /**
   * Callback when user clicks the "Add New Account" button.
   */
  onAddAccount: () => void;

  /**
   * Optional callback when user clicks the edit button for an account.
   * @param accountId - The ID of the account to edit
   */
  onEditAccount?: (accountId: string) => void;

  /**
   * Optional callback when user confirms deletion of an account.
   * @param accountId - The ID of the account to delete
   */
  onDeleteAccount?: (accountId: string) => void;
}

/**
 * Props for the AccountListItem component
 */
export interface AccountListItemProps {
  /**
   * The account to display
   */
  account: Account;

  /**
   * Whether this account is currently active
   */
  isActive: boolean;

  /**
   * Callback when the account row is clicked
   */
  onSelect: () => void;

  /**
   * Optional callback when edit button is clicked
   */
  onEdit?: () => void;

  /**
   * Optional callback when delete button is clicked
   */
  onDelete?: () => void;
}

/**
 * Avatar color palette for deterministic account colors.
 * Colors are selected based on account ID hash.
 */
export const AVATAR_COLORS = [
  '#FF5C45', // Salmon accent
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const;
