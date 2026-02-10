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
import { getSolanaTokenPrice } from './price';
import {
  decorateBalanceList,
  decorateBalancePrices,
  calculate24HoursChange,
  SOL_CONSTANTS,
  type RawTokenBalance,
  type TokenBalance,
  type WalletBalance,
  type JupiterPriceData,
} from '../../utils/balance';

// Re-export types used by decorators for use in tests
export type { TokenMetadata } from './tokens';
export type { TokenPrice } from './price';

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
 * @returns Map of address -> { price, priceChange24h }
 */
async function getJupiterPrices(
  addresses: string[],
  networkId: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'
): Promise<Map<string, JupiterPriceData>> {
  if (addresses.length === 0) {
    return new Map();
  }

  const CHUNK_SIZE = 5; // Max 5 concurrent requests to avoid rate limiting
  const CHUNK_DELAY_MS = 100; // 100ms delay between chunks

  // Helper to process a chunk of addresses
  const processChunk = async (chunk: string[]) => {
    return Promise.all(
      chunk.map(async (address) => {
        const priceData = await getSolanaTokenPrice(address, networkId);
        return { address, priceData };
      })
    );
  };

  // Split addresses into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
    chunks.push(addresses.slice(i, i + CHUNK_SIZE));
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

  // Create price map
  const priceMap = new Map<string, JupiterPriceData>();
  allResults.forEach((result) => {
    if (result.priceData !== null) {
      priceMap.set(result.address.toLowerCase(), {
        price: result.priceData.usdPrice,
        priceChange24h: result.priceData.priceChange24h,
      });
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

  // Fetch metadata and Jupiter prices in parallel
  // Jupiter provides both real-time prices AND 24h change data
  const [tokenMetadata, jupiterPrices] = await Promise.all([
    getTokenMetadataByMints(mintAddresses, networkId),
    getJupiterPrices(allAddresses, networkId),
  ]);

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
