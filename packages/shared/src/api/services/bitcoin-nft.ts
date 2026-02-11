/**
 * Bitcoin Ordinals Service
 *
 * Provides API-based Ordinals/Inscriptions detection for Bitcoin wallets.
 * Uses the Salmon backend which proxies to Magic Eden or other Ordinals APIs.
 */

import { get } from '../client';
import type { BitcoinNetworkId } from '../../types/blockchain';
import type { BitcoinOrdinal } from '../../types/nft';

// Re-export types for backwards compatibility
export type { OrdinalAttribute, BitcoinOrdinal } from '../../types/nft';

/**
 * Response from Salmon API for Bitcoin Ordinals (same as BitcoinOrdinal)
 */
type SalmonBitcoinOrdinalResponse = BitcoinOrdinal;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all Ordinals/Inscriptions for a Bitcoin wallet
 *
 * Fetches Ordinals from the Salmon backend which proxies to Magic Eden/Ordinals APIs.
 *
 * @param networkId - Network to query (e.g., 'bitcoin', 'bitcoin-testnet')
 * @param address - Bitcoin wallet address
 * @returns Array of Bitcoin Ordinals
 *
 * @example
 * ```typescript
 * const ordinals = await getBitcoinOrdinals('bitcoin-mainnet', 'bc1p...');
 * console.log(ordinals.length, 'Ordinals found');
 * ```
 */
export async function getBitcoinOrdinals(
  networkId: BitcoinNetworkId,
  address: string
): Promise<BitcoinOrdinal[]> {
  try {
    const response = await get<SalmonBitcoinOrdinalResponse[]>(
      `/v1/${networkId}/nft?owner=${address}`
    );

    // Backend already returns properly formatted data
    return response;
  } catch (error) {
    console.warn('[bitcoin-nft] Failed to fetch Ordinals:', error);
    return [];
  }
}

/**
 * Get Ordinal details by inscription ID
 *
 * @param networkId - Network to query
 * @param inscriptionId - Inscription ID
 * @returns Ordinal details or null if not found
 */
export async function getBitcoinOrdinalById(
  networkId: BitcoinNetworkId,
  inscriptionId: string
): Promise<BitcoinOrdinal | null> {
  try {
    const response = await get<SalmonBitcoinOrdinalResponse>(
      `/v1/${networkId}/nft/${inscriptionId}`
    );

    // Backend already returns properly formatted data
    return response;
  } catch (error) {
    console.warn('[bitcoin-nft] Failed to fetch Ordinal by ID:', error);
    return null;
  }
}

