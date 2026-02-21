import type { Account } from '../account';

/**
 * Props for the AccountsPage component (platform-agnostic)
 */
export interface AccountsPagePropsBase {
  /** Array of user accounts to display */
  accounts: Account[];
  /** The ID of the currently active account */
  activeAccountId: string;
  /** Callback when user selects/switches to an account */
  onSelectAccount: (accountId: string) => void;
  /** Callback when user taps edit on an account */
  onEditAccount: (accountId: string) => void;
  /** Callback when user confirms deletion of an account */
  onDeleteAccount: (accountId: string) => void;
  /** Callback when user taps "Add Account" */
  onAddAccount: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}
