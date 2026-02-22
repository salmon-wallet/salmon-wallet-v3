/**
 * Multi-chain Transaction Service
 * Fetches transaction history for Bitcoin and Ethereum via Ubiquity API
 *
 * API Endpoints:
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 *
 * Note: Solana transactions are handled separately in solana.ts
 */

import { apiClient, ApiError } from '../client';
import type {
  TransactionPagingParams,
  TransactionsResponse,
} from '../../types/transaction';
import type { NetworkId } from '../../types/blockchain';

// Re-export types for backwards compatibility
export type {
  TransactionItem,
  TransactionPagingParams,
  TransactionsResponse,
} from '../../types/transaction';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated transactions for an address on any supported blockchain
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Network identifier (bitcoin-mainnet, ethereum-mainnet, etc.)
 * @param address - Wallet address
 * @param options - Optional pagination parameters
 * @returns Paginated transaction response
 */
export async function getTransactions(
  networkId: NetworkId,
  address: string,
  options?: TransactionPagingParams
): Promise<TransactionsResponse> {
  try {
    const params: Record<string, string | number> = {};

    if (options?.pageSize) {
      params.pageSize = options.pageSize;
    }
    if (options?.pageToken) {
      params.pageToken = options.pageToken;
    }

    // Backend returns { data: TransactionItem[], pageToken?: string }
    const { data: response } = await apiClient.get<TransactionsResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { params }
    );

    return {
      data: response.data || [],
      pageToken: response.pageToken,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return { data: [] };
    }
    console.error('[TransactionService] Failed to get transactions:', error);
    throw error;
  }
}
