/**
 * Swap utility functions.
 *
 * Extracted from useMultiChainTokens.ts.
 *
 * @module utils/swap
 */

import type { UnifiedToken } from '../types/token';
import type { SwapChainType } from '../types/swap';

/**
 * Determines if two tokens are on the same chain.
 */
export function isSameChain(tokenA: UnifiedToken, tokenB: UnifiedToken): boolean {
  return tokenA.chain === tokenB.chain;
}

/**
 * Determines the swap type based on input and output tokens.
 * Same-chain Solana swaps use Jupiter; everything else uses StealthEX.
 */
export function getSwapType(
  inToken: UnifiedToken,
  outToken: UnifiedToken
): 'jupiter' | 'stealthex' {
  if (inToken.chain === 'solana' && outToken.chain === 'solana') {
    return 'jupiter';
  }
  return 'stealthex';
}

/**
 * Null-safe wrapper around getSwapType for SwapScreen use.
 * Returns null when either token is missing or chain is unknown.
 */
export function getSwapMode(
  inToken: { chain?: SwapChainType } | null,
  outToken: { chain?: SwapChainType } | null
): 'jupiter' | 'stealthex' | null {
  if (!inToken || !outToken) return null;
  if (!inToken.chain || !outToken.chain) return null;
  if (inToken.chain === 'solana' && outToken.chain === 'solana') return 'jupiter';
  return 'stealthex';
}

/**
 * Infers a SwapChainType from a network name string (e.g. "btc", "ethereum").
 * Defaults to 'solana' for unknown networks.
 */
export function getChainFromNetwork(network?: string): SwapChainType {
  if (!network) return 'solana';
  const n = network.toLowerCase();
  if (n.includes('btc') || n.includes('bitcoin')) return 'bitcoin';
  if (n.includes('eth') || n.includes('ethereum')) return 'ethereum';
  if (n.includes('sol') || n.includes('solana')) return 'solana';
  return 'solana';
}

/**
 * Simple address validation based on chain type.
 * Returns { valid, error } for immediate UI feedback.
 */
export function validateAddress(
  address: string,
  chain: SwapChainType | null
): { valid: boolean; error: string | null } {
  if (!address || address.length === 0) {
    return { valid: false, error: null };
  }

  if (chain === 'solana') {
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Solana address' };
  }

  if (chain === 'ethereum') {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Ethereum address' };
  }

  if (chain === 'bitcoin') {
    const isValid = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    return { valid: isValid, error: isValid ? null : 'Invalid Bitcoin address' };
  }

  return { valid: address.length > 10, error: address.length <= 10 ? 'Address too short' : null };
}
