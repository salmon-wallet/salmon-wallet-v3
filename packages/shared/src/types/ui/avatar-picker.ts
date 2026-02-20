/**
 * Avatar Picker - Platform-agnostic base types
 *
 * Used by both mobile (AvatarPicker) and extension (AvatarPicker) components.
 */

import type { Account } from '../account';

/**
 * Simplified NFT item for avatar selection (image-only subset of NftDataBase).
 */
export interface NftAvatarItem {
  /** NFT mint address (unique key) */
  mint: string;
  /** Display name */
  name: string;
  /** Image URL */
  image?: string;
}

/**
 * Base props shared between mobile and extension AvatarPicker components.
 */
export interface AvatarPickerPropsBase {
  /** Currently active avatar URL */
  currentAvatarUrl?: string;
  /** Active account (used for fetching NFTs) */
  account: Account;
  /** Called when user saves a new avatar URL */
  onSave: (url: string) => void;
  /** Called when user navigates back */
  onBack: () => void;
}
