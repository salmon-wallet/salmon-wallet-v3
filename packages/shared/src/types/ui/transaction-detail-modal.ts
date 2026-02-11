import type { Transaction } from '../index';

/**
 * Props for the TransactionDetailModal component (base - platform-agnostic)
 */
export interface TransactionDetailModalPropsBase<TStyle = any> {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Transaction to display details for */
  transaction: Transaction | null;
  /** Callback when "View on Explorer" is triggered */
  onViewExplorer?: (transaction: Transaction) => void;
  /** Callback when the transaction hash is copied */
  onCopyHash?: (hash: string) => void;
  /** Callback when the share action is triggered */
  onShare?: (transaction: Transaction) => void;
  /** Optional custom styles */
  style?: TStyle;
}
