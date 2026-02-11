/**
 * Ethereum NFT Service
 *
 * Provides API-based NFT detection for Ethereum wallets.
 * Uses the Salmon backend which proxies to Alchemy NFT API.
 */

import { get } from '../client';
import type { EthereumNetworkId } from '../../types/blockchain';
import type { EthereumNft } from '../../types/nft';

// Re-export types for backwards compatibility
export type { EthereumNftAttribute, EthereumNft } from '../../types/nft';

/**
 * Response from Salmon API for Ethereum NFTs (same as EthereumNft)
 */
type SalmonEthereumNftResponse = EthereumNft;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all NFTs for an Ethereum wallet
 *
 * Fetches NFTs from the Salmon backend which proxies to Alchemy.
 *
 * @param networkId - Network to query (e.g., 'ethereum', 'ethereum-sepolia')
 * @param address - Wallet address to query
 * @returns Array of Ethereum NFTs
 *
 * @example
 * ```typescript
 * const nfts = await getEthereumNfts('ethereum-mainnet', '0x123...');
 * console.log(nfts.length, 'NFTs found');
 * ```
 */
export async function getEthereumNfts(
  networkId: EthereumNetworkId,
  address: string
): Promise<EthereumNft[]> {
  try {
    const response = await get<SalmonEthereumNftResponse[]>(
      `/v1/${networkId}/nft?owner=${address}`
    );

    // Backend already returns properly formatted data
    return response;
  } catch (error) {
    console.warn('[ethereum-nft] Failed to fetch NFTs:', error);
    return [];
  }
}

/**
 * Get NFT details by contract address and token ID
 *
 * @param networkId - Network to query
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID
 * @returns NFT details or null if not found
 */
export async function getEthereumNftById(
  networkId: EthereumNetworkId,
  contractAddress: string,
  tokenId: string
): Promise<EthereumNft | null> {
  try {
    const response = await get<SalmonEthereumNftResponse>(
      `/v1/${networkId}/nft/${contractAddress}/${tokenId}`
    );

    // Backend already returns properly formatted data
    return response;
  } catch (error) {
    console.warn('[ethereum-nft] Failed to fetch NFT by ID:', error);
    return null;
  }
}

