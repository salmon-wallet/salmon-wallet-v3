/**
 * Transaction types and utilities for the Salmon Wallet
 * @module types/transaction
 */

/**
 * Enum representing all possible transaction statuses in the wallet.
 * Used to track the lifecycle of transactions across different operations.
 */
export const TRANSACTION_STATUS = {
  /** Transaction completed successfully */
  SUCCESS: 'success',
  /** Transaction failed */
  FAIL: 'fail',
  /** Transaction completed with warnings */
  WARNING: 'warning',
  /** Transaction is being created */
  CREATING: 'creating',
  /** Transaction is being sent to the network */
  SENDING: 'sending',
  /** NFT is being listed for sale */
  LISTING: 'listing',
  /** NFT listing is being cancelled */
  UNLISTING: 'unlisting',
  /** Creating an offer for an NFT */
  CREATING_OFFER: 'creating-offer',
  /** Canceling an existing offer */
  CANCELING_OFFER: 'canceling-offer',
  /** Purchasing an NFT */
  BUYING: 'buying',
  /** Token swap is in progress */
  SWAPPING: 'swapping',
  /** Cross-chain bridge transfer is in progress */
  BRIDGING: 'bridging',
  /** Bridge transfer completed successfully */
  BRIDGE_SUCCESS: 'bridge_success',
} as const;

/**
 * Type representing all possible transaction status values.
 * Derived from the TRANSACTION_STATUS constant for type safety.
 */
export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

/**
 * Human-readable labels for each transaction status.
 * Used for displaying status information in the UI.
 */
const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TRANSACTION_STATUS.SUCCESS]: 'Success',
  [TRANSACTION_STATUS.FAIL]: 'Failed',
  [TRANSACTION_STATUS.WARNING]: 'Warning',
  [TRANSACTION_STATUS.CREATING]: 'Creating',
  [TRANSACTION_STATUS.SENDING]: 'Sending',
  [TRANSACTION_STATUS.LISTING]: 'Listing',
  [TRANSACTION_STATUS.UNLISTING]: 'Unlisting',
  [TRANSACTION_STATUS.CREATING_OFFER]: 'Creating Offer',
  [TRANSACTION_STATUS.CANCELING_OFFER]: 'Canceling Offer',
  [TRANSACTION_STATUS.BUYING]: 'Buying',
  [TRANSACTION_STATUS.SWAPPING]: 'Swapping',
  [TRANSACTION_STATUS.BRIDGING]: 'Bridging',
  [TRANSACTION_STATUS.BRIDGE_SUCCESS]: 'Bridge Complete',
};

/**
 * Returns a human-readable label for the given transaction status.
 *
 * @param status - The transaction status to get a label for
 * @returns A human-readable string representation of the status
 *
 * @example
 * ```typescript
 * const label = getTransactionStatusLabel('swapping');
 * console.log(label); // "Swapping"
 * ```
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  return TRANSACTION_STATUS_LABELS[status] ?? 'Unknown';
}

/**
 * Checks if a transaction status indicates the transaction is still in progress.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction is still processing
 *
 * @example
 * ```typescript
 * const isProcessing = isTransactionPending('sending');
 * console.log(isProcessing); // true
 * ```
 */
export function isTransactionPending(status: TransactionStatus): boolean {
  const pendingStatuses: TransactionStatus[] = [
    TRANSACTION_STATUS.CREATING,
    TRANSACTION_STATUS.SENDING,
    TRANSACTION_STATUS.LISTING,
    TRANSACTION_STATUS.UNLISTING,
    TRANSACTION_STATUS.CREATING_OFFER,
    TRANSACTION_STATUS.CANCELING_OFFER,
    TRANSACTION_STATUS.BUYING,
    TRANSACTION_STATUS.SWAPPING,
    TRANSACTION_STATUS.BRIDGING,
  ];

  return pendingStatuses.includes(status);
}

/**
 * Checks if a transaction status indicates success or completion.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction completed successfully
 */
export function isTransactionSuccess(status: TransactionStatus): boolean {
  return (
    status === TRANSACTION_STATUS.SUCCESS ||
    status === TRANSACTION_STATUS.BRIDGE_SUCCESS
  );
}

/**
 * Checks if a transaction status indicates failure.
 *
 * @param status - The transaction status to check
 * @returns True if the transaction failed
 */
export function isTransactionFailed(status: TransactionStatus): boolean {
  return status === TRANSACTION_STATUS.FAIL;
}
