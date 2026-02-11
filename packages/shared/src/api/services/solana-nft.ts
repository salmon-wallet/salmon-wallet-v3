/**
 * Solana NFT API Service
 *
 * Provides API-based NFT fetching for Solana wallets via the Salmon backend.
 */

import { apiClient } from '../client';
import type { Nft } from '../../types/nft';

// ============================================================================
// API Functions
// ============================================================================

export async function getSolanaNfts(
  networkId: string,
  publicKey: string,
  noCache: boolean
): Promise<Nft[]> {
  const { data } = await apiClient.get<Nft[]>(`/v1/${networkId}/nft`, {
    params: { publicKey, noCache },
    timeout: 15000,
  });

  return data;
}

export async function getSolanaNftByAddress(
  networkId: string,
  mintAddress: string
): Promise<Nft | null> {
  const { data } = await apiClient.get<Nft>(
    `/v1/${networkId}/nft/${mintAddress}`
  );
  return data ?? null;
}
