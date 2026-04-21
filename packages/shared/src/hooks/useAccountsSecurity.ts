import { useCallback, type Dispatch, type SetStateAction } from 'react';

import {
  lock,
  lockAndGetKey,
  unlockAndGetKey,
  unlockWithKey,
  isKeyCacheValid,
  DEFAULT_ITERATIONS,
  DEFAULT_DIGEST,
  type LockedVault,
  type DerivedKeyCache,
} from '../crypto/encryption';
import {
  getStorageItem,
  getStashItem,
  removeStashItem,
  setStashItem,
  setStorageItem,
  updateLastActivity,
  STASH_KEYS,
  STORAGE_KEYS,
} from '../storage';
import { migrateLegacyWallets } from '../utils/legacy-migration';
import type { Account, StoredAccount } from '../types/account';

interface EncryptedMnemonics extends LockedVault {
  isEncrypted: true;
}

export type StoredMnemonics = Record<string, string> | EncryptedMnemonics;

export function isEncryptedMnemonics(
  mnemonics: StoredMnemonics
): mnemonics is EncryptedMnemonics {
  return (
    typeof mnemonics === 'object' &&
    mnemonics !== null &&
    'isEncrypted' in mnemonics &&
    (mnemonics as EncryptedMnemonics).isEncrypted === true
  );
}

interface UseAccountsSecurityParams {
  setLocked: Dispatch<SetStateAction<boolean>>;
  setRequiredLock: Dispatch<SetStateAction<boolean>>;
  setReady: Dispatch<SetStateAction<boolean>>;
  setLoaded: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  loadMetadata: () => Promise<void>;
  loadAccounts: (mnemonics: Record<string, string>) => Promise<void>;
  restoreAccount: (options: {
    name?: string;
    avatar?: string;
    mnemonic: string;
    pathIndexes?: Record<string, (number | null)[]>;
  }) => Promise<Account>;
  formatAccountForStorage: (account: Account) => StoredAccount;
}

interface UseAccountsSecurityResult {
  checkPassword: (password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  lockAccounts: () => Promise<void>;
  unlockAccounts: (password: string) => Promise<boolean>;
  unlockWithCachedKey: (keyCache: DerivedKeyCache) => Promise<boolean>;
  initAccounts: () => Promise<void>;
}

export function useAccountsSecurity({
  setLocked,
  setRequiredLock,
  setReady,
  setLoaded,
  setError,
  loadMetadata,
  loadAccounts,
  restoreAccount,
  formatAccountForStorage,
}: UseAccountsSecurityParams): UseAccountsSecurityResult {
  const runUpgrades = useCallback(async (password?: string): Promise<boolean> => {
    const result = await migrateLegacyWallets(
      { restoreAccount, formatAccountForStorage },
      password,
    );

    if (result.status === 'no-migration') return true;

    if (result.status === 'needs-password') {
      setLocked(true);
      return false;
    }

    return true;
  }, [formatAccountForStorage, restoreAccount, setLocked]);

  const checkPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
      if (!storedMnemonics || !isEncryptedMnemonics(storedMnemonics)) {
        return true;
      }

      const { keyCache } = await unlockAndGetKey<Record<string, string>>(
        storedMnemonics,
        password
      );

      await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);

      return true;
    } catch {
      return false;
    }
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
      if (!storedMnemonics || !isEncryptedMnemonics(storedMnemonics)) {
        return false;
      }

      const { data: mnemonics } = await unlockAndGetKey<Record<string, string>>(
        storedMnemonics,
        oldPassword
      );

      const newVault = await lock(mnemonics, newPassword);
      await setStorageItem(STORAGE_KEYS.MNEMONICS, newVault);
      await removeStashItem(STASH_KEYS.DERIVED_KEY);

      return true;
    } catch {
      return false;
    }
  }, []);

  const lockAccounts = useCallback(async (): Promise<void> => {
    setLocked(true);
    await removeStashItem(STASH_KEYS.DERIVED_KEY);
  }, [setLocked]);

  const unlockAccounts = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        await runUpgrades(password);

        const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
        if (!storedMnemonics) {
          setLocked(false);
          return true;
        }

        let mnemonics: Record<string, string>;
        if (isEncryptedMnemonics(storedMnemonics)) {
          const { data, keyCache } = await unlockAndGetKey<Record<string, string>>(
            storedMnemonics,
            password
          );
          mnemonics = data;
          await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);

          if (
            storedMnemonics.digest !== DEFAULT_DIGEST ||
            storedMnemonics.iterations !== DEFAULT_ITERATIONS
          ) {
            const { vault: newVault, keyCache: newKeyCache } = await lockAndGetKey(mnemonics, password);
            await setStorageItem(STORAGE_KEYS.MNEMONICS, { ...newVault, isEncrypted: true });
            await setStashItem(STASH_KEYS.DERIVED_KEY, newKeyCache);
          }
        } else {
          mnemonics = storedMnemonics;
        }

        await loadAccounts(mnemonics);
        setLocked(false);
        await updateLastActivity();

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to unlock accounts';
        console.warn('Failed to unlock accounts:', err);
        setError(msg);
        return false;
      }
    },
    [loadAccounts, runUpgrades, setError, setLocked]
  );

  const unlockWithCachedKey = useCallback(
    async (keyCache: DerivedKeyCache): Promise<boolean> => {
      try {
        if (!keyCache || !keyCache.key || !keyCache.salt) {
          console.warn('Key cache is invalid');
          return false;
        }

        const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
        if (!storedMnemonics) {
          setLocked(false);
          return true;
        }

        let mnemonics: Record<string, string>;
        if (isEncryptedMnemonics(storedMnemonics)) {
          mnemonics = unlockWithKey<Record<string, string>>(storedMnemonics, keyCache);
          await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);
        } else {
          mnemonics = storedMnemonics;
        }

        await loadAccounts(mnemonics);
        setLocked(false);
        await updateLastActivity();

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to unlock accounts';
        console.warn('Failed to unlock accounts with cached key:', err);
        setError(msg);
        return false;
      }
    },
    [loadAccounts, setError, setLocked]
  );

  const initAccounts = useCallback(async (): Promise<void> => {
    try {
      const upgraded = await runUpgrades();

      const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
      if (storedMnemonics) {
        if (!isEncryptedMnemonics(storedMnemonics)) {
          await loadAccounts(storedMnemonics);
          setRequiredLock(false);
        } else {
          setRequiredLock(true);

          let result = false;
          const cachedKey = await getStashItem<DerivedKeyCache>(STASH_KEYS.DERIVED_KEY);
          if (cachedKey && isKeyCacheValid(cachedKey)) {
            result = await unlockWithCachedKey(cachedKey);
          }
          if (!result) {
            await loadMetadata();
            setLocked(true);
          }
        }
      } else if (upgraded) {
        setLoaded(true);
      }

      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Account initialization failed';
      console.error('[useAccounts] init failed:', err);
      setError(msg);
      setReady(true);
    }
  }, [
    loadAccounts,
    loadMetadata,
    runUpgrades,
    setError,
    setLoaded,
    setLocked,
    setReady,
    setRequiredLock,
    unlockWithCachedKey,
  ]);

  return {
    checkPassword,
    changePassword,
    lockAccounts,
    unlockAccounts,
    unlockWithCachedKey,
    initAccounts,
  };
}
