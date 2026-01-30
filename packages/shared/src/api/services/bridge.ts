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

// ============================================================================
// Types
// ============================================================================

/**
 * Supported bridge token information
 */
export interface BridgeToken {
  /** Token symbol (e.g., 'BTC', 'ETH', 'SOL') */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain the token is on */
  network?: string;
  /** Token logo URL */
  image?: string;
  /** Whether the token is enabled for bridging */
  enabled?: boolean;
  /** Minimum amount for bridging */
  minAmount?: number;
  /** Maximum amount for bridging */
  maxAmount?: number;
}

/**
 * Available token for bridging to/from a specific token
 */
export interface BridgeAvailableToken {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain identifier */
  network?: string;
  /** Token logo URL */
  image?: string;
  /** Whether this pair is currently available */
  available?: boolean;
}

/**
 * Featured bridge token pair
 */
export interface BridgeFeaturedToken {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain identifier */
  network?: string;
  /** Token logo URL */
  image?: string;
  /** Popularity rank */
  rank?: number;
}

/**
 * Estimated amount response from bridge
 */
export interface BridgeEstimateResponse {
  /** Estimated output amount */
  estimated_amount: number;
  /** Input symbol */
  from?: string;
  /** Output symbol */
  to?: string;
  /** Exchange rate */
  rate?: number;
}

/**
 * Minimal amount response from bridge
 */
export interface BridgeMinimalResponse {
  /** Minimum required input amount */
  min_amount: number;
  /** Input symbol */
  from?: string;
  /** Output symbol */
  to?: string;
}

/**
 * Bridge exchange creation response
 */
export interface BridgeExchange {
  /** Unique exchange ID */
  id: string;
  /** Input token symbol */
  currencyFrom: string;
  /** Output token symbol */
  currencyTo: string;
  /** Input amount */
  amountExpectedFrom: number;
  /** Expected output amount */
  amountExpectedTo: number;
  /** Deposit address to send tokens to */
  payinAddress: string;
  /** Extra ID for deposit (memo/tag) if required */
  payinExtraId?: string;
  /** Address where output tokens will be sent */
  payoutAddress: string;
  /** Extra ID for payout if required */
  payoutExtraId?: string;
  /** Exchange status */
  status: string;
  /** Creation timestamp */
  createdAt?: string;
}

/**
 * Bridge transaction status response
 */
export interface BridgeTransaction {
  /** Unique transaction ID */
  id: string;
  /** Input token symbol */
  currencyFrom: string;
  /** Output token symbol */
  currencyTo: string;
  /** Network fee */
  networkFee?: number;
  /** Input amount expected */
  amountExpectedFrom?: number;
  /** Output amount expected */
  amountExpectedTo?: number;
  /** Actual input amount received */
  amountFrom?: number;
  /** Actual output amount sent */
  amountTo?: number;
  /** Deposit address */
  payinAddress: string;
  /** Deposit extra ID (memo/tag) */
  payinExtraId?: string;
  /** Deposit transaction hash */
  payinHash?: string;
  /** Payout address */
  payoutAddress: string;
  /** Payout extra ID */
  payoutExtraId?: string;
  /** Payout transaction hash */
  payoutHash?: string;
  /** Current transaction status */
  status: BridgeTransactionStatus;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Possible bridge transaction statuses
 */
export type BridgeTransactionStatus =
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'overdue'
  | 'hold';

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
    return null;
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
      params: { symbol },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch available tokens:', error);
    return null;
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
      params: { symbol },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch featured tokens:', error);
    return null;
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
      params: { symbolIn, symbolOut, amount },
    });
    return data?.estimated_amount ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch estimated amount:', error);
    return null;
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
      params: { symbolIn, symbolOut },
    });
    return data?.min_amount ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to fetch minimal amount:', error);
    return null;
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
      params: { symbolIn, symbolOut, amount, addressTo },
    });
    return data ?? null;
  } catch (error) {
    console.error('[BridgeService] Failed to create bridge exchange:', error);
    return null;
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
    return null;
  }
}
