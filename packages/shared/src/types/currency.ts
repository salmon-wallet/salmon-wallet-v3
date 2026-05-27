/**
 * Currency types and constants for multi-currency display support.
 *
 * All internal data remains in USD. Conversion happens at display time
 * using exchange rates fetched from the backend.
 *
 * @module types/currency
 */

// ============================================================================
// Supported Currencies
// ============================================================================

/**
 * Supported fiat currencies (lowercase codes matching CoinGecko format)
 */
export const SUPPORTED_CURRENCIES = [
  'usd',
  'eur',
  'gbp',
  'jpy',
  'cny',
  'krw',
  'inr',
  'cad',
  'aud',
  'brl',
  'mxn',
  'chf',
  'sgd',
  'hkd',
  'try',
] as const;

/**
 * Union type of supported currency codes
 */
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Default currency when none is configured
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'usd';

// ============================================================================
// Currency Info
// ============================================================================

/**
 * Static info for a supported currency
 */
export interface CurrencyInfo {
  /** Lowercase currency code (e.g. 'usd') */
  code: CurrencyCode;
  /** Human-readable name (e.g. 'US Dollar') */
  name: string;
  /** Currency symbol (e.g. '$', '€', '¥') */
  symbol: string;
  /** Number of decimal places (0 for JPY/KRW, 2 for most others) */
  decimals: number;
}

/**
 * Static lookup map for all supported currencies
 */
export const CURRENCY_MAP: Record<CurrencyCode, CurrencyInfo> = {
  usd: { code: 'usd', name: 'US Dollar', symbol: '$', decimals: 2 },
  eur: { code: 'eur', name: 'Euro', symbol: '\u20AC', decimals: 2 },
  gbp: { code: 'gbp', name: 'British Pound', symbol: '\u00A3', decimals: 2 },
  jpy: { code: 'jpy', name: 'Japanese Yen', symbol: '\u00A5', decimals: 0 },
  cny: { code: 'cny', name: 'Chinese Yuan', symbol: '\u00A5', decimals: 2 },
  krw: { code: 'krw', name: 'South Korean Won', symbol: '\u20A9', decimals: 0 },
  inr: { code: 'inr', name: 'Indian Rupee', symbol: '\u20B9', decimals: 2 },
  cad: { code: 'cad', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  aud: { code: 'aud', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  brl: { code: 'brl', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  mxn: { code: 'mxn', name: 'Mexican Peso', symbol: 'MX$', decimals: 2 },
  chf: { code: 'chf', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  sgd: { code: 'sgd', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  hkd: { code: 'hkd', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  try: { code: 'try', name: 'Turkish Lira', symbol: '\u20BA', decimals: 2 },
};

// ============================================================================
// Exchange Rates
// ============================================================================

/**
 * Exchange rates response from the backend
 */
export interface ExchangeRates {
  /** Base currency (always 'usd') */
  base: 'usd';
  /** Unix timestamp of when rates were fetched */
  timestamp: number;
  /** Rate for each currency (usd is always 1) */
  rates: Record<CurrencyCode, number>;
}
