/**
 * Swap utility functions.
 *
 * Extracted from useMultiChainTokens.ts.
 *
 * @module utils/swap
 */

import type { UnifiedToken } from '../types/token';

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
