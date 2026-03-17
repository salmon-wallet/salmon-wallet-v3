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

import { getTokenMetadataByMints } from './tokens';
import { getPricesByPlatform, getSolanaTokenPrice } from './price';
import {
  decorateBalanceList,
  decorateBalancePrices,
  calculate24HoursChange,
  SOL_CONSTANTS,
  type RawTokenBalance,
  type TokenBalance,
  type WalletBalance,
} from '../../utils/balance';
import type { JupiterApiPriceData } from '../../types/price';

// Note: TokenMetadata is in types/token, TokenPrice is in api/services/price

// ============================================================================
// Price Fetching Functions
// ============================================================================

/**
 * Fetch real-time prices from Jupiter API for multiple Solana tokens
 * Returns both price and 24h change from Jupiter
 *
 * RATE LIMIT PROTECTION:
 * - Uses chunking strategy to prevent 429 errors
 * - Divides addresses into chunks of 5
 * - Processes chunks sequentially with 100ms delay between chunks
 * - Processes addresses within each chunk in parallel
 *
 * @param addresses - Array of token mint addresses
 * @param networkId - Network identifier
 * @returns Map of address -> { usdPrice, priceChange24h }
 */
export async function getJupiterPrices(
  addresses: string[],
  networkId: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet',
  hints?: Map<string, { coingeckoId?: string }>
): Promise<Map<string, JupiterApiPriceData>> {
  if (addresses.length === 0) {
    return new Map();
  }

  const CHUNK_SIZE = 5; // Max 5 concurrent requests to avoid rate limiting
  const CHUNK_DELAY_MS = 100; // 100ms delay between chunks
  const priceMap = new Map<string, JupiterApiPriceData>();

  // Resolve what we can from the cached platform price list first. This avoids
  // one backend request per token for common assets on cold wallet open.
  const platformPrices = await getPricesByPlatform('solana');
  const platformPriceLookup = new Map(
    (platformPrices || []).map((price) => [price.id.toLowerCase(), price])
  );

  const unresolvedAddresses = addresses.filter((address) => {
    const coingeckoId = hints?.get(address.toLowerCase())?.coingeckoId?.toLowerCase();
    const lookupKey = coingeckoId || address.toLowerCase();
    const cachedPrice = platformPriceLookup.get(lookupKey);

    if (!cachedPrice) {
      return true;
    }

    priceMap.set(address.toLowerCase(), {
      usdPrice: cachedPrice.usdPrice,
      priceChange24h: cachedPrice.perc24HoursChange,
    });

    return false;
  });

  if (unresolvedAddresses.length === 0) {
    return priceMap;
  }

  // Helper to process a chunk of addresses
  const processChunk = async (chunk: string[]) => {
    return Promise.all(
      chunk.map(async (address) => {
        const coingeckoId = hints?.get(address.toLowerCase())?.coingeckoId;
        const priceData = await getSolanaTokenPrice(address, networkId, coingeckoId);
        return { address, priceData };
      })
    );
  };

  // Split addresses into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < unresolvedAddresses.length; i += CHUNK_SIZE) {
    chunks.push(unresolvedAddresses.slice(i, i + CHUNK_SIZE));
  }

  // Process chunks sequentially with delay
  const allResults: Array<{ address: string; priceData: Awaited<ReturnType<typeof getSolanaTokenPrice>> }> = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkResults = await processChunk(chunks[i]);
    allResults.push(...chunkResults);

    // Add delay between chunks (except after last chunk)
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS));
    }
  }

  allResults.forEach((result) => {
    if (result.priceData !== null) {
      priceMap.set(result.address.toLowerCase(), result.priceData);
    }
  });

  return priceMap;
}


// ============================================================================
// Balance Retrieval Functions
// ============================================================================

/**
 * Get complete wallet balance with prices
 *
 * This function:
 * 1. Takes raw token balances (from getTokensByOwner)
 * 2. Fetches metadata for all tokens
 * 3. Fetches price data from Jupiter (real-time prices + 24h change)
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

  // Include SOL address for price fetching
  const allAddresses = [SOL_CONSTANTS.ADDRESS, ...mintAddresses];

  // Fetch metadata first (needed for price hints)
  const tokenMetadata = await getTokenMetadataByMints(mintAddresses, networkId);

  // Build hints map from metadata so CoinGecko fallback can use coingeckoId
  const hints = new Map<string, { coingeckoId?: string }>();
  tokenMetadata.forEach((m) => {
    if (m.coingeckoId) {
      hints.set(m.address.toLowerCase(), { coingeckoId: m.coingeckoId });
    }
  });

  // Fetch Jupiter prices with hints for CoinGecko fallback
  const jupiterPrices = await getJupiterPrices(allAddresses, networkId, hints);

  // Decorate balances with metadata
  const decoratedTokenBalances = decorateBalanceList(nonEmptyBalances, tokenMetadata);

  // Combine SOL and SPL tokens
  const allBalances = [solBalance, ...decoratedTokenBalances];

  // Decorate with prices from Jupiter (includes both price and 24h change)
  const balancesWithPrices = decorateBalancePrices(allBalances, null, jupiterPrices);

  if (jupiterPrices.size > 0) {
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
