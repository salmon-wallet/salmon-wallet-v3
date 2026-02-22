/**
 * Solana API Service
 * Handles all backend communication for Solana-specific operations.
 *
 * API Endpoints:
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 * - GET /v1/{networkId}/account/{address}/transactions/{txId} - Get single transaction
 * - GET /v1/{networkId}/ft/swap/order - Get swap quote
 * - POST /v1/{networkId}/ft/swap/execute - Execute swap
 *
 * Note: Token list endpoints (verified, top, batch, search) are in tokens.ts
 */

import { get, apiClient, ApiError } from '../client';
import { removeDecimals } from '../../utils/decimals';
import type { SolanaNetworkId } from '../../types/blockchain';
import type {
  SolanaTransaction,
  SolanaTransactionType,
  SolanaPagingParams,
  SolanaTransactionsResponse,
} from '../../types/transaction';

// Re-export types for backwards compatibility
export type {
  SolanaTokenTransfer,
  SolanaNativeTransfer,
  SolanaAccountData,
  SolanaInstruction,
  SolanaTransactionStatus,
  SolanaTransactionType,
  SolanaTransaction,
  SolanaPagingParams,
  SolanaTransactionsResponse,
} from '../../types/transaction';

import type {
  SwapOrderResponse,
  SwapOrderParams,
  SwapExecuteRequest,
  ApiSwapExecuteResponse,
} from '../../types/swap';

// ============================================================================
// API Functions - Transactions
// ============================================================================

/**
 * Get paginated transactions for an address
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param paging - Optional pagination parameters
 * @returns Paginated transaction response
 */
export async function getSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  paging?: SolanaPagingParams
): Promise<SolanaTransactionsResponse> {
  try {
    const params: Record<string, string | number> = {};

    // Use pageToken/pageSize (new) or before/limit (legacy)
    const pageToken = paging?.pageToken || paging?.before;
    const pageSize = paging?.pageSize || paging?.limit;

    if (pageToken) {
      params.pageToken = pageToken;
    }
    if (pageSize) {
      params.pageSize = pageSize;
    }
    if (paging?.type) {
      params.type = paging.type;
    }

    // Backend returns { data: Transaction[], meta: { nextPageToken?: string } }
    interface BackendResponse {
      data: SolanaTransaction[];
      meta?: { nextPageToken?: string };
    }

    const { data: response } = await apiClient.get<BackendResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { params }
    );

    const transactions = response.data || [];
    const nextPageToken = response.meta?.nextPageToken;

    return {
      transactions,
      oldestSignature: nextPageToken || null,
      hasMore: !!nextPageToken,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return { transactions: [], oldestSignature: null, hasMore: false };
    }
    console.error('[SolanaService] Failed to get transactions:', error);
    throw error;
  }
}

/**
 * Get a single transaction by signature
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions/{txId}
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param signature - Transaction signature
 * @returns Transaction data, or null if not found
 */
export async function getSolanaTransaction(
  networkId: SolanaNetworkId,
  address: string,
  signature: string
): Promise<SolanaTransaction | null> {
  try {
    const { data } = await apiClient.get<SolanaTransaction>(
      `/v1/${networkId}/account/${address}/transactions/${signature}`
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[SolanaService] Failed to get transaction:', error);
    throw error;
  }
}

// ============================================================================
// API Functions - Swap
// ============================================================================

/**
 * Get a swap quote/order
 *
 * Endpoint: GET /v1/{networkId}/ft/swap/order
 *
 * This endpoint returns a quote and a serialized transaction ready to be signed.
 * The transaction is valid for a limited time (check expiresAt).
 *
 * @param networkId - Solana network identifier
 * @param params - Swap parameters
 * @returns Swap order with route info and unsigned transaction
 */
export async function getSwapOrder(
  networkId: SolanaNetworkId,
  params: SwapOrderParams
): Promise<SwapOrderResponse | null> {
  try {
    const queryParams: Record<string, string | number | boolean> = {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      publicKey: params.publicKey,
    };

    if (params.slippageBps !== undefined) {
      queryParams.slippageBps = params.slippageBps;
    }
    if (params.swapMode) {
      queryParams.swapMode = params.swapMode;
    }
    if (params.dynamicSlippage !== undefined) {
      queryParams.dynamicSlippage = params.dynamicSlippage;
    }
    if (params.priorityLevel) {
      queryParams.priorityLevel = params.priorityLevel;
    }

    const { data } = await apiClient.get<SwapOrderResponse>(
      `/v1/${networkId}/ft/swap/order`,
      { params: queryParams }
    );

    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[SolanaService] Failed to get swap order:', error);
    throw error;
  }
}

/**
 * Execute a signed swap transaction via API
 *
 * Endpoint: POST /v1/{networkId}/ft/swap/execute
 *
 * After signing the transaction from getSwapOrder(), submit it here for execution.
 * The backend handles transaction submission and confirmation.
 *
 * @param networkId - Solana network identifier
 * @param signedTransaction - Base64 encoded signed transaction
 * @param requestId - Request ID from the swap order response
 * @returns Execution result with signature
 */
export async function executeSwapApi(
  networkId: SolanaNetworkId,
  signedTransaction: string,
  requestId: string
): Promise<ApiSwapExecuteResponse> {
  try {
    const { data } = await apiClient.post<ApiSwapExecuteResponse>(
      `/v1/${networkId}/ft/swap/execute`,
      {
        signedTransaction,
        requestId,
      } as SwapExecuteRequest
    );

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[SolanaService] Failed to execute swap:', error.message);
      return {
        signature: '',
        status: 'Failed',
        error: error.message,
      };
    }
    console.error('[SolanaService] Failed to execute swap:', error);
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get all transactions for an address (handles pagination automatically)
 *
 * Warning: This can make multiple API calls. Use with caution for addresses
 * with many transactions. Consider using getSolanaTransactions with manual
 * pagination for better control.
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param maxTransactions - Maximum number of transactions to fetch (default: 100)
 * @returns Array of all transactions up to the limit
 */
export async function getAllSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  maxTransactions: number = 100
): Promise<SolanaTransaction[]> {
  const allTransactions: SolanaTransaction[] = [];
  let before: string | undefined;
  let hasMore = true;

  while (hasMore && allTransactions.length < maxTransactions) {
    const remaining = maxTransactions - allTransactions.length;
    const limit = Math.min(remaining, 100);

    const response = await getSolanaTransactions(networkId, address, {
      before,
      limit,
    });

    allTransactions.push(...response.transactions);
    hasMore = response.hasMore;
    before = response.oldestSignature ?? undefined;

    // Safety check to prevent infinite loops
    if (response.transactions.length === 0) {
      break;
    }
  }

  return allTransactions;
}

/**
 * Get recent transactions via API (last N transactions)
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param count - Number of recent transactions to fetch (default: 10, max: 100)
 * @returns Array of recent transactions
 */
export async function getRecentSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  count: number = 10
): Promise<SolanaTransaction[]> {
  const response = await getSolanaTransactions(networkId, address, {
    limit: Math.min(count, 100),
  });
  return response.transactions;
}

/**
 * Get transactions filtered by type
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param type - Transaction type to filter by
 * @param limit - Maximum number of transactions (default: 20)
 * @returns Array of transactions of the specified type
 */
export async function getTransactionsByType(
  networkId: SolanaNetworkId,
  address: string,
  type: SolanaTransactionType,
  limit: number = 20
): Promise<SolanaTransaction[]> {
  const response = await getSolanaTransactions(networkId, address, {
    type,
    limit,
  });
  return response.transactions;
}

// ============================================================================
// DI adapter (matches BitcoinAccount pattern in bitcoin.ts)
// ============================================================================

import { getJupiterPrices } from './balance';
import { getTokenMetadataByMints } from './tokens';
import type { SolanaAccountApiFunctions, SolanaBalanceItem } from '../../types/transfer';

export const fetchSolanaAccountBalance: SolanaAccountApiFunctions['fetchBalance'] = async (
  networkId,
  address
) => {
  const data = await get<SolanaBalanceItem[]>(
    `/v1/${networkId}/account/${address}/balance`,
    { params: { include: 'logo' } },
  );

  // Extract mint addresses from non-native tokens for metadata enrichment
  const mintAddresses = data
    .filter((token) => token.mint && token.mint !== 'solana')
    .map((token) => token.mint!);

  // Fetch Jupiter V2 metadata for better logos, names, symbols
  const metadata = mintAddresses.length > 0
    ? await getTokenMetadataByMints(mintAddresses, networkId)
    : [];

  // Create metadata lookup map
  const metadataMap = new Map(
    metadata.map((m) => [m.address.toLowerCase(), m])
  );

  return data.map((token) => {
    const meta = token.mint ? metadataMap.get(token.mint.toLowerCase()) : undefined;
    return {
      ...token,
      // Jupiter metadata wins over Ubiquity when available
      logo: meta?.logo || token.logo,
      name: meta?.name || token.name,
      symbol: meta?.symbol || token.symbol,
      uiAmount: removeDecimals(token.amount, token.decimals),
    };
  });
};

/**
 * Pre-wired API functions for SolanaAccount dependency injection.
 * Pass this to factory functions so SolanaAccount can call the API
 * without importing this module directly.
 */
export const solanaApiFunctions: SolanaAccountApiFunctions = {
  fetchBalance: fetchSolanaAccountBalance,
  fetchPrices: async (networkId, addresses) => {
    return getJupiterPrices(addresses, networkId);
  },
  fetchTransaction: getSolanaTransaction,
  fetchTransactions: getSolanaTransactions,
};
