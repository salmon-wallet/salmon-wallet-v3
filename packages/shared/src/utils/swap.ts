/**
 * Swap utility functions.
 *
 * Extracted from useMultiChainTokens.ts.
 *
 * @module utils/swap
 */

import type { TokenMetadata, UnifiedToken } from '../types/token';
import type { SwapToken, SwapChainType } from '../types/swap';

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
 * Supported chains in the wallet.
 * Used to filter out bridge tokens from unsupported chains (e.g. NEAR).
 */
export const SUPPORTED_CHAINS: readonly SwapChainType[] = ['solana', 'bitcoin', 'ethereum'];

/**
 * Infers a SwapChainType from a network name string and/or token symbol.
 *
 * StealthEX returns `network: null` for mainnet tokens (BTC, ETH, NEAR),
 * so we also check the symbol to correctly identify the chain.
 * Returns null for tokens on unsupported chains.
 */
export function getChainFromNetwork(network?: string | null, symbol?: string): SwapChainType | null {
  // Try symbol first — StealthEX mainnet tokens have network: null
  if (symbol) {
    const s = symbol.toLowerCase();
    if (s === 'btc') return 'bitcoin';
    if (s === 'eth') return 'ethereum';
    if (s === 'sol') return 'solana';
    // ethbase → Ethereum on Base network
    if (s.startsWith('eth')) return 'ethereum';
  }

  if (!network) return symbol ? null : 'solana';

  const n = network.toLowerCase();
  if (n.includes('btc') || n.includes('bitcoin')) return 'bitcoin';
  if (n.includes('eth') || n.includes('ethereum') || n === 'base') return 'ethereum';
  if (n.includes('sol') || n.includes('solana')) return 'solana';
  // bsc, mainnet (for tokens like nearbsc, near) → unsupported
  return null;
}

/**
 * Converts a TokenMetadata to a SwapToken.
 * Defaults to solana-mainnet since search results are Solana tokens.
 */
export function mapToSwapToken(token: TokenMetadata, balance?: number, usdPrice?: number): SwapToken {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: token.logo || undefined,
    balance: balance || 0,
    usdPrice: usdPrice,
    chain: 'solana',
    networkId: 'solana-mainnet',
  };
}

/**
 * Converts a UnifiedToken to a SwapToken.
 */
export function unifiedToSwapToken(token: UnifiedToken): SwapToken {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logo: token.logo,
    balance: token.balance,
    usdPrice: token.usdPrice,
    chain: token.chain as SwapChainType,
    networkId: token.networkId,
  };
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
