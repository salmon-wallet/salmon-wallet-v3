import type { TokenMetadata } from '../api/services/tokens';
import type { TokenPrice } from '../api/services/price';

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

/**
 * Jupiter price data with address and 24h change
 */
export interface JupiterPriceData {
  /** USD price */
  price: number;
  /** 24h price change percentage */
  priceChange24h: number | null;
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
 * Supports two modes:
 * 1. Solana mode (jupiterPrices provided): Uses Jupiter for both price and 24h change
 * 2. Legacy mode (jupiterPrices not provided): Uses batch prices for both price and 24h change
 *
 * @param balances - Token balances with metadata
 * @param prices - Array of TokenPrice from batch endpoint (for legacy Bitcoin/Ethereum support)
 * @param jupiterPrices - Optional map of address -> { price, priceChange24h } from Jupiter (Solana only)
 * @returns Balances with price information
 */
export function decorateBalancePrices(
  balances: TokenBalance[],
  prices: TokenPrice[] | null,
  jupiterPrices?: Map<string, JupiterPriceData> | null
): TokenBalanceWithPrice[] {
  // Solana mode: Use Jupiter for both price and 24h change
  if (jupiterPrices && jupiterPrices.size > 0) {
    return balances.map((balance) => {
      // Get price data from Jupiter (by address)
      const jupiterData = jupiterPrices.get(balance.address.toLowerCase());

      if (jupiterData !== undefined) {
        const usdBalance = balance.uiAmount * jupiterData.price;
        return {
          ...balance,
          price: jupiterData.price,
          usdBalance,
          priceChange24h: jupiterData.priceChange24h ?? undefined,
        };
      }

      return balance;
    });
  }

  // Legacy mode: Use batch prices for both price and 24h change (for Bitcoin/Ethereum)
  if (!prices) {
    return balances;
  }

  // Create lookup maps for price matching
  const priceBySymbol = new Map<string, TokenPrice>();
  const priceByCoingeckoId = new Map<string, TokenPrice>();

  prices.forEach((price) => {
    priceByCoingeckoId.set(price.id.toLowerCase(), price);
    if (price.symbol) {
      priceBySymbol.set(price.symbol.toLowerCase(), price);
    }
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
