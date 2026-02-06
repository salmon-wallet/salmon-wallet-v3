import type { ViewStyle } from 'react-native';
import type { Transaction } from '../TransactionHistorySheet/types';

export interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onViewExplorer?: (transaction: Transaction) => void;
  onCopyHash?: (hash: string) => void;
  onShare?: (transaction: Transaction) => void;
  style?: ViewStyle;
}
