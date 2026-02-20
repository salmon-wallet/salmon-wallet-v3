/**
 * Exchange Rates Service
 *
 * Fetches fiat exchange rates from the backend for multi-currency display.
 * Implements a 15-minute in-memory cache. On failure, falls back to USD-only
 * so the app degrades gracefully.
 *
 * @module api/services/exchangeRates
 */

import { apiClient } from '../client';
import type { ExchangeRates } from '../../types/currency';

// ============================================================================
// In-memory cache
// ============================================================================

interface RateCache {
  data: ExchangeRates;
  timestamp: number;
}

let rateCache: RateCache | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// Fallback
// ============================================================================

const FALLBACK_RATES: ExchangeRates = {
  base: 'usd',
  timestamp: 0,
  rates: { usd: 1 } as ExchangeRates['rates'],
};

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Fetch exchange rates from the backend.
 * Returns cached data if still fresh (15 min TTL).
 * On failure, returns fallback with usd=1 only.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Return cached if fresh
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL_MS) {
    return rateCache.data;
  }

  try {
    const { data } = await apiClient.get<ExchangeRates>('/v1/exchange-rates');

    if (data?.rates) {
      rateCache = { data, timestamp: Date.now() };
      return data;
    }

    return FALLBACK_RATES;
  } catch (error) {
    console.error('[ExchangeRatesService] Failed to fetch rates:', error);
    return FALLBACK_RATES;
  }
}

/**
 * Clear the exchange rate cache, forcing a fresh fetch on next call.
 */
export function clearExchangeRateCache(): void {
  rateCache = null;
}
