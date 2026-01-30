/**
 * Amount and Currency Formatting Utilities
 * Migrated from salmon-wallet-v2/src/utils/amount.js
 *
 * Provides formatting functions for displaying amounts, percentages,
 * and currency values in the UI.
 */

import round from 'lodash-es/round';
import isNil from 'lodash-es/isNil';

// ============================================================================
// Types
// ============================================================================

/**
 * Label type for percentage values
 */
export type LabelType = 'positive' | 'negative' | 'neutral';

/**
 * Currency information for formatting
 */
export interface Currency {
  /** Number of decimal places for the currency */
  decimals: number;
  /** Currency symbol (e.g., 'SOL', 'ETH', 'BTC') */
  symbol: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Placeholder string for hidden/masked values
 *
 * @example
 * ```typescript
 * const displayValue = isPrivacyMode ? hiddenValue : showAmount(100);
 * // isPrivacyMode=true  -> '·······'
 * // isPrivacyMode=false -> '$100.00'
 * ```
 */
export const hiddenValue = '·······';

// ============================================================================
// Amount Formatting Functions
// ============================================================================

/**
 * Formats a numeric amount with a specified number of decimals
 *
 * @param amount - The raw amount to format
 * @param decimals - Number of decimal places
 * @returns Formatted amount string
 *
 * @example
 * ```typescript
 * formatAmount(1234567890, 9)  // '1.23456789'
 * formatAmount(100000000, 8)   // '1'
 * formatAmount(50000000, 8)    // '0.5'
 * ```
 */
export function formatAmount(amount: number, decimals: number): string {
  const divisor = Math.pow(10, decimals);
  const result = amount / divisor;
  return result.toString();
}

/**
 * Formats an amount as a USD dollar value
 *
 * @param amount - The amount to format (can be null or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with dollar sign, or '-' if amount is nil
 *
 * @example
 * ```typescript
 * showAmount(100.567)      // '$100.57'
 * showAmount(100.567, 3)   // '$100.567'
 * showAmount(null)         // '-'
 * showAmount(undefined)    // '-'
 * showAmount(0)            // '$0.00'
 * ```
 */
export function showAmount(
  amount: number | null | undefined,
  decimals: number = 2
): string {
  return !isNil(amount) ? `$${round(amount, decimals).toFixed(decimals)}` : '-';
}

/**
 * Formats a numeric value with a specified number of decimals (without currency symbol)
 *
 * @param amount - The amount to format (can be null or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string, or '-' if amount is nil
 *
 * @example
 * ```typescript
 * showValue(100.567)       // '100.57'
 * showValue(100.567, 4)    // '100.5670'
 * showValue(null)          // '-'
 * showValue(undefined)     // '-'
 * showValue(0)             // '0.00'
 * ```
 */
export function showValue(
  amount: number | null | undefined,
  decimals: number = 2
): string {
  return !isNil(amount) ? `${round(amount, decimals).toFixed(decimals)}` : '-';
}

// ============================================================================
// Percentage Functions
// ============================================================================

/**
 * Checks if a percentage value is positive (greater than zero)
 *
 * @param perc - The percentage value to check
 * @returns True if the percentage is positive
 *
 * @example
 * ```typescript
 * isPositive(5.5)   // true
 * isPositive(0)     // false
 * isPositive(-3.2)  // false
 * ```
 */
export function isPositive(perc: number): boolean {
  return perc > 0;
}

/**
 * Checks if a percentage value is negative (less than zero)
 *
 * @param perc - The percentage value to check
 * @returns True if the percentage is negative
 *
 * @example
 * ```typescript
 * isNegative(-5.5)  // true
 * isNegative(0)     // false
 * isNegative(3.2)   // false
 * ```
 */
export function isNegative(perc: number): boolean {
  return perc < 0;
}

/**
 * Checks if a percentage value is neutral (zero or falsy)
 *
 * @param perc - The percentage value to check
 * @returns True if the percentage is neutral (zero, null, undefined, or NaN)
 *
 * @example
 * ```typescript
 * isNeutral(0)         // true
 * isNeutral(5)         // false
 * isNeutral(-5)        // false
 * isNeutral(NaN)       // true
 * isNeutral(undefined) // true (when called with undefined)
 * ```
 */
export function isNeutral(perc: number | null | undefined): boolean {
  return !perc;
}

/**
 * Returns a label type based on whether the percentage is positive, negative, or neutral
 *
 * @param perc - The percentage value to evaluate
 * @returns Label type: 'positive', 'negative', or 'neutral'
 *
 * @example
 * ```typescript
 * getLabelValue(5.5)   // 'positive'
 * getLabelValue(-3.2)  // 'negative'
 * getLabelValue(0)     // 'neutral'
 *
 * // Useful for applying conditional styles
 * const labelType = getLabelValue(priceChange);
 * // Use labelType to apply appropriate CSS class or color
 * ```
 */
export function getLabelValue(perc: number): LabelType {
  if (isPositive(perc)) {
    return 'positive';
  } else if (isNegative(perc)) {
    return 'negative';
  }
  return 'neutral';
}

/**
 * Formats a percentage value for display with sign and percentage symbol
 *
 * @param perc - The percentage value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with sign and % symbol
 *
 * @example
 * ```typescript
 * showPercentage(5.567)       // '+5.57 %'
 * showPercentage(-3.214)      // '-3.21 %'
 * showPercentage(0)           // '0.00 %'
 * showPercentage(5.567, 1)    // '+5.6 %'
 * showPercentage(NaN)         // '0.00 %'
 * ```
 */
export function showPercentage(perc: number, decimals: number = 2): string {
  const val = round(isNaN(perc) ? 0 : perc, decimals).toFixed(decimals);
  if (isPositive(perc)) {
    return `+${val} %`;
  } else if (isNegative(perc)) {
    return `${val} %`;
  }
  return `${val} %`;
}

// ============================================================================
// Currency Formatting Functions
// ============================================================================

/**
 * Formats an amount with its currency symbol
 *
 * @param amount - The raw amount to format (in smallest unit, e.g., lamports)
 * @param currency - Currency object containing decimals and symbol
 * @returns Formatted string with amount and currency symbol
 *
 * @example
 * ```typescript
 * const solana: Currency = { decimals: 9, symbol: 'SOL' };
 * formatCurrency(1500000000, solana)  // '1.5 SOL'
 *
 * const usdc: Currency = { decimals: 6, symbol: 'USDC' };
 * formatCurrency(1000000, usdc)       // '1 USDC'
 *
 * const btc: Currency = { decimals: 8, symbol: 'BTC' };
 * formatCurrency(100000000, btc)      // '1 BTC'
 * ```
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const { decimals, symbol } = currency;
  return `${formatAmount(amount, decimals)} ${symbol}`;
}
