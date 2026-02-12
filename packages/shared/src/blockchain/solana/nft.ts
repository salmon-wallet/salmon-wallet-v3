/**
 * Solana NFT Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-nft-service.js
 *
 * Provides NFT fetching functionality with multi-tier fallback:
 * 1. Helius DAS API (direct, primary)
 * 2. Backend API (fallback)
 *
 * Features:
 * - NFT fetching with pagination
 * - NFT metadata parsing and normalization
 * - Burnt NFT filtering
 * - Token2022 extensions enrichment
 * - Collection grouping
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { normalizeIpfsUrl } from '../../utils';
import { nftImageOverrides } from './nft-image-overrides';
import type { SolanaNetwork } from './SolanaAccount';
import type {
  Nft,
  NftMint,
  NftCollection,
  NftEdition,
  NftCreator,
  NftAttribute,
  NftExtras,
  Token2022Extension,
  NftPagination,
  NftPaginatedResponse,
  NftCollectionGroup,
  FetchNftsFromBackendFn,
  FetchNftByAddressFn,
  GetNftsOptions,
} from '../../types/nft';

// ============================================================================
// Helius API Configuration
// ============================================================================

/**
 * Get Helius API key from environment variables
 * Supports both Expo (EXPO_PUBLIC_*) and Vite (VITE_*) formats
 */
function getHeliusApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.EXPO_PUBLIC_HELIUS_API_KEY ||
      process.env.VITE_HELIUS_API_KEY ||
      process.env.HELIUS_API_KEY
    );
  }
  return undefined;
}

/**
 * Get Helius RPC URL for a given network
 * Returns the Helius DAS API endpoint if API key is configured
 *
 * @param networkId - The network ID (solana-mainnet, solana-devnet, etc.)
 * @returns The Helius RPC URL or null if not configured
 */
function getHeliusRpcUrl(networkId: string): string | null {
  const apiKey = getHeliusApiKey();
  if (!apiKey) {
    console.warn('[NFT Service] HELIUS_API_KEY not configured - NFT fetching may fail');
    return null;
  }

  // Map network IDs to Helius endpoints
  const heliusEndpoints: Record<string, string> = {
    'solana-mainnet': `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    'solana-devnet': `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };

  return heliusEndpoints[networkId] || null;
}

// ============================================================================
// Helius DAS API Types (internal)
// ============================================================================

/**
 * Helius DAS API asset structure (internal)
 */
interface HeliusDasAsset {
  id: string;
  burnt?: boolean;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      image?: string;
      attributes?: NftAttribute[];
      properties?: Record<string, unknown>;
    };
    links?: {
      image?: string;
    };
    files?: Array<{
      uri?: string;
      type?: string;
    }>;
    json_uri?: string;
  };
  authorities?: Array<{
    address: string;
    scopes?: string[];
  }>;
  royalty?: {
    basis_points?: number;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  supply?: {
    edition_nonce?: number;
  };
  interface?: string;
  compression?: {
    compressed?: boolean;
  };
  creators?: NftCreator[];
}

/**
 * Helius DAS API response structure (internal)
 */
interface HeliusDasResponse {
  jsonrpc: string;
  id: string;
  result?: {
    items?: HeliusDasAsset[];
    total?: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms Helius DAS API asset to the normalized NFT format
 * @param asset - The Helius DAS API asset
 * @param owner - The owner's public key
 * @returns Transformed NFT object
 */
function transformDasAsset(asset: HeliusDasAsset, owner: string): Nft {
  const metadata = asset.content?.metadata || {};
  const links = asset.content?.links || {};
  const files = asset.content?.files || [];
  const collection = asset.grouping?.find((g) => g.group_key === 'collection');

  return {
    mint: { address: asset.id },
    owner,
    name: metadata.name || '',
    symbol: metadata.symbol || '',
    uri: normalizeIpfsUrl(asset.content?.json_uri) || '',
    json: metadata as Record<string, unknown>,
    updateAuthorityAddress:
      asset.authorities?.find((a) => a.scopes?.includes('full'))?.address || null,
    sellerFeeBasisPoints: asset.royalty?.basis_points || 0,
    collection: collection
      ? { key: collection.group_value, verified: true }
      : null,
    edition:
      asset.supply?.edition_nonce != null
        ? { isOriginal: asset.supply.edition_nonce === 0 }
        : null,
    tokenStandard: asset.interface || null,
    media:
      normalizeIpfsUrl(nftImageOverrides[asset.id]) ||
      normalizeIpfsUrl(metadata.image) ||
      normalizeIpfsUrl(links.image) ||
      normalizeIpfsUrl(files[0]?.uri) ||
      null,
    description: metadata.description || '',
    compressed: asset.compression?.compressed || false,
    extras: {
      attributes: metadata.attributes || [],
      properties: metadata.properties || {},
      creators: asset.creators || [],
    },
    extensions: [],
  };
}

/**
 * Fetches Token2022 extensions for enrichment
 * @param connection - Solana connection
 * @param publicKey - Owner public key
 * @returns Map of mint address to extensions
 */
async function fetchToken2022Extensions(
  connection: Connection,
  publicKey: string
): Promise<Map<string, Token2022Extension[]>> {
  const extensionsMap = new Map<string, Token2022Extension[]>();

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(publicKey),
      { programId: TOKEN_2022_PROGRAM_ID }
    );

    for (const account of tokenAccounts.value || []) {
      const tokenInfo = account.account.data.parsed?.info;
      if (tokenInfo?.mint && tokenInfo?.extensions) {
        extensionsMap.set(tokenInfo.mint, tokenInfo.extensions);
      }
    }

    console.log(
      `[NFT Service] Fetched Token2022 extensions for ${extensionsMap.size} tokens`
    );
  } catch (err) {
    console.warn(
      '[NFT Service] Failed to fetch Token2022 extensions:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }

  return extensionsMap;
}

// ============================================================================
// Primary Functions - Helius DAS API
// ============================================================================

/**
 * Fetches NFTs directly from Helius DAS API
 * This is the primary method - used when the Helius endpoint is available
 *
 * @param network - The network configuration object
 * @param publicKey - The owner's public key
 * @param options - Pagination options (limit, offset)
 * @returns NFTs with pagination info
 */
export async function getAllFromHeliusDirect(
  network: SolanaNetwork,
  publicKey: string,
  options: GetNftsOptions = {}
): Promise<NftPaginatedResponse> {
  const { nodeUrl } = network.config;

  // Get Helius RPC URL for DAS API calls
  const heliusUrl = getHeliusRpcUrl(network.id);
  if (!heliusUrl) {
    throw new Error('Helius API key not configured. Set EXPO_PUBLIC_HELIUS_API_KEY in your .env file.');
  }

  const limit = Math.min(Math.max(1, options.limit ?? 50), 100);
  const offset = Math.max(0, options.offset ?? 0);

  console.log(
    `[NFT Service] Fetching NFTs directly from Helius for: ${publicKey} (limit: ${limit}, offset: ${offset})`
  );

  const response = await axios.post<HeliusDasResponse>(
    heliusUrl,
    {
      jsonrpc: '2.0',
      id: 'get-nfts-by-owner',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: publicKey,
        page: 1,
        limit: 1000, // Fetch all NFTs, then paginate locally
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  if (response.data.error) {
    throw new Error(`Helius DAS API error: ${response.data.error.message}`);
  }

  const assets = response.data.result?.items || [];
  console.log(
    `[NFT Service] Helius DAS API returned ${assets.length} assets for: ${publicKey}`
  );

  // Filter out burnt NFTs
  const filteredAssets = assets.filter((asset) => !asset.burnt);
  console.log(
    `[NFT Service] Filtered out ${assets.length - filteredAssets.length} burnt NFTs`
  );

  // Fetch Token2022 extensions for enrichment
  const connection = new Connection(nodeUrl);
  const extensionsMap = await fetchToken2022Extensions(connection, publicKey);

  // Transform assets to NFTs
  const allNfts = filteredAssets.map((asset) => {
    const nft = transformDasAsset(asset, publicKey);
    // Enrich with Token2022 extensions if available
    nft.extensions = extensionsMap.get(asset.id) || [];
    return nft;
  });

  const total = allNfts.length;
  const paginatedNfts = allNfts.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    data: paginatedNfts,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    },
  };
}

// ============================================================================
// Fallback Functions - Backend API
// ============================================================================

async function getAllFromBackend(
  network: SolanaNetwork,
  publicKey: string,
  noCache: boolean,
  fetchNftsFromBackend: FetchNftsFromBackendFn
): Promise<Nft[]> {
  console.log(
    `[NFT Service] Fetching NFTs from backend for: ${publicKey} (noCache: ${noCache})`
  );

  return fetchNftsFromBackend(network.id, publicKey, noCache);
}

// ============================================================================
// Main Public Functions
// ============================================================================

/**
 * Fetches all NFTs for a given public key
 * Tries direct Helius API first, falls back to backend endpoint if it fails
 *
 * @param network - The network configuration object
 * @param publicKey - The owner's public key
 * @param noCache - Whether to bypass cache (only affects backend fallback)
 * @returns Array of NFTs
 *
 * @example
 * ```typescript
 * const nfts = await getAll(network, 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');
 * console.log(`Found ${nfts.length} NFTs`);
 * ```
 */
export async function getAll(
  network: SolanaNetwork,
  publicKey: string,
  noCache = false,
  fetchNftsFromBackend: FetchNftsFromBackendFn = () => Promise.resolve([])
): Promise<Nft[]> {
  // PRIMARY: Try direct Helius API first
  try {
    const result = await getAllFromHeliusDirect(network, publicKey);
    return result.data;
  } catch (heliusError) {
    console.warn(
      `[NFT Service] Direct Helius API call failed (${heliusError instanceof Error ? heliusError.message : 'Unknown error'}), falling back to backend endpoint`
    );

    // FALLBACK: Try backend endpoint if Helius fails
    try {
      return await getAllFromBackend(network, publicKey, noCache, fetchNftsFromBackend);
    } catch (backendError) {
      console.error(
        `[NFT Service] Both direct Helius API and backend endpoint failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`
      );
      throw backendError;
    }
  }
}

/**
 * Fetches all NFTs with pagination support
 * Uses direct Helius API only (no fallback for paginated requests)
 *
 * @param network - The network configuration object
 * @param publicKey - The owner's public key
 * @param options - Pagination options
 * @returns Paginated NFT response
 *
 * @example
 * ```typescript
 * // First page
 * const page1 = await getAllPaginated(network, publicKey, { limit: 20 });
 *
 * // Next page
 * if (page1.pagination.hasMore) {
 *   const page2 = await getAllPaginated(network, publicKey, {
 *     limit: 20,
 *     offset: page1.pagination.nextOffset!
 *   });
 * }
 * ```
 */
export async function getAllPaginated(
  network: SolanaNetwork,
  publicKey: string,
  options: GetNftsOptions = {}
): Promise<NftPaginatedResponse> {
  return getAllFromHeliusDirect(network, publicKey, options);
}

// ============================================================================
// Collection Grouping Functions
// ============================================================================

/**
 * Gets unique collection names from NFTs
 * @param nfts - Array of NFTs
 * @returns Array of unique collection names
 */
export function getCollections(nfts: Nft[]): string[] {
  const collections = nfts
    .map((nft) => nft.collection?.name)
    .filter((name): name is string => !!name);
  return Array.from(new Set(collections));
}

/**
 * Groups NFTs by collection
 * @param nfts - Array of NFTs
 * @returns Array of collection groups sorted by size (largest first)
 */
export function getNftsByCollection(nfts: Nft[]): NftCollectionGroup[] {
  const collections = getCollections(nfts);
  return collections
    .map((collection) => {
      const items = nfts.filter((nft) => nft.collection?.name === collection);
      return {
        collection,
        length: items.length,
        items,
        thumb: items[0]?.media || null,
      };
    })
    .sort((a, b) => b.length - a.length);
}

/**
 * Gets NFTs that don't belong to any collection
 * @param nfts - Array of NFTs
 * @returns Array of NFTs without a collection
 */
export function getNftsWithoutCollection(nfts: Nft[]): Nft[] {
  return nfts.filter((nft) => !nft.collection?.name);
}

/**
 * Fetches all NFTs grouped by collection
 *
 * @param network - The network configuration object
 * @param owner - The owner's public key
 * @returns Array containing collection groups and standalone NFTs
 *
 * @example
 * ```typescript
 * const grouped = await getAllGroupedByCollection(network, publicKey);
 * // Returns: [
 * //   { collection: 'Cool Collection', length: 5, items: [...], thumb: '...' },
 * //   { collection: 'Another Collection', length: 2, items: [...], thumb: '...' },
 * //   { mint: {...}, name: 'Standalone NFT', ... }, // NFTs without collection
 * // ]
 * ```
 */
export async function getAllGroupedByCollection(
  network: SolanaNetwork,
  owner: string,
  fetchNftsFromBackend: FetchNftsFromBackendFn = () => Promise.resolve([])
): Promise<(NftCollectionGroup | Nft)[]> {
  const nfts = await getAll(network, owner, false, fetchNftsFromBackend);
  const nftsByCollection = getNftsByCollection(nfts);
  const nftsWithoutCollection = getNftsWithoutCollection(nfts);
  return [...nftsByCollection, ...nftsWithoutCollection];
}

// ============================================================================
// Individual NFT Functions
// ============================================================================

/**
 * Fetches a single NFT by mint address
 *
 * @param network - The network configuration object
 * @param mintAddress - The NFT's mint address
 * @returns NFT data or null if not found
 */
export async function getNftByAddress(
  network: SolanaNetwork,
  mintAddress: string,
  fetchNftByAddress: FetchNftByAddressFn = () => Promise.resolve(null)
): Promise<Nft | null> {
  try {
    const data = await fetchNftByAddress(network.id, mintAddress);
    if (data?.collection) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an item is a collection group (vs a standalone NFT)
 * @param item - Item to check
 * @returns True if the item is a collection group
 */
export function isCollection(item: NftCollectionGroup | Nft): item is NftCollectionGroup {
  return 'items' in item && Array.isArray(item.items);
}

/**
 * Check if a collection has more than one NFT
 * @param item - Collection group or NFT
 * @returns True if it's a collection with more than one item
 */
export function isMoreThanOne(item: NftCollectionGroup | Nft): boolean {
  return isCollection(item) && item.items.length > 1;
}

/**
 * Check if an NFT or collection is blacklisted
 * @param item - Collection group or NFT
 * @returns True if blacklisted
 */
export function isBlacklisted(item: NftCollectionGroup | Nft): boolean {
  if (isCollection(item)) {
    return item.items[0]?.blacklisted ?? false;
  }
  return item.blacklisted ?? false;
}
