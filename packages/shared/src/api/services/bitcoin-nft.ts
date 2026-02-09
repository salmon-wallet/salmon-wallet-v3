/**
 * Bitcoin Ordinals Service
 *
 * Provides API-based Ordinals/Inscriptions detection for Bitcoin wallets.
 * Uses the Salmon backend which proxies to Magic Eden or other Ordinals APIs.
 */

import { get } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Network ID for Bitcoin Ordinals queries
 */
export type BitcoinOrdinalsNetworkId = 'bitcoin-mainnet' | 'bitcoin-testnet';

/**
 * Ordinal attribute from metadata
 */
export interface OrdinalAttribute {
  trait_type: string;
  value: string | number;
}

/**
 * Bitcoin Ordinal/Inscription data structure (matches backend response)
 */
export interface BitcoinOrdinal {
  /** Standard type */
  standard: 'ORDINAL';
  /** Inscription ID */
  inscriptionId: string;
  /** Sequential inscription number */
  inscriptionNumber: number;
  /** Same as inscriptionId, for consistency */
  mint: string;
  /** Owner Bitcoin address */
  owner: string;
  /** Ordinal name */
  name: string;
  /** Description */
  description?: string;
  /** Content MIME type */
  contentType: string;
  /** Content URI */
  uri?: string;
  /** Media/preview image URL */
  media?: string;
  /** Sat rarity (common, uncommon, rare, epic, legendary, mythic) */
  satRarity: string;
  /** Collection info */
  collection?: {
    name: string;
    symbol?: string;
    slug?: string;
  };
  /** Extra metadata */
  extras: {
    /** Ordinal sat number */
    sat?: number;
    /** Genesis transaction ID */
    genesisTransaction?: string;
    /** Genesis block height */
    genesisHeight?: number;
    /** UTXO output */
    output?: string;
    /** Output value in sats */
    outputValue?: number;
    /** Ordinal attributes/traits */
    attributes?: OrdinalAttribute[];
    properties?: {
      inscriptionNumber?: number;
      contentType?: string;
    };
  };
  /** Whether ordinal is blacklisted */
  blacklisted?: boolean;
}

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
  networkId: BitcoinOrdinalsNetworkId,
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
  networkId: BitcoinOrdinalsNetworkId,
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

