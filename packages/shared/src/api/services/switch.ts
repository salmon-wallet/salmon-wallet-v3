/**
 * Switch Service (Feature Flags)
 * Migrated from salmon-wallet-v2/src/adapter/services/switch-service.js
 *
 * Provides feature flag configuration from the static API.
 * Switches are used to enable/disable features across the app.
 *
 * API Endpoints:
 * - GET /v1/switches - Get all feature switches (static API)
 */

import { staticApiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Individual feature switch configuration
 */
export interface Switch {
  /** Unique identifier for the switch */
  id: string;
  /** Human-readable name of the feature */
  name: string;
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Optional description of the feature */
  description?: string;
  /** Optional metadata for the switch */
  metadata?: Record<string, unknown>;
}

/**
 * Response from the switches API endpoint
 */
export interface SwitchesResponse {
  /** Array of feature switches */
  switches: Switch[];
}

/**
 * Map of switch IDs to their enabled state for quick lookup
 */
export type SwitchMap = Record<string, boolean>;

// ============================================================================
// Cache
// ============================================================================

/**
 * Promise-based cache for switches data
 * Cached for the lifetime of the application (until error or manual clear)
 */
let switchesPromise: Promise<Switch[]> | null = null;

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
 * @returns Promise resolving to array of switches
 * @throws ApiError if the request fails
 *
 * @example
 * ```typescript
 * const switches = await getSwitches();
 * const buyEnabled = switches.find(s => s.id === 'buy')?.enabled ?? false;
 * ```
 */
export async function getSwitches(): Promise<Switch[]> {
  if (switchesPromise) {
    return switchesPromise;
  }

  switchesPromise = staticApiClient
    .get<Switch[]>('/v1/switches')
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
 * Get a specific switch by ID
 *
 * @param id - The switch identifier to look up
 * @returns The switch configuration or undefined if not found
 *
 * @example
 * ```typescript
 * const buySwitch = await getSwitch('buy');
 * if (buySwitch?.enabled) {
 *   // Show buy feature
 * }
 * ```
 */
export async function getSwitch(id: string): Promise<Switch | undefined> {
  const switches = await getSwitches();
  return switches.find((s) => s.id === id);
}

/**
 * Check if a specific feature is enabled
 *
 * @param id - The switch identifier to check
 * @param defaultValue - Value to return if switch is not found (default: false)
 * @returns Whether the feature is enabled
 *
 * @example
 * ```typescript
 * if (await isSwitchEnabled('buy')) {
 *   // Show buy button
 * }
 * ```
 */
export async function isSwitchEnabled(
  id: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const switchConfig = await getSwitch(id);
  return switchConfig?.enabled ?? defaultValue;
}

/**
 * Get all switches as a map for quick lookup
 *
 * @returns Map of switch IDs to their enabled state
 *
 * @example
 * ```typescript
 * const switchMap = await getSwitchMap();
 * if (switchMap['buy']) {
 *   // Buy is enabled
 * }
 * ```
 */
export async function getSwitchMap(): Promise<SwitchMap> {
  const switches = await getSwitches();
  return switches.reduce<SwitchMap>((map, s) => {
    map[s.id] = s.enabled;
    return map;
  }, {});
}

/**
 * Get all enabled switch IDs
 *
 * @returns Array of enabled switch IDs
 *
 * @example
 * ```typescript
 * const enabledFeatures = await getEnabledSwitches();
 * // ['buy', 'swap', 'stake']
 * ```
 */
export async function getEnabledSwitches(): Promise<string[]> {
  const switches = await getSwitches();
  return switches.filter((s) => s.enabled).map((s) => s.id);
}

/**
 * Clear the switches cache to force a refresh on next request
 *
 * @example
 * ```typescript
 * // Force refresh switches after app foreground
 * clearSwitchesCache();
 * const freshSwitches = await getSwitches();
 * ```
 */
export function clearSwitchesCache(): void {
  switchesPromise = null;
}
