/**
 * Ethereum API Service
 *
 * Provides API-based token detection for Ethereum wallets.
 * Uses external indexing services to detect ALL ERC-20 tokens a user holds,
 * without needing to know token addresses in advance.
 *
 * Supported APIs (in order of preference):
 * 1. Alchemy Token API - Most reliable, requires API key
 * 2. Moralis - Good alternative, requires API key
 * 3. Public fallback - Uses Ethplorer (free, rate limited)
 *
 * This enables automatic token detection similar to MetaMask's behavior.
 */

import { get } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Token balance from Alchemy API
 */
export interface AlchemyTokenBalance {
  /** Token contract address */
  contractAddress: string;
  /** Raw balance in hex */
  tokenBalance: string;
}

/**
 * Token metadata from Alchemy API
 */
export interface AlchemyTokenMetadata {
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Number of decimals */
  decimals: number;
  /** Logo URL */
  logo: string | null;
}

/**
 * Detected ERC-20 token with balance and metadata
 */
export interface DetectedERC20Token {
  /** Token contract address */
  address: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Raw balance as string (in smallest unit) */
  balance: string;
  /** Human-readable balance */
  uiAmount: number;
  /** Logo URL if available */
  logoUri?: string;
  /** CoinGecko ID for price lookups */
  coingeckoId?: string;
}

/**
 * Response from Ethplorer API (free public API)
 */
interface EthplorerTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: string | number;
  balance: number;
  rawBalance: string;
  image?: string;
}

interface EthplorerAddressInfo {
  address: string;
  ETH: {
    balance: number;
    rawBalance: string;
  };
  tokens?: EthplorerTokenInfo[];
}

/**
 * Response from Salmon API token balance endpoint
 */
interface SalmonTokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: string;
  logoURI?: string;
  coingeckoId?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Ethplorer public API base URL (free, 2 req/sec rate limit)
 */
const ETHPLORER_API_URL = 'https://api.ethplorer.io';

/**
 * Ethplorer free API key for public access
 */
const ETHPLORER_API_KEY = 'freekey';

/**
 * Known token mappings for coingeckoId lookups
 * Maps lowercase contract address to coingeckoId
 */
const KNOWN_COINGECKO_IDS: Record<string, string> = {
  // Stablecoins
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
  '0x6b175474e89094c44da98b954eedec16991e0f68': 'dai', // DAI
  '0x4fabb145d64652a948d72533023f6e7a623c7c53': 'binance-usd', // BUSD
  '0x8e870d67f660d95d5be530380d0ec0bd388289e1': 'paxos-standard', // USDP
  '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd': 'gemini-dollar', // GUSD
  '0x853d955acef822db058eb8505911ed77f175b99e': 'frax', // FRAX

  // Wrapped tokens
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'weth', // WETH
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC

  // DeFi tokens
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap', // UNI
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave', // AAVE
  '0xc00e94cb662c3520282e6f5717214004a7f26888': 'compound-governance-token', // COMP
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'maker', // MKR
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': 'sushi', // SUSHI
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': 'yearn-finance', // YFI
  '0xd533a949740bb3306d119cc777fa900ba034cd52': 'curve-dao-token', // CRV
  '0xba100000625a3754423978a60c9317c58a424e3d': 'balancer', // BAL
  '0x111111111117dc0aa78b770fa6a738034120c302': '1inch', // 1INCH

  // Other popular tokens
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink', // LINK
  '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': 'shiba-inu', // SHIB
  '0x4d224452801aced8b2f0aebe155379bb5d594381': 'apecoin', // APE
  '0x3845badade8e6dff049820680d1f14bd3903a5d0': 'the-sandbox', // SAND
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'matic-network', // MATIC (ERC20)
  '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b': 'axie-infinity', // AXS
  '0x15d4c048f83bd7e37d49ea4c83a07267ec4203da': 'gala', // GALA
  '0x4e15361fd6b4bb609fa63c81a2be19d873717870': 'fantom', // FTM (ERC20)
};

// ============================================================================
// Primary API Functions
// ============================================================================

/**
 * Get all ERC-20 token balances for an Ethereum wallet using Salmon API
 *
 * This is the primary method that calls the Salmon backend which proxies
 * to indexing services like Alchemy/Moralis.
 *
 * @param address - Wallet address to query
 * @param networkId - Network identifier (e.g., 'ethereum', 'ethereum-sepolia')
 * @returns Array of detected tokens with balances
 */
export async function getERC20TokenBalances(
  address: string,
  networkId: string = 'ethereum'
): Promise<DetectedERC20Token[]> {
  try {
    // Try Salmon API first (proxies to Alchemy/other indexers)
    const tokens = await getSalmonApiTokenBalances(address, networkId);
    if (tokens.length > 0) {
      return tokens;
    }

    // Fall back to Ethplorer for mainnet
    if (networkId === 'ethereum') {
      return await getEthplorerTokenBalances(address);
    }

    return [];
  } catch (error) {
    console.warn('[ethereum-api] Failed to fetch token balances:', error);

    // Fall back to Ethplorer for mainnet on error
    if (networkId === 'ethereum') {
      try {
        return await getEthplorerTokenBalances(address);
      } catch (fallbackError) {
        console.warn('[ethereum-api] Ethplorer fallback also failed:', fallbackError);
      }
    }

    return [];
  }
}

/**
 * Fetch token balances from Salmon API backend
 *
 * @param address - Wallet address
 * @param networkId - Network identifier
 * @returns Array of detected tokens
 */
async function getSalmonApiTokenBalances(
  address: string,
  networkId: string
): Promise<DetectedERC20Token[]> {
  try {
    // Call Salmon API endpoint for token balances
    // The backend uses Alchemy/Moralis to detect all tokens
    const response = await get<SalmonTokenBalance[]>(
      `/v1/${networkId}/account/${address}/tokens`,
      { params: { include: 'logo' } }
    );

    return response.map((token) => {
      const rawBalance = BigInt(token.amount);
      const uiAmount = Number(rawBalance) / Math.pow(10, token.decimals);

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: token.amount,
        uiAmount,
        logoUri: token.logoURI,
        coingeckoId: token.coingeckoId || lookupCoingeckoId(token.address),
      };
    }).filter((token) => token.uiAmount > 0);
  } catch (error) {
    // API endpoint may not exist yet, return empty to trigger fallback
    console.debug('[ethereum-api] Salmon API token endpoint not available:', error);
    return [];
  }
}

/**
 * Fetch token balances from Ethplorer API (public fallback)
 *
 * Ethplorer is a free Ethereum blockchain explorer API that provides
 * token balances without requiring an API key (rate limited to 2 req/sec).
 *
 * @param address - Wallet address
 * @returns Array of detected tokens
 */
async function getEthplorerTokenBalances(
  address: string
): Promise<DetectedERC20Token[]> {
  try {
    const url = `${ETHPLORER_API_URL}/getAddressInfo/${address}?apiKey=${ETHPLORER_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ethplorer API error: ${response.status}`);
    }

    const data: EthplorerAddressInfo = await response.json();

    if (!data.tokens || data.tokens.length === 0) {
      return [];
    }

    return data.tokens
      .filter((token) => {
        // Filter out tokens with zero or invalid balance
        const balance = BigInt(token.rawBalance || '0');
        return balance > 0n;
      })
      .map((token) => {
        const decimals = typeof token.decimals === 'string'
          ? parseInt(token.decimals, 10)
          : token.decimals;
        const rawBalance = token.rawBalance || '0';
        const uiAmount = Number(BigInt(rawBalance)) / Math.pow(10, decimals);

        return {
          address: token.address,
          name: token.name || 'Unknown Token',
          symbol: token.symbol || 'UNKNOWN',
          decimals,
          balance: rawBalance,
          uiAmount,
          logoUri: token.image ? `https://ethplorer.io${token.image}` : undefined,
          coingeckoId: lookupCoingeckoId(token.address),
        };
      })
      .filter((token) => token.uiAmount > 0);
  } catch (error) {
    console.warn('[ethereum-api] Ethplorer API error:', error);
    return [];
  }
}

/**
 * Look up CoinGecko ID for a token address
 *
 * @param address - Token contract address
 * @returns CoinGecko ID if known, undefined otherwise
 */
function lookupCoingeckoId(address: string): string | undefined {
  return KNOWN_COINGECKO_IDS[address.toLowerCase()];
}

// ============================================================================
// Token Metadata Functions
// ============================================================================

/**
 * Get token metadata for multiple addresses
 *
 * Fetches token name, symbol, decimals, and logo for multiple tokens.
 * Uses batch requests when possible for efficiency.
 *
 * @param addresses - Array of token contract addresses
 * @param networkId - Network identifier
 * @returns Map of address to metadata
 */
export async function getTokenMetadataBatch(
  addresses: string[],
  networkId: string = 'ethereum'
): Promise<Map<string, AlchemyTokenMetadata>> {
  const metadataMap = new Map<string, AlchemyTokenMetadata>();

  if (addresses.length === 0) {
    return metadataMap;
  }

  try {
    // Try Salmon API batch metadata endpoint
    const response = await get<Array<{ address: string } & AlchemyTokenMetadata>>(
      `/v1/${networkId}/tokens/metadata`,
      { params: { addresses: addresses.join(',') } }
    );

    response.forEach((token) => {
      metadataMap.set(token.address.toLowerCase(), {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logo: token.logo,
      });
    });
  } catch {
    // Metadata endpoint not available, tokens will use on-chain fallback
    console.debug('[ethereum-api] Token metadata batch endpoint not available');
  }

  return metadataMap;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert hex balance string to bigint
 *
 * @param hexBalance - Balance as hex string (e.g., "0x123")
 * @returns Balance as bigint
 */
export function hexToBalance(hexBalance: string): bigint {
  if (!hexBalance || hexBalance === '0x0' || hexBalance === '0x') {
    return 0n;
  }
  return BigInt(hexBalance);
}

/**
 * Format token balance for display
 *
 * @param balance - Raw balance as bigint or string
 * @param decimals - Token decimals
 * @param displayDecimals - Number of decimals to show (default: 4)
 * @returns Formatted balance string
 */
export function formatTokenBalance(
  balance: bigint | string,
  decimals: number,
  displayDecimals: number = 4
): string {
  const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
  const divisor = BigInt(10 ** decimals);

  const wholePart = balanceBigInt / divisor;
  const fractionPart = balanceBigInt % divisor;

  const fractionStr = fractionPart
    .toString()
    .padStart(decimals, '0')
    .slice(0, displayDecimals);

  const numValue = parseFloat(`${wholePart}.${fractionStr}`);

  if (numValue === 0) return '0';
  if (numValue < 0.0001) return '<0.0001';
  if (numValue >= 1_000_000) return `${(numValue / 1_000_000).toFixed(2)}M`;
  if (numValue >= 1000) return `${(numValue / 1000).toFixed(2)}K`;

  return numValue.toFixed(displayDecimals);
}

/**
 * Merge featured tokens with detected tokens
 *
 * Combines automatically detected tokens with a list of featured tokens,
 * deduplicating by address.
 *
 * @param detectedTokens - Tokens detected via API
 * @param featuredTokens - Hardcoded featured tokens to check
 * @returns Combined array of tokens
 */
export function mergeTokenLists(
  detectedTokens: DetectedERC20Token[],
  featuredTokens: Array<{ address: string; symbol: string; name: string; decimals: number; logoUri?: string; coingeckoId?: string }>
): DetectedERC20Token[] {
  const tokenMap = new Map<string, DetectedERC20Token>();

  // Add detected tokens first (they have balances)
  detectedTokens.forEach((token) => {
    tokenMap.set(token.address.toLowerCase(), token);
  });

  // Featured tokens are only added if not already present (they may have zero balance)
  featuredTokens.forEach((token) => {
    const key = token.address.toLowerCase();
    if (!tokenMap.has(key)) {
      tokenMap.set(key, {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: '0',
        uiAmount: 0,
        logoUri: token.logoUri,
        coingeckoId: token.coingeckoId,
      });
    }
  });

  // Return only tokens with non-zero balance
  return Array.from(tokenMap.values()).filter((token) => token.uiAmount > 0);
}
