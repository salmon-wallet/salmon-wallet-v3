/**
 * Account utilities for wallet derivation path handling.
 */

/**
 * Extracts the account index from a BIP44 derivation path.
 *
 * BIP44 paths follow the format: m / purpose' / coin_type' / account' / change / address_index
 * For Solana (coin type 501): m/44'/501'/account'/0'
 *
 * @param path - The BIP44 derivation path string (e.g., "m/44'/501'/0'/0'")
 * @returns The account index as a number, or undefined if the path is invalid
 *
 * @example
 * // Returns 0
 * getPathIndex("m/44'/501'/0'/0'")
 *
 * @example
 * // Returns 5
 * getPathIndex("m/44'/501'/5'/0'")
 *
 * @example
 * // Returns undefined for invalid paths
 * getPathIndex("invalid-path")
 */
export function getPathIndex(path: string): number | undefined {
  const index = Number(path?.split('/')?.[3]?.replace("'", ''));
  return !isNaN(index) ? index : undefined;
}
