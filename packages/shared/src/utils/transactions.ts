/**
 * Transaction transform utilities.
 *
 * Extracted from useTransactions.ts.
 *
 * @module utils/transactions
 */

import type {
  Transaction,
  TransactionDisplayStatus,
  TransactionType,
  TransactionItem,
  SolanaTransaction,
} from '../types/transaction';

/**
 * Transform a Solana backend transaction to the UI Transaction format.
 *
 * The backend already returns transactions in a UI-friendly format
 * with inputs/outputs. This function does a simple mapping with type assertions.
 */
export function transformSolanaTransaction(tx: SolanaTransaction): Transaction {
  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type: tx.type as TransactionType,
    fee: tx.fee ?? undefined,
    inputs: tx.inputs,
    outputs: tx.outputs,
    description: tx.description,
    source: tx.source,
    heliusType: tx.heliusType,
  };
}

/**
 * Transform a multi-chain (Bitcoin/Ethereum) transaction to the UI Transaction format.
 *
 * The multi-chain API returns transactions in a similar format but with
 * some differences in the fee structure (amount is string vs number).
 */
export function transformMultichainTransaction(tx: TransactionItem): Transaction {
  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type: tx.type as TransactionType,
    fee: tx.fee
      ? {
          amount: Number(tx.fee.amount),
          decimals: tx.fee.decimals,
          symbol: tx.fee.symbol,
        }
      : undefined,
    inputs: tx.inputs,
    outputs: tx.outputs,
    description: tx.description,
    source: tx.source,
  };
}
