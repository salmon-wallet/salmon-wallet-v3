/**
 * Balance Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-balance-service.js
 *
 * Provides balance retrieval and decoration for Solana tokens.
 * Combines on-chain balance data with price data for portfolio calculation.
 *
 * This service:
 * - Fetches native SOL balance
 * - Fetches SPL token balances (both legacy and Token-2022)
 * - Decorates balances with token metadata
 * - Calculates USD values and portfolio totals
 * - Computes 24h price changes
 */

import { getTokenMetadataByMints, type TokenMetadata } from './tokens';
import { getPricesByPlatform, type TokenPrice } from './price';

// Re-export types used by decorators for use in tests
export type { TokenMetadata } from './tokens';
export type { TokenPrice } from './price';

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
  logo: string | null;
  /** Token address (same as mint) */
  address: string;
  /** CoinGecko ID for price lookups */
  coingeckoId?: string | null;
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

/**
 * Decorate raw balances with token metadata
 *
 * @param balances - Raw token balances
 * @param metadata - Token metadata array
 * @returns Decorated token balances
 */
export function decorateBalanceList(
  balances: RawTokenBalance[],
  metadata: TokenMetadata[]
): TokenBalance[] {
  // Create lookup map for O(1) access
  const metadataMap = new Map<string, TokenMetadata>();
  metadata.forEach((token) => {
    metadataMap.set(token.address.toLowerCase(), token);
  });

  return balances.map((balance) => {
    const tokenMetadata = metadataMap.get(balance.mint.toLowerCase());

    return {
      mint: balance.mint,
      owner: balance.owner,
      amount: balance.amount,
      decimals: balance.decimals,
      uiAmount: balance.uiAmount,
      symbol: tokenMetadata?.symbol || 'UNKNOWN',
      name: tokenMetadata?.name || 'Unknown Token',
      logo: tokenMetadata?.logo || null,
      address: balance.mint,
      coingeckoId: tokenMetadata?.coingeckoId,
      tags: tokenMetadata?.tags,
      program: balance.program,
      extensions: balance.extensions,
    };
  });
}

/**
 * Decorate balances with price information
 *
 * @param balances - Token balances with metadata
 * @param prices - Price data array
 * @returns Balances with price information
 */
export function decorateBalancePrices(
  balances: TokenBalance[],
  prices: TokenPrice[] | null
): TokenBalanceWithPrice[] {
  if (!prices) {
    return balances;
  }

  // Create lookup maps for price matching
  const priceBySymbol = new Map<string, TokenPrice>();
  const priceByCoingeckoId = new Map<string, TokenPrice>();

  prices.forEach((price) => {
    priceBySymbol.set(price.symbol.toLowerCase(), price);
    priceByCoingeckoId.set(price.id.toLowerCase(), price);
  });

  return balances.map((balance) => {
    // Try to find price by coingeckoId first, then by symbol
    let priceData: TokenPrice | undefined;

    if (balance.coingeckoId) {
      priceData = priceByCoingeckoId.get(balance.coingeckoId.toLowerCase());
    }

    if (!priceData) {
      priceData = priceBySymbol.get(balance.symbol.toLowerCase());
    }

    if (priceData) {
      const usdBalance = balance.uiAmount * priceData.usdPrice;
      return {
        ...balance,
        price: priceData.usdPrice,
        usdBalance,
        priceChange24h: priceData.perc24HoursChange ?? undefined,
      };
    }

    return balance;
  });
}

/**
 * Calculate 24h portfolio change
 *
 * @param balances - Balances with price info
 * @param currentTotal - Current total USD value
 * @returns 24h change amount and percentage
 */
export function calculate24HoursChange(
  balances: TokenBalanceWithPrice[],
  currentTotal: number
): { amount: number; percent: number } {
  if (!currentTotal || currentTotal === 0) {
    return { amount: 0, percent: 0 };
  }

  // Calculate previous total based on 24h price changes
  let previousTotal = 0;

  balances.forEach((balance) => {
    if (balance.usdBalance && balance.priceChange24h !== undefined) {
      // Calculate what the USD balance was 24h ago
      const priceChangeFactor = 1 + balance.priceChange24h / 100;
      const previousBalance = balance.usdBalance / priceChangeFactor;
      previousTotal += previousBalance;
    } else if (balance.usdBalance) {
      // No price change data, assume same value
      previousTotal += balance.usdBalance;
    }
  });

  if (previousTotal === 0) {
    return { amount: 0, percent: 0 };
  }

  const changeAmount = currentTotal - previousTotal;
  const changePercent = (changeAmount / previousTotal) * 100;

  return {
    amount: changeAmount,
    percent: changePercent,
  };
}

// ============================================================================
// Balance Retrieval Functions
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

/**
 * Get complete wallet balance with prices
 *
 * This function:
 * 1. Takes raw token balances (from getTokensByOwner)
 * 2. Fetches metadata for all tokens
 * 3. Fetches price data
 * 4. Combines and sorts by USD value
 * 5. Calculates totals and 24h changes
 *
 * @param solBalance - SOL balance object
 * @param tokenBalances - Raw SPL token balances
 * @param networkId - Network identifier
 * @returns Complete wallet balance with USD values
 */
export async function getWalletBalance(
  solBalance: TokenBalance,
  tokenBalances: RawTokenBalance[],
  networkId: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'
): Promise<WalletBalance> {
  // Filter out zero balances
  const nonEmptyBalances = tokenBalances.filter(
    (t) => t.amount && (typeof t.amount === 'string' ? parseInt(t.amount, 10) : t.amount) > 0
  );

  // Get mint addresses for metadata lookup
  const mintAddresses = nonEmptyBalances.map((t) => t.mint);

  // Fetch metadata and prices in parallel
  const [tokenMetadata, prices] = await Promise.all([
    getTokenMetadataByMints(mintAddresses, networkId),
    getPricesByPlatform('solana'),
  ]);

  // Decorate balances with metadata
  const decoratedTokenBalances = decorateBalanceList(nonEmptyBalances, tokenMetadata);

  // Combine SOL and SPL tokens
  const allBalances = [solBalance, ...decoratedTokenBalances];

  // Decorate with prices
  const balancesWithPrices = decorateBalancePrices(allBalances, prices);

  if (prices) {
    // Sort by USD balance (SOL always first)
    const sortedBalances = balancesWithPrices.sort((a, b) => {
      // SOL always first
      if (a.address === SOL_CONSTANTS.ADDRESS) return -1;
      if (b.address === SOL_CONSTANTS.ADDRESS) return 1;
      // Then sort by USD balance descending
      return (b.usdBalance || 0) - (a.usdBalance || 0);
    });

    // Calculate totals
    const usdTotal = sortedBalances.reduce((sum, balance) => sum + (balance.usdBalance || 0), 0);

    // Calculate 24h change
    const { amount: last24HoursChange, percent: last24HoursChangePercent } = calculate24HoursChange(
      sortedBalances,
      usdTotal
    );

    return {
      usdTotal,
      last24HoursChange,
      last24HoursChangePercent,
      items: sortedBalances,
    };
  }

  // No price data available
  return { items: balancesWithPrices };
}

/**
 * Format balance for display
 *
 * @param amount - Balance amount
 * @param decimals - Number of decimal places to show
 * @returns Formatted balance string
 */
export function formatBalance(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0';

  if (amount < 0.0001) {
    return '<0.0001';
  }

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }

  return amount.toFixed(decimals);
}

/**
 * Format USD value for display
 *
 * @param amount - USD amount
 * @returns Formatted USD string
 */
export function formatUsdValue(amount: number | undefined): string {
  if (amount === undefined || amount === null) {
    return '-';
  }

  if (amount === 0) {
    return '$0.00';
  }

  if (amount < 0.01) {
    return '<$0.01';
  }

  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }

  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}K`;
  }

  return `$${amount.toFixed(2)}`;
}

/**
 * Format percentage change
 *
 * @param percent - Percentage value
 * @returns Formatted percentage string with sign
 */
export function formatPercentChange(percent: number | undefined): string {
  if (percent === undefined || percent === null) {
    return '-';
  }

  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}
