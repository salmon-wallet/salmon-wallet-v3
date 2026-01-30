/**
 * Avatar Utilities
 * Migrated from salmon-wallet-v2/src/adapter/services/avatar-service.js
 *
 * Provides avatar URL generation for wallet profiles.
 * Avatars are hosted on static.salmonwallet.io with 24 options (01-24).
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Base URL for avatar images
 */
const AVATAR_BASE_URL = 'https://static.salmonwallet.io/avatar';

/**
 * Total number of available avatar options
 */
const TOTAL_AVATARS = 24;

// ============================================================================
// Functions
// ============================================================================

/**
 * Gets the avatar URL for a specific index.
 *
 * @param index - The avatar index (will be zero-padded to 2 digits)
 * @returns The full URL to the avatar image
 *
 * @example
 * getAvatar(1)  // 'https://static.salmonwallet.io/avatar/01.png'
 * getAvatar(12) // 'https://static.salmonwallet.io/avatar/12.png'
 */
export function getAvatar(index: number): string {
  const paddedIndex = index.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  return `${AVATAR_BASE_URL}/${paddedIndex}.png`;
}

/**
 * Gets a random avatar URL from the available options (1-24).
 *
 * @returns The full URL to a randomly selected avatar image
 *
 * @example
 * getRandomAvatar() // 'https://static.salmonwallet.io/avatar/07.png' (random)
 */
export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * TOTAL_AVATARS) + 1;
  return getAvatar(randomIndex);
}
