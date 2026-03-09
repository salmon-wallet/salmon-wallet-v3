/**
 * Blockchain feature-flag configuration.
 *
 * Controls which blockchain families are active across the wallet.
 * Disabled blockchains will not have accounts created or networks scanned.
 *
 * To re-enable Ethereum, add 'ethereum' to the ENABLED_BLOCKCHAINS array.
 *
 * @module config/blockchains
 */

import type { BlockchainType } from '../types/blockchain';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Blockchains currently enabled in the wallet.
 *
 * This is the single source of truth for which blockchain families are active.
 * Account creation, derived-account scanning, and network visibility all
 * consult this array.
 *
 * To enable/disable a blockchain, add or remove it from this array.
 */
export const ENABLED_BLOCKCHAINS: readonly BlockchainType[] = [
  'solana',
  'bitcoin',
  // 'ethereum',
] as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determines the blockchain type from a network ID string.
 *
 * @param networkId - Network identifier (e.g., 'solana-mainnet', 'bitcoin-testnet', 'ethereum-sepolia')
 * @returns The blockchain type ('solana', 'bitcoin', or 'ethereum')
 */
export function getBlockchainFromNetworkId(networkId: string): BlockchainType {
  if (networkId.startsWith('bitcoin')) return 'bitcoin';
  if (networkId.startsWith('ethereum')) return 'ethereum';
  return 'solana';
}

/**
 * Returns true if the given blockchain family is enabled.
 *
 * @param chain - Blockchain type to check (e.g. 'solana', 'bitcoin', 'ethereum')
 */
export function isBlockchainEnabled(chain: BlockchainType): boolean {
  return ENABLED_BLOCKCHAINS.includes(chain);
}

/**
 * Returns true if the given network belongs to an enabled blockchain.
 *
 * Determines the blockchain family from the network ID prefix
 * (e.g. 'ethereum-mainnet' -> 'ethereum') and checks ENABLED_BLOCKCHAINS.
 *
 * @param networkId - Network identifier (e.g. 'solana-mainnet', 'ethereum-sepolia')
 */
export function isNetworkEnabled(networkId: string): boolean {
  const chain = getBlockchainFromNetworkId(networkId);
  return isBlockchainEnabled(chain);
}
