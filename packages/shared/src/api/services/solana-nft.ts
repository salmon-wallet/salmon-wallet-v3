/**
 * Solana NFT API Service
 *
 * Provides API-based NFT fetching for Solana wallets via the Salmon backend.
 */

import { apiClient } from '../client';
import { normalizeIpfsUrl } from '../../utils';
import { nftImageOverrides } from '../../blockchain/solana/nft-image-overrides';
import type { Nft } from '../../types/nft';

// ============================================================================
// Backend response normalization
// ============================================================================

/**
 * The backend resource decorator returns a flat shape that differs from
 * the canonical Nft type used by the frontend (Helius DAS format).
 *
 * Key differences:
 *   - mint: string (backend) vs { address: string } (canonical)
 *   - media: may be absent when json.image is null
 *   - collection: raw json.collection object vs NftCollection
 *   - missing fields: owner, compressed, edition, tokenStandard, etc.
 */
interface BackendNft {
  mint: string;
  owner?: string;
  name?: string;
  symbol?: string;
  uri?: string;
  description?: string;
  media?: string | null;
  collection?: { name?: string; key?: string; verified?: boolean } | null;
  extras?: {
    creators?: Array<{ address: string; share: number; verified: boolean }>;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    properties?: Record<string, unknown>;
  };
  extensions?: Array<{ extension: string; state: Record<string, unknown> }>;
  blacklisted?: boolean;
}

function normalizeBackendNft(raw: BackendNft, owner: string): Nft {
  return {
    mint: { address: raw.mint },
    owner: raw.owner ?? owner,
    name: raw.name ?? '',
    symbol: raw.symbol ?? '',
    uri: raw.uri ?? '',
    json: {},
    updateAuthorityAddress: null,
    sellerFeeBasisPoints: 0,
    collection: raw.collection?.name
      ? {
          key: raw.collection.key ?? '',
          verified: raw.collection.verified ?? false,
          name: raw.collection.name,
        }
      : null,
    edition: null,
    tokenStandard: null,
    media: normalizeIpfsUrl(nftImageOverrides[raw.mint]) ?? normalizeIpfsUrl(raw.media) ?? null,
    description: raw.description ?? '',
    compressed: false,
    extras: {
      attributes: raw.extras?.attributes ?? [],
      properties: raw.extras?.properties ?? {},
      creators: raw.extras?.creators ?? [],
    },
    extensions: raw.extensions ?? [],
    blacklisted: raw.blacklisted,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export async function getSolanaNfts(
  networkId: string,
  publicKey: string,
  noCache: boolean
): Promise<Nft[]> {
  const { data } = await apiClient.get<{ data: BackendNft[] } | BackendNft[]>(
    `/v1/${networkId}/nft`,
    {
      params: { publicKey, noCache },
      timeout: 15000,
    }
  );

  // Backend wraps NFTs in { data: [...], pagination: {...} }
  const raw = Array.isArray(data) ? data : data.data;
  const normalized = raw.map((nft) => normalizeBackendNft(nft, publicKey));
  return normalized.filter((nft) => nft.media);
}

export async function getSolanaNftByAddress(
  networkId: string,
  mintAddress: string
): Promise<Nft | null> {
  const { data } = await apiClient.get<BackendNft>(
    `/v1/${networkId}/nft/${mintAddress}`
  );
  if (!data) return null;
  return normalizeBackendNft(data, '');
}
