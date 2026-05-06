/**
 * useSendTransaction Hook
 *
 * Shared hook for multi-chain token transfers.
 * Delegates to the account's transfer() and estimateTransferFee() methods,
 * which internally route to the appropriate blockchain transfer service.
 *
 * Features:
 * - Multi-chain transfer execution
 * - Fee estimation
 * - Transaction status tracking
 * - Amount validation
 *
 * @example
 * ```tsx
 * const { estimateFee, sendTransaction, status, error, reset } = useSendTransaction({
 *   account: activeBlockchainAccount,
 *   blockchain: 'solana',
 * });
 *
 * const fee = await estimateFee({ token, recipientAddress, amount: 1.5 });
 * const result = await sendTransaction({ token, recipientAddress, amount: 1.5 });
 * ```
 */

import { useState, useCallback } from 'react';

import type { BlockchainType, BlockchainAccount } from '../types/blockchain';
import type {
  SendTransactionParams,
  FeeEstimateResult,
  SendTransactionStatus,
} from '../types/send';
import { useInvalidateAfterTx } from '../query/invalidation';

// ============================================================================
// Types
// ============================================================================

/**
 * Hook parameters
 */
export interface UseSendTransactionParams {
  /** The blockchain account instance */
  account: BlockchainAccount | undefined;
  /** Blockchain type for routing */
  blockchain: BlockchainType;
}

/**
 * Hook return type
 */
export interface UseSendTransactionResult {
  /** Estimate the fee for a transaction */
  estimateFee: (params: SendTransactionParams) => Promise<FeeEstimateResult | null>;
  /** Execute the transaction */
  sendTransaction: (params: SendTransactionParams) => Promise<{ txId: string }>;
  /** Current transaction status */
  status: SendTransactionStatus;
  /** Error message if failed */
  error: string | null;
  /** Whether the hook is in an error state */
  isError: boolean;
  /** Reset the hook state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSendTransaction({
  account,
  blockchain: _blockchain,
}: UseSendTransactionParams): UseSendTransactionResult {
  const [status, setStatus] = useState<SendTransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const invalidateAfterTx = useInvalidateAfterTx();

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  // ---- Fee Estimation ----

  const estimateFee = useCallback(
    async (params: SendTransactionParams): Promise<FeeEstimateResult | null> => {
      if (!account) return null;

      setStatus('estimating-fee');
      setError(null);

      try {
        const effectiveRecipientAddress =
          params.resolvedRecipientAddress ?? params.recipientAddress;

        const result = await account.estimateTransferFee(
          effectiveRecipientAddress,
          params.token.address,
          params.amount,
        );

        setStatus('idle');
        return result;
      } catch (err) {
        console.error('[useSendTransaction] Fee estimation failed:', err);
        setStatus('idle');
        // Don't treat fee estimation failure as a blocking error
        return null;
      }
    },
    [account],
  );

  // ---- Transaction Execution ----

  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<{ txId: string }> => {
      if (!account) {
        throw new Error('No account available');
      }

      setStatus('creating');
      setError(null);

      try {
        setStatus('sending');

        const effectiveRecipientAddress =
          params.resolvedRecipientAddress ?? params.recipientAddress;

        const result = await account.transfer(
          effectiveRecipientAddress,
          params.token.address,
          params.amount,
          // Pass token metadata for Ethereum ERC20/NFT transfers
          { decimals: params.token.decimals, symbol: params.token.symbol },
        );

        setStatus('success');
        // Fire-and-forget invalidation; do not block the caller on RQ refetch.
        const accountId = account.getReceiveAddress();
        const networkId = account.getNetworkId();
        invalidateAfterTx({
          accountId,
          networkId,
          kinds: ['balance', 'transactions'],
        }).catch(() => undefined);
        return result;
      } catch (err) {
        console.error('[useSendTransaction] Transaction failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        setStatus('failed');
        throw err;
      }
    },
    [account, invalidateAfterTx],
  );

  return {
    estimateFee,
    sendTransaction,
    status,
    error,
    isError: error !== null,
    reset,
  };
}
