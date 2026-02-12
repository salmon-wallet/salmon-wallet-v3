/**
 * Switch Service (Feature Flags)
 * Migrated from salmon-wallet-v2/src/adapter/services/switch-service.js
 *
 * Provides feature flag configuration from the static API.
 * Switches control which features are enabled per network.
 *
 * API Endpoints:
 * - GET /v1/switches - Get all feature switches (static API)
 *
 * Backend returns: Record<networkId, NetworkSwitch>
 */

import { staticApiClient } from '../client';
import type { SwitchesResponse, NetworkSwitch, SwitchMap } from '../../types/settings';

// ============================================================================
// Cache
// ============================================================================

/**
 * Promise-based cache for switches data
 * Cached for the lifetime of the application (until error or manual clear)
 */
let switchesPromise: Promise<SwitchesResponse> | null = null;

// ============================================================================
// Switch Service Functions
// ============================================================================

/**
 * Get all feature switches from the static API
 *
 * Results are cached for the lifetime of the application.
 * On error, the cache is cleared so it can be retried.
 *
 * Endpoint: GET /v1/switches (static API)
 *
 * @returns Promise resolving to switches keyed by network ID
 * @throws ApiError if the request fails
 *
 * @example
 * ```typescript
 * const switches = await getSwitches();
 * const solanaEnabled = switches['solana-mainnet']?.enable ?? false;
 * ```
 */
export async function getSwitches(): Promise<SwitchesResponse> {
  if (switchesPromise) {
    return switchesPromise;
  }

  switchesPromise = staticApiClient
    .get<SwitchesResponse>('/v1/switches')
    .then(({ data }) => data);

  try {
    return await switchesPromise;
  } catch (error) {
    // Clear cache on error so it can be retried
    switchesPromise = null;
    throw error;
  }
}

/**
 * Get switch configuration for a specific network
 *
 * @param networkId - The network identifier to look up (e.g. 'solana-mainnet')
 * @returns The network switch configuration or undefined if not found
 *
 * @example
 * ```typescript
 * const solana = await getSwitch('solana-mainnet');
 * if (solana?.sections.swap.active) {
 *   // Show swap feature
 * }
 * ```
 */
export async function getSwitch(networkId: string): Promise<NetworkSwitch | undefined> {
  const switches = await getSwitches();
  return switches[networkId];
}

/**
 * Check if a specific network is enabled
 *
 * @param networkId - The network identifier to check
 * @param defaultValue - Value to return if switch is not found (default: false)
 * @returns Whether the network is enabled
 *
 * @example
 * ```typescript
 * if (await isNetworkEnabled('solana-mainnet')) {
 *   // Show solana features
 * }
 * ```
 */
export async function isNetworkEnabled(
  networkId: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const switchConfig = await getSwitch(networkId);
  return switchConfig?.enable ?? defaultValue;
}

/**
 * Get all switches as a map of networkId → enabled state for quick lookup
 *
 * @returns Map of network IDs to their enabled state
 *
 * @example
 * ```typescript
 * const switchMap = await getSwitchMap();
 * if (switchMap['solana-mainnet']) {
 *   // Solana mainnet is enabled
 * }
 * ```
 */
export async function getSwitchMap(): Promise<SwitchMap> {
  const switches = await getSwitches();
  const map: SwitchMap = {};
  for (const [networkId, config] of Object.entries(switches)) {
    map[networkId] = config.enable;
  }
  return map;
}

/**
 * Get all enabled network IDs
 *
 * @returns Array of enabled network IDs
 *
 * @example
 * ```typescript
 * const enabledNetworks = await getEnabledNetworks();
 * // ['solana-mainnet', 'bitcoin-mainnet', ...]
 * ```
 */
export async function getEnabledNetworks(): Promise<string[]> {
  const switches = await getSwitches();
  return Object.entries(switches)
    .filter(([, config]) => config.enable)
    .map(([networkId]) => networkId);
}

/**
 * Clear the switches cache to force a refresh on next request
 */
export function clearSwitchesCache(): void {
  switchesPromise = null;
}
