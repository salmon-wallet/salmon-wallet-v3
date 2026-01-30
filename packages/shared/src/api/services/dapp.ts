/**
 * DApp Service
 * Migrated from salmon-wallet-v2/src/adapter/services/dapp-service.js
 *
 * Provides metadata fetching for decentralized applications (dApps).
 * Used for displaying dApp information during wallet connections and transactions.
 *
 * API Endpoints:
 * - GET /v1/dapp/metadata - Fetch metadata for a dApp by URL
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * DApp metadata response from the backend
 */
export interface DappMetadata {
  /** DApp icon URL (favicon or custom icon) */
  icon?: string;
  /** DApp name or title */
  name?: string;
  /** DApp description */
  description?: string;
  /** DApp URL (canonical) */
  url?: string;
}

/**
 * Parameters for fetching dApp metadata
 */
export interface GetMetadataParams {
  /** The URL of the dApp to fetch metadata for */
  url: string;
}

// ============================================================================
// DApp Service Functions
// ============================================================================

/**
 * Fetch metadata for a decentralized application (dApp)
 *
 * Retrieves icon, name, description, and other metadata for a dApp
 * based on its URL. This is typically used when connecting to a dApp
 * to display information to the user about what they're connecting to.
 *
 * Endpoint: GET /v1/dapp/metadata
 *
 * @param url - The URL of the dApp to fetch metadata for
 * @returns DApp metadata or null if unavailable
 *
 * @example
 * ```typescript
 * const metadata = await getMetadata('https://raydium.io');
 * if (metadata) {
 *   console.log(metadata.name); // "Raydium"
 *   console.log(metadata.icon); // "https://raydium.io/favicon.ico"
 * }
 * ```
 */
export async function getMetadata(url: string): Promise<DappMetadata | null> {
  try {
    const { data } = await apiClient.get<DappMetadata>('/v1/dapp/metadata', {
      params: { url },
    });
    return data;
  } catch (error) {
    console.error(`[DappService] Failed to fetch metadata for ${url}:`, error);
    return null;
  }
}
