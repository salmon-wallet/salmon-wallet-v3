import {
  lock,
  lockAndGetKey,
  lockWithKey,
  isKeyCacheValid,
  type LockedVault,
  type DerivedKeyCache,
} from './encryption';
import { getStashItem, setStashItem, STASH_KEYS } from '../storage';

export interface EncryptMnemonicsResult {
  vault: (LockedVault & { isEncrypted: true }) | Record<string, string>;
  requiredLock: boolean;
}

export interface EncryptMnemonicsOptions {
  /**
   * When true and no cached derived key exists, uses `lockAndGetKey` to derive
   * a fresh key and caches it in stash for subsequent operations.
   * When false, uses plain `lock` without caching the derived key.
   *
   * Typical usage:
   * - `true` when adding an account (caches key for future operations)
   * - `false` when removing an account (just re-encrypts what remains)
   *
   * @default true
   */
  cacheNewKey?: boolean;
}

/**
 * Encrypts a mnemonics record following the wallet's encryption decision tree.
 *
 * When a password is provided:
 * 1. Checks for a cached derived key in stash and reuses it if valid.
 * 2. Otherwise derives a new key (caching it if `cacheNewKey` is true) or
 *    uses plain `lock`.
 * 3. Always stores the password in stash.
 *
 * When no password is provided:
 * 1. Checks for a cached derived key and uses it if valid.
 * 2. Falls back to a stashed password.
 * 3. Returns plaintext mnemonics if no encryption material is available.
 */
export async function encryptMnemonics(
  mnemonics: Record<string, string>,
  password?: string,
  options?: EncryptMnemonicsOptions,
): Promise<EncryptMnemonicsResult> {
  const cacheNewKey = options?.cacheNewKey ?? true;

  if (password) {
    const cachedKey = await getStashItem<DerivedKeyCache>(STASH_KEYS.DERIVED_KEY);

    let lockedMnemonics: LockedVault & { isEncrypted: true };
    if (isKeyCacheValid(cachedKey)) {
      const vault = lockWithKey(mnemonics, cachedKey);
      lockedMnemonics = { ...vault, isEncrypted: true as const };
    } else if (cacheNewKey) {
      const { vault, keyCache } = await lockAndGetKey(mnemonics, password);
      lockedMnemonics = { ...vault, isEncrypted: true as const };
      await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);
    } else {
      const vault = await lock(mnemonics, password);
      lockedMnemonics = { ...vault, isEncrypted: true as const };
    }

    await setStashItem(STASH_KEYS.PASSWORD, password);
    return { vault: lockedMnemonics, requiredLock: true };
  }

  // No explicit password — re-encrypt if wallet was previously encrypted
  const cachedKey = await getStashItem<DerivedKeyCache>(STASH_KEYS.DERIVED_KEY);
  if (isKeyCacheValid(cachedKey)) {
    const vault = lockWithKey(mnemonics, cachedKey);
    return { vault: { ...vault, isEncrypted: true as const }, requiredLock: true };
  }

  const stashedPassword = await getStashItem<string>(STASH_KEYS.PASSWORD);
  if (stashedPassword) {
    const vault = await lock(mnemonics, stashedPassword);
    return { vault: { ...vault, isEncrypted: true as const }, requiredLock: true };
  }

  return { vault: mnemonics, requiredLock: false };
}
