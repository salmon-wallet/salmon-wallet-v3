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

// ============================================================================
// Types
// ============================================================================

/**
 * Bitcoin network identifier
 */
export type BitcoinNetworkId = 'bitcoin-mainnet' | 'bitcoin-testnet';

/**
 * Bitcoin balance response from the API
 */
export interface BitcoinBalance {
  /** Total confirmed balance in satoshis */
  confirmed: number;
  /** Unconfirmed balance in satoshis */
  unconfirmed: number;
  /** Total balance (confirmed + unconfirmed) in satoshis */
  total: number;
  /** Bitcoin logo URL (when include=logo is specified) */
  logo?: string | null;
}

/**
 * Bitcoin UTXO (Unspent Transaction Output)
 */
export interface BitcoinUtxo {
  /** Transaction ID */
  txid: string;
  /** Output index in the transaction */
  vout: number;
  /** Value in satoshis */
  value: number;
  /** Script public key (hex) */
  scriptPubKey: string;
  /** Block height where the transaction was confirmed (null if unconfirmed) */
  height: number | null;
  /** Number of confirmations */
  confirmations: number;
}

/**
 * Bitcoin transaction input
 */
export interface BitcoinTransactionInput {
  /** Previous transaction ID */
  txid: string;
  /** Previous output index */
  vout: number;
  /** Script signature (hex) */
  scriptSig?: string;
  /** Witness data (for SegWit transactions) */
  witness?: string[];
  /** Sequence number */
  sequence: number;
  /** Value in satoshis (if available) */
  value?: number;
  /** Address (if available) */
  address?: string;
}

/**
 * Bitcoin transaction output
 */
export interface BitcoinTransactionOutput {
  /** Output index */
  n: number;
  /** Value in satoshis */
  value: number;
  /** Script public key (hex) */
  scriptPubKey: string;
  /** Output address (if available) */
  address?: string;
  /** Script type (e.g., 'p2pkh', 'p2sh', 'p2wpkh') */
  type?: string;
}

/**
 * Bitcoin transaction
 */
export interface BitcoinTransaction {
  /** Transaction ID */
  txid: string;
  /** Transaction hash */
  hash: string;
  /** Transaction version */
  version: number;
  /** Transaction size in bytes */
  size: number;
  /** Virtual size (for fee calculation) */
  vsize: number;
  /** Transaction weight */
  weight: number;
  /** Lock time */
  locktime: number;
  /** Transaction inputs */
  vin: BitcoinTransactionInput[];
  /** Transaction outputs */
  vout: BitcoinTransactionOutput[];
  /** Block hash (null if unconfirmed) */
  blockhash?: string | null;
  /** Block height (null if unconfirmed) */
  blockheight?: number | null;
  /** Block time (Unix timestamp, null if unconfirmed) */
  blocktime?: number | null;
  /** Number of confirmations */
  confirmations: number;
  /** Transaction time (Unix timestamp) */
  time?: number;
  /** Total fee in satoshis */
  fee?: number;
  /** Fee rate in sat/vB */
  feeRate?: number;
}

/**
 * Pagination parameters for transaction queries
 */
export interface BitcoinPagingParams {
  /** Page token for cursor-based pagination */
  pageToken?: string;
  /** Number of items per page */
  pageSize?: number;
}

/**
 * Paginated transaction response
 */
export interface BitcoinTransactionsResponse {
  /** Array of transactions */
  transactions: BitcoinTransaction[];
  /** Token for fetching the next page (null if no more pages) */
  nextPageToken?: string | null;
  /** Total number of transactions (if available) */
  total?: number;
}

/**
 * Request body for broadcasting a transaction
 */
export interface BroadcastTransactionRequest {
  /** Signed transaction hex */
  tx: string;
}

/**
 * Response from broadcasting a transaction
 */
export interface BroadcastTransactionResponse {
  /** Transaction ID of the broadcasted transaction */
  txid: string;
  /** Whether the broadcast was successful */
  success: boolean;
  /** Error message if broadcast failed */
  error?: string;
}

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
