/**
 * Ethereum Token List Service
 * Migrated from salmon-wallet-v2:
 * - src/adapter/services/ethereum/ethereum-token-list-service.js
 *
 * Provides functionality for ERC-20 token operations:
 * - Get token metadata (name, symbol, decimals)
 * - Get user's tokens with balances
 * - Get featured/well-known tokens
 *
 * Uses ethers.js v6 Contract for ERC-20 interactions.
 */

import { Contract, formatUnits } from 'ethers';
import type { Provider } from 'ethers';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an ERC-20 token with its metadata
 */
export interface EthereumToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

/**
 * Represents a token with its balance
 */
export interface EthereumTokenBalance extends EthereumToken {
  balance: bigint;
  uiAmount: string;
}

/**
 * Known token entry for featured tokens
 */
interface KnownToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimal ERC-20 ABI for reading token metadata and balances
 */
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
];

/**
 * Network IDs for Ethereum networks
 */
export const ETHEREUM_NETWORK_IDS = {
  MAINNET: 'ethereum',
  GOERLI: 'ethereum-goerli',
  SEPOLIA: 'ethereum-sepolia',
} as const;

export type EthereumNetworkId =
  (typeof ETHEREUM_NETWORK_IDS)[keyof typeof ETHEREUM_NETWORK_IDS];

/**
 * Featured tokens for Ethereum Mainnet
 * Well-known ERC-20 tokens that are commonly used
 */
const MAINNET_FEATURED_TOKENS: KnownToken[] = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoUri:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  },
  {
    address: '0x6B175474E89094C44Da98b954EescdeCB5BE3eF69',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoUri:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeC16991e0F68/logo.png',
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoUri:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  },
];

/**
 * Featured tokens by network
 */
const FEATURED_TOKENS_BY_NETWORK: Record<string, KnownToken[]> = {
  [ETHEREUM_NETWORK_IDS.MAINNET]: MAINNET_FEATURED_TOKENS,
  // Testnets typically don't have featured tokens
  [ETHEREUM_NETWORK_IDS.GOERLI]: [],
  [ETHEREUM_NETWORK_IDS.SEPOLIA]: [],
};

// ============================================================================
// Token Info Functions
// ============================================================================

/**
 * Gets token metadata from an ERC-20 contract
 *
 * Reads the name, symbol, and decimals from the token contract.
 *
 * @param provider - Ethers.js provider
 * @param tokenAddress - Token contract address
 * @returns Token metadata
 *
 * @example
 * ```typescript
 * const token = await getTokenInfo(provider, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
 * // Returns: { address: '0x...', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
 * ```
 */
export async function getTokenInfo(
  provider: Provider,
  tokenAddress: string
): Promise<EthereumToken> {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);

  const [name, symbol, decimals] = await Promise.all([
    contract.name() as Promise<string>,
    contract.symbol() as Promise<string>,
    contract.decimals() as Promise<bigint>,
  ]);

  return {
    address: tokenAddress,
    name,
    symbol,
    decimals: Number(decimals),
  };
}

/**
 * Gets the balance of a token for a specific address
 *
 * @param provider - Ethers.js provider
 * @param tokenAddress - Token contract address
 * @param ownerAddress - Address to check balance for
 * @returns Balance as bigint
 */
export async function getTokenBalance(
  provider: Provider,
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint> {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);
  return contract.balanceOf(ownerAddress) as Promise<bigint>;
}

// ============================================================================
// Token List Functions
// ============================================================================

/**
 * Gets all tokens with non-zero balances for a user
 *
 * Checks the balance of each known token and returns only those
 * with a non-zero balance.
 *
 * @param provider - Ethers.js provider
 * @param address - User's Ethereum address
 * @param knownTokens - List of known tokens to check
 * @returns Tokens with non-zero balances
 *
 * @example
 * ```typescript
 * const tokens = await getTokensByOwner(provider, userAddress, [
 *   { address: '0x...', symbol: 'USDC', name: 'USD Coin', decimals: 6 }
 * ]);
 * // Returns: [{ address: '0x...', symbol: 'USDC', balance: 1000000n, uiAmount: '1.0' }]
 * ```
 */
export async function getTokensByOwner(
  provider: Provider,
  address: string,
  knownTokens: EthereumToken[]
): Promise<EthereumTokenBalance[]> {
  if (!knownTokens || knownTokens.length === 0) {
    return [];
  }

  // Check balance for each token in parallel
  const balanceResults = await Promise.allSettled(
    knownTokens.map(async (token) => {
      const balance = await getTokenBalance(provider, token.address, address);
      return { token, balance };
    })
  );

  // Filter to only non-zero balances and format results
  const tokensWithBalance: EthereumTokenBalance[] = [];

  for (const result of balanceResults) {
    if (result.status === 'fulfilled' && result.value.balance > 0n) {
      const { token, balance } = result.value;
      tokensWithBalance.push({
        ...token,
        balance,
        uiAmount: formatUnits(balance, token.decimals),
      });
    }
  }

  return tokensWithBalance;
}

/**
 * Gets featured/well-known tokens for a network
 *
 * Returns a hardcoded list of commonly used tokens for the given network.
 *
 * @param networkId - Network identifier (e.g., 'ethereum', 'ethereum-goerli')
 * @returns List of featured tokens
 *
 * @example
 * ```typescript
 * const tokens = getFeaturedTokens('ethereum');
 * // Returns: [{ address: '0x...', symbol: 'WETH', ... }, ...]
 * ```
 */
export function getFeaturedTokens(networkId: string): EthereumToken[] {
  return FEATURED_TOKENS_BY_NETWORK[networkId] || [];
}

/**
 * Gets a specific featured token by symbol
 *
 * @param networkId - Network identifier
 * @param symbol - Token symbol (e.g., 'USDC')
 * @returns Token if found, undefined otherwise
 */
export function getFeaturedTokenBySymbol(
  networkId: string,
  symbol: string
): EthereumToken | undefined {
  const tokens = getFeaturedTokens(networkId);
  return tokens.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * Gets a specific featured token by address
 *
 * @param networkId - Network identifier
 * @param address - Token contract address
 * @returns Token if found, undefined otherwise
 */
export function getFeaturedTokenByAddress(
  networkId: string,
  address: string
): EthereumToken | undefined {
  const tokens = getFeaturedTokens(networkId);
  return tokens.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if an address is a valid ERC-20 token contract
 *
 * Attempts to read the symbol from the contract. If successful,
 * the address is likely a valid ERC-20 token.
 *
 * @param provider - Ethers.js provider
 * @param address - Address to check
 * @returns True if the address is a valid ERC-20 token
 */
export async function isErc20Token(
  provider: Provider,
  address: string
): Promise<boolean> {
  try {
    const contract = new Contract(address, ERC20_ABI, provider);
    await contract.symbol();
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a token balance to a human-readable string
 *
 * @param balance - Raw balance as bigint
 * @param decimals - Token decimals
 * @returns Formatted balance string
 */
export function formatTokenBalance(balance: bigint, decimals: number): string {
  return formatUnits(balance, decimals);
}
