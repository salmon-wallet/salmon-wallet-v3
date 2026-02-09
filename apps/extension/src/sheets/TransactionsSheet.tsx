/**
 * TransactionsSheet - Re-exports TransactionHistorySheet from @salmon/ui-extension
 *
 * This thin wrapper re-exports the TransactionHistorySheet component under the
 * local name "TransactionsSheet" so consumers in apps/extension can
 * import it with a name that matches the extension routing conventions.
 */

export { TransactionHistorySheet as TransactionsSheet } from '@salmon/ui-extension';
export type { TransactionHistorySheetProps as TransactionsSheetProps } from '@salmon/ui-extension';
