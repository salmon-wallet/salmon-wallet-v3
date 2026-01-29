/**
 * Token List Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-token-list-service.js
 *
 * Provides token metadata with multi-tier fallback:
 * 1. Backend API (fastest, with cache)
 * 2. Jupiter Aggregator
 * 3. Solana Labs CDN
 *
 * API Endpoints:
 * - GET /v1/{networkId}/ft/verified - Get verified token list
 * - GET /v1/{networkId}/ft/batch?mints={mints} - Batch fetch token metadata
 * - GET /v1/{networkId}/ft/top?interval=24h&limit=5 - Get featured/top tokens
 * - GET /v1/{networkId}/ft/search?query={query} - Search tokens
 *
 * External Fallback Endpoints:
 * - Jupiter: https://cache.jup.ag/tokens
 * - CDN: https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json
 */

import axios from 'axios';
import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Token metadata from the API
 */
export interface TokenMetadata {
  /** Token symbol (e.g., 'SOL', 'USDC') */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Token logo URL */
  logo: string | null;
  /** Token address (mint address for Solana) */
  address: string;
  /** Chain ID (e.g., 101 for Solana mainnet) */
  chainId?: number;
  /** CoinGecko ID for price lookups */
  coingeckoId?: string | null;
  /** Token tags for categorization */
  tags: string[];
}

/**
 * Token list item (same as metadata for compatibility)
 */
export type TokenListItem = TokenMetadata;

/**
 * Raw token data from Jupiter API
 */
interface JupiterToken {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  address: string;
  chainId?: number;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
    [key: string]: unknown;
  };
}

/**
 * Raw token data from backend API
 */
interface BackendToken {
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  address: string;
  chainId?: number;
  coingeckoId?: string;
  tags?: string[];
  icon?: string;
  id?: string;
}

/**
 * CDN token list format
 */
interface CdnTokenList {
  tokens: JupiterToken[];
}

/**
 * Token list source for debugging
 */
export type TokenListSource = 'backend' | 'jupiter' | 'cdn';

/**
 * Network identifier
 */
export type NetworkId = 'solana-mainnet' | 'solana-devnet';

// ============================================================================
// Constants
// ============================================================================

/** Jupiter token list URL */
const TOKEN_LIST_URL_JUP = 'https://cache.jup.ag/tokens';

/** Solana Labs CDN token list URL */
const TOKEN_LIST_URL_CDN =
  'https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json';

/** Batch chunk size for metadata requests */
const BATCH_CHUNK_SIZE = 100;

/** External request timeout */
const EXTERNAL_TIMEOUT_MS = 30000;

// ============================================================================
// In-memory Cache
// ============================================================================

interface TokenListCache {
  tokens: TokenMetadata[];
  source: TokenListSource;
  timestamp: number;
}

let tokenListCache: TokenListCache | null = null;
const TOKEN_LIST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedTokenList(): TokenListCache | null {
  if (tokenListCache && Date.now() - tokenListCache.timestamp < TOKEN_LIST_CACHE_TTL_MS) {
    return tokenListCache;
  }
  return null;
}

function setCachedTokenList(tokens: TokenMetadata[], source: TokenListSource): void {
  tokenListCache = { tokens, source, timestamp: Date.now() };
}

// ============================================================================
// IPFS URL Normalization
// ============================================================================

const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://nftstorage.link/ipfs/',
];

/**
 * Normalize IPFS/Arweave URLs to use reliable gateways
 */
function normalizeIpfsUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Handle IPFS protocol URLs
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // Handle Arweave protocol URLs
  if (url.startsWith('ar://')) {
    const hash = url.replace('ar://', '');
    return `https://arweave.net/${hash}`;
  }

  // Already a valid HTTP URL
  return url;
}

// ============================================================================
// Token List Retrieval (Multi-tier fallback)
// ============================================================================

/**
 * Retrieve token list with multi-tier fallback
 *
 * Priority:
 * 1. Backend API (verified endpoint) - fastest, has caching
 * 2. Jupiter Aggregator
 * 3. Solana Labs CDN
 *
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Object with tokens and source
 */
async function retrieveTokenList(
  networkId: NetworkId = 'solana-mainnet'
): Promise<{ tokens: TokenMetadata[]; source: TokenListSource }> {
  // Check cache first
  const cached = getCachedTokenList();
  if (cached) {
    return { tokens: cached.tokens, source: cached.source };
  }

  // Tier 1: Backend API (fastest, with cache)
  try {
    const { data } = await apiClient.get<BackendToken[]>(`/v1/${networkId}/ft/verified`);
    const tokens = normalizeBackendTokens(data);
    setCachedTokenList(tokens, 'backend');
    return { tokens, source: 'backend' };
  } catch {
    console.warn('[TokenService] Backend unavailable, trying Jupiter...');
  }

  // Tier 2: Jupiter Aggregator
  try {
    const { data } = await axios.get<JupiterToken[]>(TOKEN_LIST_URL_JUP, {
      timeout: EXTERNAL_TIMEOUT_MS,
    });
    const tokens = normalizeJupiterTokens(data);
    setCachedTokenList(tokens, 'jupiter');
    return { tokens, source: 'jupiter' };
  } catch {
    console.warn('[TokenService] Jupiter unavailable, using CDN fallback...');
  }

  // Tier 3: Solana Labs CDN
  const { data } = await axios.get<CdnTokenList>(TOKEN_LIST_URL_CDN, {
    timeout: EXTERNAL_TIMEOUT_MS,
  });
  const tokens = normalizeJupiterTokens(data.tokens);
  setCachedTokenList(tokens, 'cdn');
  return { tokens, source: 'cdn' };
}

/**
 * Normalize backend token data to common format
 */
function normalizeBackendTokens(tokens: BackendToken[]): TokenMetadata[] {
  return tokens.map((token) => ({
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: normalizeIpfsUrl(token.logo || token.icon),
    address: token.address || token.id || '',
    chainId: token.chainId,
    coingeckoId: token.coingeckoId,
    tags: token.tags || [],
  }));
}

/**
 * Normalize Jupiter/CDN token data to common format
 */
function normalizeJupiterTokens(tokens: JupiterToken[]): TokenMetadata[] {
  return tokens.map((token) => ({
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: normalizeIpfsUrl(token.logoURI),
    address: token.address,
    chainId: token.chainId,
    coingeckoId: token.extensions?.coingeckoId,
    tags: token.tags || [],
  }));
}

// ============================================================================
// Token List Functions
// ============================================================================

/**
 * Get deduplicated token list
 *
 * Deduplication prioritizes:
 * 1. Verified/strict tokens
 * 2. Community tokens
 * 3. Unknown tokens
 *
 * @param networkId - Network identifier
 * @returns Array of deduplicated token metadata
 */
export async function getTokenList(
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata[]> {
  const { tokens } = await retrieveTokenList(networkId);

  // Deduplicate tokens by symbol, prioritizing verified/community tokens
  const seenSymbols = new Map<string, TokenMetadata>();
  const deduplicatedTokens: TokenMetadata[] = [];

  tokens.forEach((token) => {
    const key = token.symbol;
    const existing = seenSymbols.get(key);

    // Priority: verified > community > unknown
    const isVerified = token.tags.includes('verified') || token.tags.includes('strict');
    const isCommunity = token.tags.includes('community');
    const existingIsVerified =
      existing?.tags.includes('verified') || existing?.tags.includes('strict');
    const existingIsCommunity = existing?.tags.includes('community');

    if (!existing) {
      seenSymbols.set(key, token);
      deduplicatedTokens.push(token);
    } else if (isVerified && !existingIsVerified) {
      // Replace with verified version
      const index = deduplicatedTokens.findIndex((t) => t.symbol === key);
      if (index !== -1) {
        deduplicatedTokens[index] = token;
        seenSymbols.set(key, token);
      }
    } else if (isCommunity && !existingIsVerified && !existingIsCommunity) {
      // Replace with community version if current is unknown
      const index = deduplicatedTokens.findIndex((t) => t.symbol === key);
      if (index !== -1) {
        deduplicatedTokens[index] = token;
        seenSymbols.set(key, token);
      }
    }
  });

  return deduplicatedTokens;
}

/**
 * Get featured/top tokens by trading activity
 *
 * Endpoint: GET /v1/{networkId}/ft/top?interval=24h&limit=5
 *
 * @param networkId - Network identifier
 * @returns Array of featured token metadata
 */
export async function getFeaturedTokenList(
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata[]> {
  try {
    const { data } = await apiClient.get<BackendToken[]>(
      `/v1/${networkId}/ft/top?interval=24h&limit=5`
    );

    if (data && Array.isArray(data)) {
      return data.map((token) => ({
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: normalizeIpfsUrl(token.logo || token.icon),
        address: token.address || token.id || '',
        coingeckoId: token.coingeckoId || null,
        tags: token.tags || [],
      }));
    }
    return [];
  } catch (error) {
    console.error('[TokenService] Failed to get featured tokens:', error);
    return [];
  }
}

/**
 * Fetch token metadata only for specific mint addresses
 * Uses batch endpoint which is more efficient than fetching all tokens
 *
 * Endpoint: GET /v1/{networkId}/ft/batch?mints={mints}
 *
 * @param mintAddresses - Array of mint addresses to fetch metadata for
 * @param networkId - Network identifier
 * @returns Array of normalized token metadata
 */
export async function getTokenMetadataByMints(
  mintAddresses: string[],
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata[]> {
  if (!mintAddresses || mintAddresses.length === 0) {
    return [];
  }

  // Remove duplicates
  const uniqueMints = [...new Set(mintAddresses)];

  // Split into chunks if more than BATCH_CHUNK_SIZE mints
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueMints.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(uniqueMints.slice(i, i + BATCH_CHUNK_SIZE));
  }

  let allTokens: TokenMetadata[] = [];

  for (const chunk of chunks) {
    const mintsParam = chunk.join(',');

    // Tier 1: Backend batch endpoint
    try {
      const { data } = await apiClient.get<BackendToken[]>(
        `/v1/${networkId}/ft/batch?mints=${mintsParam}`
      );
      const tokens = normalizeBackendTokens(data);
      allTokens = allTokens.concat(tokens);
    } catch {
      console.warn('[TokenService] Batch endpoint unavailable, trying Jupiter fallback...');

      // Tier 2: Fetch from Jupiter and filter locally
      try {
        const { data: jupiterTokens } = await axios.get<JupiterToken[]>(TOKEN_LIST_URL_JUP, {
          timeout: EXTERNAL_TIMEOUT_MS,
        });
        const chunkSet = new Set(chunk);
        const filteredTokens = jupiterTokens
          .filter((token) => chunkSet.has(token.address))
          .map((token) => ({
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logo: normalizeIpfsUrl(token.logoURI),
            address: token.address,
            chainId: token.chainId,
            coingeckoId: token.extensions?.coingeckoId,
            tags: token.tags || [],
          }));
        allTokens = allTokens.concat(filteredTokens);
      } catch {
        console.warn('[TokenService] Jupiter fallback also failed for chunk');
        // Continue with next chunk, some tokens may not have metadata
      }
    }
  }

  return allTokens;
}

/**
 * Get verified tokens from backend
 * Uses the verified endpoint which returns a curated list
 *
 * Endpoint: GET /v1/{networkId}/ft/verified
 *
 * @param networkId - Network identifier
 * @returns Array of verified token metadata
 */
export async function getVerifiedTokens(
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata[]> {
  try {
    const { data } = await apiClient.get<BackendToken[]>(`/v1/${networkId}/ft/verified`);
    return normalizeBackendTokens(data);
  } catch (error) {
    console.warn('[TokenService] Verified tokens endpoint unavailable, using fallback...');

    // Fallback: use featured tokens
    try {
      return await getFeaturedTokenList(networkId);
    } catch {
      console.warn('[TokenService] Fallback failed, returning empty list');
      return [];
    }
  }
}

/**
 * Search tokens by query string
 * Searches token name, symbol, or address
 *
 * Endpoint: GET /v1/{networkId}/ft/search?query={query}
 *
 * @param query - Search query (name, symbol, or address)
 * @param networkId - Network identifier
 * @returns Array of matching token metadata
 */
export async function searchTokens(
  query: string,
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata[]> {
  if (!query || query.length < 3) {
    return [];
  }

  // Tier 1: Backend search endpoint
  try {
    const { data } = await apiClient.get<BackendToken[]>(
      `/v1/${networkId}/ft/search?query=${encodeURIComponent(query)}`
    );
    return normalizeBackendTokens(data);
  } catch {
    console.warn('[TokenService] Search endpoint unavailable, using local search...');

    // Tier 2: Search locally in full token list
    try {
      const allTokens = await getTokenList(networkId);
      const lowerQuery = query.toLowerCase();
      return allTokens
        .filter(
          (token) =>
            token.name?.toLowerCase().includes(lowerQuery) ||
            token.symbol?.toLowerCase().includes(lowerQuery) ||
            token.address?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 50); // Limit results to avoid performance issues
    } catch {
      console.warn('[TokenService] Local search failed');
      return [];
    }
  }
}

/**
 * Get token by address
 *
 * @param address - Token mint address
 * @param networkId - Network identifier
 * @returns Token metadata or null if not found
 */
export async function getTokenByAddress(
  address: string,
  networkId: NetworkId = 'solana-mainnet'
): Promise<TokenMetadata | null> {
  // Try batch endpoint first (single token)
  const result = await getTokenMetadataByMints([address], networkId);
  return result.length > 0 ? result[0] : null;
}

/**
 * Clear the token list cache
 */
export function clearTokenListCache(): void {
  tokenListCache = null;
}

/**
 * Get the current token list source
 *
 * @returns Source of the current cached token list, or null if not cached
 */
export function getTokenListSource(): TokenListSource | null {
  const cached = getCachedTokenList();
  return cached?.source ?? null;
}
