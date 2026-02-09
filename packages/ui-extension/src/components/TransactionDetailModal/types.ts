/**
 * Type definitions for TransactionDetailModal (web/extension version)
 *
 * Uses React.CSSProperties instead of RN ViewStyle.
 * Reuses Transaction type from TransactionHistorySheet.
 */

import type React from 'react';
import type { Transaction } from '../TransactionHistorySheet/types';

export interface TransactionDetailModalProps {
  /** Whether the dialog is open */
  visible: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Transaction to display details for */
  transaction: Transaction | null;
  /** Callback when "View on Explorer" is triggered */
  onViewExplorer?: (transaction: Transaction) => void;
  /** Callback when the transaction hash is copied */
  onCopyHash?: (hash: string) => void;
  /** Callback when the share action is triggered */
  onShare?: (transaction: Transaction) => void;
  /** Additional CSS class for the dialog */
  className?: string;
  /** Additional inline styles for the dialog paper */
  style?: React.CSSProperties;
}
