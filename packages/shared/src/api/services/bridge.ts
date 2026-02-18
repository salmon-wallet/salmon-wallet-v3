/**
 * Bridge Service
 * Migrated from salmon-wallet-v2/src/adapter/services/bridge-service.js
 *
 * Provides cross-chain bridge functionality for token swaps between networks.
 *
 * API Endpoints:
 * - GET /v1/bridge/supported - Get supported tokens for bridging
 * - GET /v1/bridge/available - Get available tokens to bridge to from a given symbol
 * - GET /v1/bridge/featured - Get featured/popular bridge pairs for a token
 * - GET /v1/bridge/estimate - Get estimated output amount for a bridge swap
 * - GET /v1/bridge/minimal - Get minimum amount required for a bridge swap
 * - GET /v1/bridge/exchange - Create a new bridge exchange transaction
 * - GET /v1/bridge/transaction - Get the status of a bridge transaction
 */

import { apiClient } from '../client';
import type {
  BridgeToken,
  BridgeAvailableToken,
  BridgeFeaturedToken,
  BridgeEstimateResponse,
  BridgeMinimalResponse,
  BridgeExchange,
  BridgeTransaction,
} from '../../types/bridge';

// ============================================================================
// Bridge Service Functions
// ============================================================================

/**
 * Get all supported tokens for bridging on a network
 *
 * Endpoint: GET /v1/bridge/supported
 *
 * @param network - Network identifier (e.g., 'solana', 'ethereum')
 * @returns Array of supported bridge tokens or null if unavailable
 */
export async function getBridgeSupportedTokens(
  network: string
): Promise<BridgeToken[] | null> {
  try {
    const { data } = await apiClient.get<BridgeToken[]>('/v1/bridge/supported', {
      params: { network },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch supported tokens:', error);
    throw new Error(`Bridge fetch supported tokens failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get available tokens that can be received when bridging from a specific token
 *
 * Endpoint: GET /v1/bridge/available
 *
 * @param symbol - Source token symbol (e.g., 'SOL', 'BTC')
 * @returns Array of available tokens to bridge to or null if unavailable
 */
export async function getBridgeAvailableTokens(
  symbol: string
): Promise<BridgeAvailableToken[] | null> {
  try {
    const { data } = await apiClient.get<BridgeAvailableToken[]>('/v1/bridge/available', {
      params: { symbol: symbol.toLowerCase() },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch available tokens:', error);
    throw new Error(`Bridge fetch available tokens failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get featured/popular bridge pairs for a specific token
 *
 * Endpoint: GET /v1/bridge/featured
 *
 * @param symbol - Token symbol to get featured pairs for
 * @returns Array of featured tokens or null if unavailable
 */
export async function getBridgeFeaturedTokens(
  symbol: string
): Promise<BridgeFeaturedToken[] | null> {
  try {
    const { data } = await apiClient.get<BridgeFeaturedToken[]>('/v1/bridge/featured', {
      params: { symbol: symbol.toLowerCase() },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch featured tokens:', error);
    throw new Error(`Bridge fetch featured tokens failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get estimated output amount for a bridge swap
 *
 * Endpoint: GET /v1/bridge/estimate
 *
 * @param symbolIn - Input token symbol
 * @param symbolOut - Output token symbol
 * @param amount - Input amount to swap
 * @returns Estimated output amount or null if unavailable
 */
export async function getBridgeEstimatedAmount(
  symbolIn: string,
  symbolOut: string,
  amount: number
): Promise<number | null> {
  try {
    const { data } = await apiClient.get<BridgeEstimateResponse>('/v1/bridge/estimate', {
      params: { symbolIn: symbolIn.toLowerCase(), symbolOut: symbolOut.toLowerCase(), amount },
    });
    return data?.estimated_amount ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch estimated amount:', error);
    throw new Error(`Bridge fetch estimated amount failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get minimum amount required for a bridge swap
 *
 * Endpoint: GET /v1/bridge/minimal
 *
 * @param symbolIn - Input token symbol
 * @param symbolOut - Output token symbol
 * @returns Minimum required input amount or null if unavailable
 */
export async function getBridgeMinimalAmount(
  symbolIn: string,
  symbolOut: string
): Promise<number | null> {
  try {
    const { data } = await apiClient.get<BridgeMinimalResponse>('/v1/bridge/minimal', {
      params: { symbolIn: symbolIn.toLowerCase(), symbolOut: symbolOut.toLowerCase() },
    });
    return data?.min_amount ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch minimal amount:', error);
    throw new Error(`Bridge fetch minimal amount failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Create a new bridge exchange transaction
 *
 * Endpoint: GET /v1/bridge/exchange
 *
 * @param symbolIn - Input token symbol
 * @param symbolOut - Output token symbol
 * @param amount - Amount to exchange
 * @param addressTo - Destination address to receive the output tokens
 * @returns Bridge exchange details or null if creation failed
 */
export async function createBridgeExchange(
  symbolIn: string,
  symbolOut: string,
  amount: number,
  addressTo: string
): Promise<BridgeExchange | null> {
  try {
    const { data } = await apiClient.get<BridgeExchange>('/v1/bridge/exchange', {
      params: { symbolIn: symbolIn.toLowerCase(), symbolOut: symbolOut.toLowerCase(), amount, addressTo },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to create bridge exchange:', error);
    throw new Error(`Bridge create exchange failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get the status of a bridge transaction
 *
 * Endpoint: GET /v1/bridge/transaction
 *
 * @param id - Bridge transaction ID
 * @returns Bridge transaction details or null if not found
 */
export async function getBridgeTransaction(
  id: string
): Promise<BridgeTransaction | null> {
  try {
    const { data } = await apiClient.get<BridgeTransaction>('/v1/bridge/transaction', {
      params: { id },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch bridge transaction:', error);
    throw new Error(`Bridge fetch transaction failed: ${error instanceof Error ? error.message : error}`);
  }
}
