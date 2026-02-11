/**
 * Decimal & Unit Conversion Utilities
 *
 * Generic helpers for converting between human-readable amounts
 * and raw blockchain units (lamports, wei, satoshis, etc.).
 */

import { parseUnits, formatUnits } from 'ethers';

// ============================================================================
// Constants
// ============================================================================

/** Satoshis per BTC */
export const SATOSHIS_PER_BTC = 100_000_000;

/** Wei per ETH (bigint) */
export const WEI_PER_ETH_BIGINT = 1_000_000_000_000_000_000n;

// ============================================================================
// Generic Conversion Functions
// ============================================================================

/**
 * Applies decimals to convert human-readable amount to raw amount
 *
 * @param amount - Human-readable amount
 * @param decimals - Number of decimal places
 * @returns Raw amount in smallest unit
 */
export function applyDecimals(amount: number, decimals: number): number {
  return Math.round(parseFloat(amount.toString()) * 10 ** decimals);
}

/**
 * Converts raw amount to human-readable amount
 *
 * @param amount - Raw amount in smallest unit
 * @param decimals - Number of decimal places
 * @returns Human-readable amount
 */
export function removeDecimals(amount: number | bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

/**
 * Parses a human-readable amount to smallest unit as bigint
 *
 * @param amount - Human-readable amount (e.g., '1.5')
 * @param decimals - Token decimals
 * @returns Amount in smallest unit
 */
export function parseAmount(amount: string | number, decimals: number): bigint {
  return parseUnits(amount.toString(), decimals);
}

// ============================================================================
// ETH-specific Conversion Functions
// ============================================================================

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

// ============================================================================
// BTC-specific Conversion Functions
// ============================================================================

/**
 * Converts BTC to satoshis
 *
 * @param btc - Amount in BTC
 * @returns Amount in satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.floor(btc * SATOSHIS_PER_BTC);
}

/**
 * Converts satoshis to BTC
 *
 * @param satoshis - Amount in satoshis
 * @returns Amount in BTC
 */
export function satoshisToBtc(satoshis: number): number {
  return satoshis / SATOSHIS_PER_BTC;
}
