/**
 * Solana NFT Service (frontend)
 *
 * Post-Triton-cutover: this module no longer talks to any RPC directly.
 * All NFT data flows through `salmon-api` via the `solana-nft` API service,
 * which is provider-agnostic on the backend (Triton primary, Helius fallback
 * only when Triton is not configured for the env).
 *
 * The previous direct-Helius-DAS path has been removed:
 *   - no `HELIUS_API_KEY` consumed in the client bundle
 *   - no `axios` calls to Helius from this layer
 *   - no Token-2022 enumeration in the client (the backend repository owns it)
 *
 * Public API stays the same — apps continue to call `getAll`,
 * `getAllPaginated`, `getAllGroupedByCollection`, `getNftByAddress`. They now
 * accept dependency-injected fetchers that wrap the api-service.
 */

import type { SolanaNetwork } from '../../types/blockchain';
import type {
  Nft,
  NftPaginatedResponse,
  NftCollectionGroup,
  FetchNftsFromBackendFn,
  FetchNftsFromBackendPaginatedFn,
  FetchNftByAddressFn,
  GetNftsOptions,
} from '../../types/nft';

// ============================================================================
// Main Public Functions
// ============================================================================

/**
 * Fetches all NFTs for a given public key via the salmon-api backend.
 *
 * Apps are expected to inject `fetchNftsFromBackend` from the api-service
 * layer (`@salmon/shared/api/services/solana-nft`). The default no-op exists
 * for tests and degraded environments.
 */
export async function getAll(
  network: SolanaNetwork,
  publicKey: string,
  noCache = false,
  fetchNftsFromBackend: FetchNftsFromBackendFn = () => Promise.resolve([]),
  opts: { includeSpam?: boolean } = {}
): Promise<Nft[]> {
  return fetchNftsFromBackend(network.id, publicKey, noCache, opts);
}

/**
 * Fetches NFTs paginated via the salmon-api backend (limit/offset query).
 *
 * Apps inject `fetchNftsFromBackendPaginated` so the shared package stays
 * unaware of the HTTP client. When no fetcher is provided we return an empty
 * paginated response — callers should always pass a real fetcher in
 * production.
 */
export async function getAllPaginated(
  network: SolanaNetwork,
  publicKey: string,
  options: GetNftsOptions = {},
  fetchNftsFromBackendPaginated: FetchNftsFromBackendPaginatedFn = () =>
    Promise.resolve({
      data: [],
      pagination: {
        total: 0,
        limit: options.limit ?? 50,
        offset: options.offset ?? 0,
        hasMore: false,
        nextOffset: null,
      },
    })
): Promise<NftPaginatedResponse> {
  return fetchNftsFromBackendPaginated(network.id, publicKey, options);
}

// ============================================================================
// Collection Grouping Functions
// ============================================================================

/**
 * Gets unique collection names from NFTs
 */
export function getCollections(nfts: Nft[]): string[] {
  const collections = nfts
    .map((nft) => nft.collection?.name)
    .filter((name): name is string => !!name);
  return Array.from(new Set(collections));
}

/**
 * Groups NFTs by collection
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
 */
export function getNftsWithoutCollection(nfts: Nft[]): Nft[] {
  return nfts.filter((nft) => !nft.collection?.name);
}

/**
 * Fetches all NFTs grouped by collection
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
 * Fetches a single NFT by mint address via the salmon-api backend.
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

export function isCollection(item: NftCollectionGroup | Nft): item is NftCollectionGroup {
  return 'items' in item && Array.isArray(item.items);
}

export function isMoreThanOne(item: NftCollectionGroup | Nft): boolean {
  return isCollection(item) && item.items.length > 1;
}

export function isBlacklisted(item: NftCollectionGroup | Nft): boolean {
  if (isCollection(item)) {
    return item.items[0]?.blacklisted ?? false;
  }
  return item.blacklisted ?? false;
}
