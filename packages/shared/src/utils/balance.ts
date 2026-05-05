import type { JupiterApiPriceData } from '../types/price';

// ============================================================================
// Types
// ============================================================================

/**
 * Raw token balance from on-chain data
 */
export interface RawTokenBalance {
  /** Token mint address */
  mint: string;
  /** Owner wallet address */
  owner: string;
  /** Raw balance amount (in smallest unit) */
  amount: string | number;
  /** Token decimals */
  decimals: number;
  /** Human-readable balance */
  uiAmount: number;
  /** Token program ('spl-token' or 'spl-token-2022') */
  program?: string;
  /** Token-2022 extensions */
  extensions?: unknown[];
}

/**
 * Token balance with metadata
 */
export interface TokenBalance {
  /** Token mint address */
  mint: string;
  /** Owner wallet address */
  owner: string;
  /** Raw balance amount */
  amount: string | number;
  /** Token decimals */
  decimals: number;
  /** Human-readable balance */
  uiAmount: number;
  /** Token symbol (e.g., 'SOL', 'USDC') */
  symbol: string;
  /** Token name */
  name: string;
  /** Token logo URL */
  logo?: string;
  /** Token address (same as mint) */
  address: string;
  /** CoinGecko ID for price lookups */
  coingeckoId?: string;
  /** Token tags */
  tags?: string[];
  /** Token program */
  program?: string;
  /** Token-2022 extensions */
  extensions?: unknown[];
}

/**
 * Token balance with price information
 */
export interface TokenBalanceWithPrice extends TokenBalance {
  /** Current price in USD */
  price?: number;
  /** Balance value in USD */
  usdBalance?: number;
  /** 24h price change percentage */
  priceChange24h?: number;
}

/**
 * Complete wallet balance response
 */
export interface WalletBalance {
  /** Total USD value of all tokens */
  usdTotal?: number;
  /** 24h change in USD */
  last24HoursChange?: number;
  /** 24h change percentage */
  last24HoursChangePercent?: number;
  /** List of token balances */
  items: TokenBalanceWithPrice[];
}

/**
 * @deprecated Use JupiterApiPriceData from types/price instead.
 * Kept as alias for backward compatibility.
 */
export type JupiterPriceData = JupiterApiPriceData;

// ============================================================================
// Constants
// ============================================================================

/** SOL token constants */
export const SOL_CONSTANTS = {
  DECIMALS: 9,
  SYMBOL: 'SOL',
  NAME: 'Solana',
  LOGO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  ADDRESS: 'So11111111111111111111111111111111111111112',
  COINGECKO_ID: 'solana',
  TAGS: ['community', 'moonshot-verified', 'strict', 'verified', 'major'] as string[],
} as const;

/** USDC token address */
export const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/** Lamports per SOL */
export const LAMPORTS_PER_SOL = 1_000_000_000;

// ============================================================================
// Balance Decoration Functions
// ============================================================================

// ============================================================================
// Bigint Balance Helpers
// ============================================================================

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

// ============================================================================
// SOL Balance Factory
// ============================================================================

/**
 * Create SOL native balance object
 *
 * @param lamports - Balance in lamports
 * @param owner - Wallet address
 * @returns SOL balance object
 */
export function createSolBalance(lamports: number, owner: string): TokenBalance {
  const uiAmount = lamports / LAMPORTS_PER_SOL;

  return {
    mint: SOL_CONSTANTS.ADDRESS,
    owner,
    amount: lamports,
    decimals: SOL_CONSTANTS.DECIMALS,
    uiAmount,
    symbol: SOL_CONSTANTS.SYMBOL,
    name: SOL_CONSTANTS.NAME,
    logo: SOL_CONSTANTS.LOGO,
    address: SOL_CONSTANTS.ADDRESS,
    coingeckoId: SOL_CONSTANTS.COINGECKO_ID,
    tags: [...SOL_CONSTANTS.TAGS],
  };
}
