/**
 * useSendTransaction Hook
 *
 * Shared hook for multi-chain token transfers.
 * Routes to the appropriate blockchain transfer service (Solana, Ethereum, Bitcoin)
 * based on the account type.
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
import { PublicKey } from '@solana/web3.js';
import { isSolanaAccount, isBitcoinAccount, isEthereumAccount } from '../utils/account';
import type { BitcoinAccount } from '../blockchain/bitcoin';
import type { EthereumAccount } from '../blockchain/ethereum';
import {
  createTransfer as solanaCreateTransfer,
  estimateFee as solanaEstimateFee,
} from '../blockchain/solana/transfer';
import {
  sendTransaction as ethSendTransaction,
  estimateTransferFee as ethEstimateTransferFee,
  formatAmount as ethFormatAmount,
} from '../blockchain/ethereum/transfer';
import {
  sendBitcoin,
  estimateBitcoinFee,
  getUtxos,
} from '../blockchain/bitcoin/transfer';
import { removeDecimals, satoshisToBtc } from '../utils/decimals';
import { isNativeEth, createNativeToken, createERC20Token } from '../utils/tokens';
import {
  fetchUtxos,
  broadcastTransaction,
} from '../api/services/bitcoin-transfer';

import type { BlockchainType, BlockchainAccount } from '../types/blockchain';
import type {
  SendTransactionParams,
  FeeEstimateResult,
  SendTransactionStatus,
} from '../types/send';

// Re-export domain types for backward compatibility
export type { SendTokenInfo, SendTransactionParams, FeeEstimateResult, SendTransactionStatus } from '../types/send';

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
  /** Reset the hook state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSendTransaction({
  account,
  blockchain,
}: UseSendTransactionParams): UseSendTransactionResult {
  const [status, setStatus] = useState<SendTransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  // ---- Fee Estimation ----

  const estimateFeeSolana = useCallback(
    async (params: SendTransactionParams): Promise<FeeEstimateResult | null> => {
      if (!account || !isSolanaAccount(account)) return null;

      const connection = await account.getConnection();
      const fee = await solanaEstimateFee(
        connection,
        account.keyPair,
        new PublicKey(params.recipientAddress),
        params.token.address,
        params.amount,
      );

      if (fee === null) return null;

      const feeInSol = removeDecimals(fee, 9);
      return {
        fee: feeInSol.toFixed(9).replace(/0+$/, '').replace(/\.$/, ''),
        feeUsd: undefined, // USD conversion handled by UI layer
      };
    },
    [account],
  );

  const estimateFeeEthereum = useCallback(
    async (params: SendTransactionParams): Promise<FeeEstimateResult | null> => {
      if (!account || !isEthereumAccount(account)) return null;

      const provider = await (account as EthereumAccount).getProvider();
      const transferToken = isNativeEth(params.token.address)
        ? createNativeToken()
        : createERC20Token(params.token.address, params.token.decimals, params.token.symbol);

      const estimate = await ethEstimateTransferFee(
        provider,
        params.recipientAddress,
        transferToken,
        params.amount,
      );

      const feeInEth = ethFormatAmount(estimate.estimatedFee, 18);
      return {
        fee: feeInEth,
        feeUsd: undefined,
      };
    },
    [account],
  );

  const estimateFeeBitcoin = useCallback(
    async (_params: SendTransactionParams): Promise<FeeEstimateResult | null> => {
      if (!account || !isBitcoinAccount(account)) return null;

      const btcAccount = account as BitcoinAccount;
      const address = btcAccount.getReceiveAddress();
      const network = btcAccount.network;

      const utxos = await getUtxos(network, address, fetchUtxos);
      // 2 outputs: recipient + change
      const fee = estimateBitcoinFee(utxos.length, 2);
      const feeInBtc = satoshisToBtc(fee);

      return {
        fee: feeInBtc.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''),
        feeUsd: undefined,
      };
    },
    [account],
  );

  const estimateFee = useCallback(
    async (params: SendTransactionParams): Promise<FeeEstimateResult | null> => {
      if (!account) return null;

      setStatus('estimating-fee');
      setError(null);

      try {
        let result: FeeEstimateResult | null = null;

        if (blockchain === 'solana' && isSolanaAccount(account)) {
          result = await estimateFeeSolana(params);
        } else if (blockchain === 'ethereum' && isEthereumAccount(account)) {
          result = await estimateFeeEthereum(params);
        } else if (blockchain === 'bitcoin' && isBitcoinAccount(account)) {
          result = await estimateFeeBitcoin(params);
        }

        setStatus('idle');
        return result;
      } catch (err) {
        console.error('[useSendTransaction] Fee estimation failed:', err);
        setStatus('idle');
        // Don't treat fee estimation failure as a blocking error
        return null;
      }
    },
    [account, blockchain, estimateFeeSolana, estimateFeeEthereum, estimateFeeBitcoin],
  );

  // ---- Transaction Execution ----

  const sendSolana = useCallback(
    async (params: SendTransactionParams): Promise<{ txId: string }> => {
      if (!account || !isSolanaAccount(account)) {
        throw new Error('Solana account not available');
      }

      const connection = await account.getConnection();
      const result = await solanaCreateTransfer(
        connection,
        account.keyPair,
        new PublicKey(params.recipientAddress),
        params.token.address,
        params.amount,
      );

      return { txId: result.txId as string };
    },
    [account],
  );

  const sendEthereum = useCallback(
    async (params: SendTransactionParams): Promise<{ txId: string }> => {
      if (!account || !isEthereumAccount(account)) {
        throw new Error('Ethereum account not available');
      }

      const ethAccount = account as EthereumAccount;
      const wallet = await ethAccount.getConnection();
      const transferToken = isNativeEth(params.token.address)
        ? createNativeToken()
        : createERC20Token(params.token.address, params.token.decimals, params.token.symbol);

      const result = await ethSendTransaction(
        wallet,
        params.recipientAddress,
        transferToken,
        params.amount,
      );

      return { txId: result.txHash };
    },
    [account],
  );

  const sendBtc = useCallback(
    async (params: SendTransactionParams): Promise<{ txId: string }> => {
      if (!account || !isBitcoinAccount(account)) {
        throw new Error('Bitcoin account not available');
      }

      const btcAccount = account as BitcoinAccount;
      const node = btcAccount.getBip32Node();
      if (!node) {
        throw new Error('Bitcoin BIP32 node not available');
      }
      const signingKeyPair = {
        ...btcAccount.keyPair,
        node,
      };

      const result = await sendBitcoin(
        btcAccount.network,
        signingKeyPair,
        params.recipientAddress,
        params.amount,
        fetchUtxos,
        broadcastTransaction,
      );

      if (!result.success) {
        throw new Error(result.error || 'Bitcoin transaction failed');
      }

      return { txId: result.txId || '' };
    },
    [account],
  );

  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<{ txId: string }> => {
      if (!account) {
        throw new Error('No account available');
      }

      setStatus('creating');
      setError(null);

      try {
        setStatus('sending');

        let result: { txId: string };

        if (blockchain === 'solana' && isSolanaAccount(account)) {
          result = await sendSolana(params);
        } else if (blockchain === 'ethereum' && isEthereumAccount(account)) {
          result = await sendEthereum(params);
        } else if (blockchain === 'bitcoin' && isBitcoinAccount(account)) {
          result = await sendBtc(params);
        } else {
          throw new Error(`Unsupported blockchain: ${blockchain}`);
        }

        setStatus('success');
        return result;
      } catch (err) {
        console.error('[useSendTransaction] Transaction failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        setStatus('failed');
        throw err;
      }
    },
    [account, blockchain, sendSolana, sendEthereum, sendBtc],
  );

  return {
    estimateFee,
    sendTransaction,
    status,
    error,
    reset,
  };
}

export default useSendTransaction;
