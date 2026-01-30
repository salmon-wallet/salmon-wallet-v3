/**
 * Ethereum Balance Service
 * Migrated from salmon-wallet-v2/src/adapter/services/ethereum/ethereum-balance-service.js
 *
 * Provides balance retrieval for ETH and ERC20 tokens on Ethereum.
 * Uses ethers.js v6 for blockchain interactions.
 *
 * Features:
 * - Native ETH balance retrieval
 * - ERC20 token balance retrieval
 * - Batch token balance queries
 * - Combined wallet balance (ETH + tokens)
 * - Formatted balance display
 */

import { Contract, formatUnits, type Provider } from 'ethers';

// ============================================================================
// Types
// ============================================================================

/**
 * Balance information for ETH or ERC20 token
 */
export interface EthereumTokenBalance {
  /** Token contract address (empty string for native ETH) */
  address: string;
  /** Token symbol (e.g., 'ETH', 'USDC') */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Raw balance in smallest unit (wei for ETH) */
  balance: bigint;
  /** Human-readable formatted balance */
  formattedBalance: string;
}

/**
 * Complete wallet balance with native ETH and tokens
 */
export interface EthereumWalletBalance {
  /** Native ETH balance */
  native: EthereumTokenBalance;
  /** ERC20 token balances */
  tokens: EthereumTokenBalance[];
  /** Total USD value (would need price service integration) */
  totalUsd?: number;
}

/**
 * Token information for balance lookup
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol */
  symbol?: string;
  /** Token decimals (fetched from contract if not provided) */
  decimals?: number;
}

/**
 * Result from getEthereumTokenBalance including raw and token info
 */
export interface EthereumTokenBalanceResult {
  /** Token contract address */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Raw balance in smallest unit */
  balance: bigint;
  /** Human-readable formatted balance */
  formattedBalance: string;
  /** Whether the balance fetch was successful */
  success: boolean;
  /** Error message if fetch failed */
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** ETH token constants */
export const ETH_CONSTANTS = {
  DECIMALS: 18,
  SYMBOL: 'ETH',
  NAME: 'Ethereum',
  ADDRESS: '', // Native ETH has no contract address
  COINGECKO_ID: 'ethereum',
} as const;

/** Minimal ERC20 ABI for balance operations */
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
] as const;

/** Wei per ETH (bigint) */
export const WEI_PER_ETH_BIGINT = 1_000_000_000_000_000_000n;

// ============================================================================
// Native ETH Balance Functions
// ============================================================================

/**
 * Get native ETH balance for an address
 *
 * @param provider - Ethers.js provider
 * @param address - Wallet address to query
 * @returns ETH balance with raw and formatted values
 *
 * @example
 * ```typescript
 * const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/...');
 * const balance = await getEthBalance(provider, '0x...');
 * console.log(balance.formattedBalance); // '1.5'
 * console.log(balance.balance); // 1500000000000000000n
 * ```
 */
export async function getEthBalance(
  provider: Provider,
  address: string
): Promise<EthereumTokenBalance> {
  const balance = await provider.getBalance(address);

  return {
    address: ETH_CONSTANTS.ADDRESS,
    symbol: ETH_CONSTANTS.SYMBOL,
    decimals: ETH_CONSTANTS.DECIMALS,
    balance,
    formattedBalance: formatUnits(balance, ETH_CONSTANTS.DECIMALS),
  };
}

// ============================================================================
// ERC20 Token Balance Functions
// ============================================================================

/**
 * Get ERC20 token balance for an address
 *
 * Fetches the token balance using the balanceOf function.
 * If symbol or decimals are not provided, they are fetched from the contract.
 *
 * @param provider - Ethers.js provider
 * @param walletAddress - Wallet address to query
 * @param tokenAddress - ERC20 token contract address
 * @param tokenInfo - Optional token info (symbol, decimals)
 * @returns Token balance result with raw and formatted values
 *
 * @example
 * ```typescript
 * // With known token info
 * const balance = await getEthereumTokenBalance(
 *   provider,
 *   '0xWalletAddress...',
 *   '0xTokenAddress...',
 *   { symbol: 'USDC', decimals: 6 }
 * );
 *
 * // Without token info (fetches from contract)
 * const balance = await getEthereumTokenBalance(
 *   provider,
 *   '0xWalletAddress...',
 *   '0xTokenAddress...'
 * );
 * ```
 */
export async function getEthereumTokenBalance(
  provider: Provider,
  walletAddress: string,
  tokenAddress: string,
  tokenInfo?: Partial<TokenInfo>
): Promise<EthereumTokenBalanceResult> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    // Fetch balance and optionally symbol/decimals
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(walletAddress) as Promise<bigint>,
      tokenInfo?.decimals !== undefined
        ? Promise.resolve(tokenInfo.decimals)
        : (contract.decimals() as Promise<number>),
      tokenInfo?.symbol !== undefined
        ? Promise.resolve(tokenInfo.symbol)
        : (contract.symbol() as Promise<string>),
    ]);

    return {
      address: tokenAddress,
      symbol,
      decimals,
      balance,
      formattedBalance: formatUnits(balance, decimals),
      success: true,
    };
  } catch (error) {
    return {
      address: tokenAddress,
      symbol: tokenInfo?.symbol || 'UNKNOWN',
      decimals: tokenInfo?.decimals || 18,
      balance: 0n,
      formattedBalance: '0',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get multiple ERC20 token balances for an address
 *
 * Fetches balances for multiple tokens in parallel.
 * Failed fetches are included in the result with success: false.
 *
 * @param provider - Ethers.js provider
 * @param walletAddress - Wallet address to query
 * @param tokenAddresses - Array of token addresses or token info objects
 * @returns Array of token balance results
 *
 * @example
 * ```typescript
 * const balances = await getEthereumTokenBalances(
 *   provider,
 *   '0xWalletAddress...',
 *   [
 *     '0xUSDCAddress...',
 *     '0xDAIAddress...',
 *     { address: '0xWETHAddress...', symbol: 'WETH', decimals: 18 }
 *   ]
 * );
 * ```
 */
export async function getEthereumTokenBalances(
  provider: Provider,
  walletAddress: string,
  tokenAddresses: (string | TokenInfo)[]
): Promise<EthereumTokenBalanceResult[]> {
  const balancePromises = tokenAddresses.map((token) => {
    const address = typeof token === 'string' ? token : token.address;
    const tokenInfo = typeof token === 'string' ? undefined : token;

    return getEthereumTokenBalance(provider, walletAddress, address, tokenInfo);
  });

  return Promise.all(balancePromises);
}

// ============================================================================
// Combined Balance Functions
// ============================================================================

/**
 * Get complete wallet balance (ETH + tokens)
 *
 * Fetches native ETH balance and optionally ERC20 token balances.
 * Combines results into a unified wallet balance structure.
 *
 * @param provider - Ethers.js provider
 * @param walletAddress - Wallet address to query
 * @param tokenAddresses - Optional array of token addresses to query
 * @returns Complete wallet balance with native ETH and tokens
 *
 * @example
 * ```typescript
 * // Get ETH balance only
 * const balance = await getBalance(provider, '0xWalletAddress...');
 *
 * // Get ETH + specific tokens
 * const balance = await getBalance(
 *   provider,
 *   '0xWalletAddress...',
 *   ['0xUSDCAddress...', '0xDAIAddress...']
 * );
 * ```
 */
export async function getBalance(
  provider: Provider,
  walletAddress: string,
  tokenAddresses?: (string | TokenInfo)[]
): Promise<EthereumWalletBalance> {
  // Fetch ETH balance and token balances in parallel
  const [ethBalance, tokenBalances] = await Promise.all([
    getEthBalance(provider, walletAddress),
    tokenAddresses
      ? getEthereumTokenBalances(provider, walletAddress, tokenAddresses)
      : Promise.resolve([]),
  ]);

  // Convert successful token balances to EthereumTokenBalance format
  const tokens: EthereumTokenBalance[] = tokenBalances
    .filter((result) => result.success)
    .map((result) => ({
      address: result.address,
      symbol: result.symbol,
      decimals: result.decimals,
      balance: result.balance,
      formattedBalance: result.formattedBalance,
    }));

  return {
    native: ethBalance,
    tokens,
    // Note: totalUsd would require price service integration
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format balance for display with appropriate precision
 *
 * @param balance - Raw balance in smallest unit
 * @param decimals - Token decimals
 * @param displayDecimals - Number of decimals to show (default: 4)
 * @returns Formatted balance string
 */
export function formatBalanceDisplay(
  balance: bigint,
  decimals: number,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(balance, decimals);
  const numValue = parseFloat(formatted);

  if (numValue === 0) return '0';

  if (numValue < 0.0001) {
    return '<0.0001';
  }

  if (numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(2)}M`;
  }

  if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(2)}K`;
  }

  return numValue.toFixed(displayDecimals);
}

/**
 * Convert ETH to wei
 *
 * @param ethAmount - Amount in ETH
 * @returns Amount in wei as bigint
 */
export function ethToWei(ethAmount: number | string): bigint {
  const amountStr = typeof ethAmount === 'number' ? ethAmount.toString() : ethAmount;
  const [whole, fraction = ''] = amountStr.split('.');
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedFraction);
}

/**
 * Convert wei to ETH
 *
 * @param weiAmount - Amount in wei
 * @returns Amount in ETH as string
 */
export function weiToEth(weiAmount: bigint): string {
  return formatUnits(weiAmount, 18);
}

/**
 * Check if a balance is zero
 *
 * @param balance - Balance to check
 * @returns True if balance is zero
 */
export function isZeroBalance(balance: bigint): boolean {
  return balance === 0n;
}

/**
 * Compare two balances
 *
 * @param a - First balance
 * @param b - Second balance
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareBalances(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
