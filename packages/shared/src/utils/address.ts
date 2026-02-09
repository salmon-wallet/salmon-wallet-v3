/**
 * Address utilities for formatting and displaying blockchain addresses
 */

/**
 * Truncates a blockchain address for display purposes.
 * Shows the first and last characters with ellipsis in between.
 *
 * @param address - The full blockchain address to truncate
 * @param chars - Number of characters to show at the start and end (default: 4)
 * @returns The truncated address string, or undefined if address is falsy
 *
 * @example
 * // Default behavior (4 chars)
 * getShortAddress("0x1234567890abcdef1234567890abcdef12345678")
 * // Returns: "0x12...5678"
 *
 * @example
 * // Custom character count
 * getShortAddress("0x1234567890abcdef1234567890abcdef12345678", 6)
 * // Returns: "0x1234...345678"
 *
 * @example
 * // Solana address
 * getShortAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
 * // Returns: "7xKX...sAsU"
 */
export const getShortAddress = (
  address: string | null | undefined,
  chars: number = 4
): string | undefined => {
  if (!address) {
    return undefined;
  }

  const start = address.slice(0, chars);
  const end = address.slice(-chars);

  return `${start}...${end}`;
};

export function truncateHash(hash: string, chars: number = 6): string {
  if (!hash || hash.length < chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
