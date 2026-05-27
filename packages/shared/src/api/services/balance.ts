/**
 * Balance Service
 *
 * Solana batch price lookup against the salmon-api batching endpoint.
 * Per-mint price + 24h change, with provider-side Jupiter chunking and
 * caching. Mints with no quote are absent from the response map.
 */

import { apiClient } from '../client';
import type { JupiterApiPriceData } from '../../types/price';

// ============================================================================
// Price Fetching Functions
// ============================================================================

type BatchPriceResponse = Record<
  string,
  { usdPrice: number; priceChange24h: number | null }
>;

/**
 * Fetch USD price + 24h change for multiple Solana mints in a single
 * backend round-trip via the batch pricing endpoint. The backend handles
 * Jupiter Price v3 batching, rate limiting, and per-mint caching; mints
 * Jupiter does not price are absent from the response map.
 *
 * @param addresses - Token mint addresses
 * @param networkId - Network identifier
 * @returns Map of lowercase address -> JupiterApiPriceData (absent on no quote)
 */
export async function getJupiterPrices(
  addresses: string[],
  networkId: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'
): Promise<Map<string, JupiterApiPriceData>> {
  const priceMap = new Map<string, JupiterApiPriceData>();
  if (addresses.length === 0) {
    return priceMap;
  }

  const unique = [...new Set(addresses)];

  try {
    const { data } = await apiClient.get<BatchPriceResponse>(
      `/v1/${networkId}/ft/price/batch`,
      { params: { mints: unique.join(',') } }
    );

    Object.entries(data || {}).forEach(([mint, quote]) => {
      if (quote && quote.usdPrice != null) {
        priceMap.set(mint.toLowerCase(), {
          usdPrice: quote.usdPrice,
          priceChange24h: quote.priceChange24h ?? null,
        });
      }
    });
  } catch (error) {
    console.warn('[balance] Batch price lookup failed:', error);
  }

  return priceMap;
}
