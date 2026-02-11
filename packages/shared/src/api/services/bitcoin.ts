/**
 * Bitcoin API Service
 * Handles all backend communication for Bitcoin operations.
 *
 * API Endpoints:
 * - GET /v1/{networkId}/account/{address}/balance?include=logo - Get balance with logo
 * - GET /v1/{networkId}/account/{address}/utxo - Get UTXOs
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 * - GET /v1/{networkId}/account/{address}/transactions/{txId} - Get single transaction
 * - POST /v1/{networkId}/account/{address}/transactions - Broadcast transaction
 */

import { apiClient, ApiError } from '../client';
import type { BitcoinNetworkId } from '../../types/blockchain';
import type {
  BitcoinBalance,
  BitcoinUtxo,
  BitcoinPagingParams,
  BitcoinTransactionsResponse,
  BitcoinTransaction,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
} from '../../types/transfer';

// Re-export types for backwards compatibility
export type {
  BitcoinBalance,
  BitcoinUtxo,
  BitcoinTransactionInput,
  BitcoinTransactionOutput,
  BitcoinTransaction,
  BitcoinPagingParams,
  BitcoinTransactionsResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
} from '../../types/transfer';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get Bitcoin balance for an address
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/balance?include=logo
 *
 * @param networkId - Bitcoin network identifier
 * @param address - Bitcoin address
 * @returns Balance data with logo, or null if not found
 */
export async function getBitcoinBalance(
  networkId: BitcoinNetworkId,
  address: string
): Promise<BitcoinBalance | null> {
  try {
    const { data } = await apiClient.get<BitcoinBalance>(
      `/v1/${networkId}/account/${address}/balance`,
      {
        params: { include: 'logo' },
      }
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[BitcoinService] Failed to get balance:', error);
    throw error;
  }
}

/**
 * Get UTXOs (Unspent Transaction Outputs) for an address
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/utxo
 *
 * @param networkId - Bitcoin network identifier
 * @param address - Bitcoin address
 * @returns Array of UTXOs, or empty array if not found
 */
export async function getBitcoinUtxos(
  networkId: BitcoinNetworkId,
  address: string
): Promise<BitcoinUtxo[]> {
  try {
    const { data } = await apiClient.get<BitcoinUtxo[]>(
      `/v1/${networkId}/account/${address}/utxo`
    );
    return data || [];
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return [];
    }
    console.error('[BitcoinService] Failed to get UTXOs:', error);
    throw error;
  }
}

/**
 * Get paginated transactions for an address
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Bitcoin network identifier
 * @param address - Bitcoin address
 * @param paging - Optional pagination parameters
 * @returns Paginated transaction response
 */
export async function getBitcoinTransactions(
  networkId: BitcoinNetworkId,
  address: string,
  paging?: BitcoinPagingParams
): Promise<BitcoinTransactionsResponse> {
  try {
    const params: Record<string, string | number> = {};

    if (paging?.pageToken) {
      params.pageToken = paging.pageToken;
    }
    if (paging?.pageSize) {
      params.pageSize = paging.pageSize;
    }

    const { data } = await apiClient.get<BitcoinTransactionsResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { params }
    );

    return {
      transactions: data.transactions || [],
      nextPageToken: data.nextPageToken,
      total: data.total,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return { transactions: [], nextPageToken: null };
    }
    console.error('[BitcoinService] Failed to get transactions:', error);
    throw error;
  }
}

/**
 * Get a single transaction by ID
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions/{txId}
 *
 * @param networkId - Bitcoin network identifier
 * @param address - Bitcoin address
 * @param txId - Transaction ID
 * @returns Transaction data, or null if not found
 */
export async function getBitcoinTransaction(
  networkId: BitcoinNetworkId,
  address: string,
  txId: string
): Promise<BitcoinTransaction | null> {
  try {
    const { data } = await apiClient.get<BitcoinTransaction>(
      `/v1/${networkId}/account/${address}/transactions/${txId}`
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[BitcoinService] Failed to get transaction:', error);
    throw error;
  }
}

/**
 * Broadcast a signed Bitcoin transaction
 *
 * Endpoint: POST /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Bitcoin network identifier
 * @param address - Bitcoin address (sender)
 * @param signedTx - Signed transaction hex
 * @returns Broadcast result with transaction ID
 */
export async function broadcastBitcoinTransaction(
  networkId: BitcoinNetworkId,
  address: string,
  signedTx: string
): Promise<BroadcastTransactionResponse> {
  try {
    const { data } = await apiClient.post<BroadcastTransactionResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { tx: signedTx } as BroadcastTransactionRequest
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[BitcoinService] Failed to broadcast transaction:', error.message);
      return {
        txid: '',
        success: false,
        error: error.message,
      };
    }
    console.error('[BitcoinService] Failed to broadcast transaction:', error);
    throw error;
  }
}
