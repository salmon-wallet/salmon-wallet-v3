/**
 * TransactionHistorySheet Component
 *
 * A bottom sheet modal for displaying transaction history.
 * Supports Solana transactions with pagination, loading states, and error handling.
 *
 * @example
 * ```tsx
 * import { TransactionHistorySheet, TransactionItem } from '@salmon/ui';
 * import { useTransactions } from '@salmon/shared';
 *
 * function ActivityScreen() {
 *   const { transactions, loading, loadMore, hasMore } = useTransactions({
 *     address: walletAddress,
 *     networkId: 'solana-mainnet',
 *   });
 *
 *   return (
 *     <TransactionHistorySheet
 *       visible={isVisible}
 *       onClose={() => setIsVisible(false)}
 *       transactions={transactions}
 *       loading={loading}
 *       hasMore={hasMore}
 *       onLoadMore={loadMore}
 *     />
 *   );
 * }
 * ```
 */

export { TransactionHistorySheet, default } from './TransactionHistorySheet';
export { TransactionItem } from './TransactionItem';

export type {
  TransactionHistorySheetProps,
  TransactionItemProps,
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionTokenAmount,
  TransactionFee,
} from './types';
