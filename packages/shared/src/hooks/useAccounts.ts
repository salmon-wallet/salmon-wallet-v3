/**
 * useAccounts hook for managing wallet accounts across the application.
 *
 * This hook provides comprehensive account management functionality including:
 * - Loading and persisting accounts from/to storage
 * - Password-based encryption/decryption of mnemonics
 * - Account switching and network management
 * - Trusted apps and custom token management
 *
 * @module hooks/useAccounts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import mapValues from 'lodash-es/mapValues';
import merge from 'lodash-es/merge';
import omit from 'lodash-es/omit';

import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getStashItem,
  setStashItem,
  removeStashItem,
  updateLastActivity,
  STORAGE_KEYS,
  STASH_KEYS,
} from '../storage';
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
import { encryptMnemonics } from '../crypto/encrypt-mnemonics';
import { clearSeedCache } from '../crypto/mnemonic';
import { migrateLegacyWallets } from '../utils/legacy-migration';
import {
  getBlockchainFromNetworkId,
  generateAccountId,
  createBlockchainAccountForNetwork,
} from '../utils';
import { getRandomAvatar } from '../utils/avatar';
import type {
  BlockchainAccount,
} from '../types/blockchain';
import type {
  NetworksAccounts,
  StoredAccount,
  Account,
  EditAccountParams,
  ConnectionInfo,
  RestoreAccountOptions,
} from '../types/account';
import type { TrustedApp, TrustedApps } from '../types/trusted-app';
import type { TokenInfo, CustomTokens, TokenToImport } from '../types/token';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * State returned by useAccounts hook.
 */
export interface UseAccountsState {
  /** Whether the hook has completed initialization */
  ready: boolean;
  /** Whether accounts are locked (password required) */
  locked: boolean;
  /** Whether password protection is enabled */
  requiredLock: boolean;
  /** Counter for generating unique account IDs */
  counter: number;
  /** All loaded accounts */
  accounts: Account[];
  /** Currently selected account ID */
  accountId: string | null;
  /** Currently selected network ID */
  networkId: string | null;
  /** Currently selected path index */
  pathIndex: number;
  /** The currently active account */
  activeAccount: Account | undefined;
  /** The currently active blockchain account (can be Solana, Bitcoin, or Ethereum) */
  activeBlockchainAccount: BlockchainAccount | undefined;
  /** Trusted apps for the current network */
  activeTrustedApps: Record<string, TrustedApp>;
  /** Custom tokens for the current network */
  activeTokens: Record<string, TokenInfo>;
  /** Whether a network switch is in progress (shows skeletons) */
  switchingNetwork: boolean;
  /** Last error from an account operation, null when no error */
  error: string | null;
  /** Whether an error is present (derived from error !== null) */
  isError: boolean;
}

/**
 * Actions returned by useAccounts hook.
 */
export interface UseAccountsActions {
  /** Check if a password is valid */
  checkPassword: (password: string) => Promise<boolean>;
  /** Change the wallet password (re-encrypts all stored mnemonics) */
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  /** Lock accounts (require password to unlock) */
  lockAccounts: () => Promise<void>;
  /** Unlock accounts with password */
  unlockAccounts: (password: string) => Promise<boolean>;
  /** Unlock accounts with a cached derived key (for biometric unlock) */
  unlockWithCachedKey: (keyCache: DerivedKeyCache) => Promise<boolean>;
  /** Change the active account */
  changeAccount: (targetId: string) => Promise<void>;
  /** Clear the network switching flag */
  clearSwitchingNetwork: () => void;
  /** Change the active network */
  changeNetwork: (targetId: string) => Promise<void>;
  /** Switch to a different network (alias for changeNetwork) */
  switchNetwork: (networkId: string) => Promise<void>;
  /** Get the current network ID */
  getNetworkId: () => string | null;
  /** Change the active path index */
  changePathIndex: (targetIndex: number) => Promise<void>;
  /** Add a new account */
  addAccount: (account: Account, password?: string) => Promise<void>;
  /** Edit an existing account */
  editAccount: (targetId: string, params: EditAccountParams) => Promise<void>;
  /** Remove an account */
  removeAccount: (targetId: string, password?: string) => Promise<void>;
  /** Remove all accounts */
  removeAllAccounts: () => Promise<void>;
  /** Add a trusted app */
  addTrustedApp: (domain: string, app?: TrustedApp, targetNetworkId?: string) => Promise<void>;
  /** Remove a trusted app */
  removeTrustedApp: (domain: string) => Promise<void>;
  /** Import custom tokens */
  importTokens: (targetNetworkId: string, tokenList?: TokenToImport[]) => Promise<void>;
  /** Clear the current error */
  resetError: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the default path index for an account on a given network.
 */
function getDefaultPathIndex(account: Account, networkId: string): number {
  return account.networksAccounts[networkId]?.findIndex(Boolean) ?? 0;
}

/**
 * Formats an account for storage (removes non-serializable data).
 */
function formatAccountForStorage(account: Account): StoredAccount {
  const { id, name, avatar, networksAccounts } = account;

  const getPathIndexes = (networkAccounts: (BlockchainAccount | null)[]): (number | null)[] => {
    return Object.keys(networkAccounts).map((index) => {
      return networkAccounts[Number(index)] ? parseInt(index, 10) : null;
    });
  };

  return {
    id,
    name,
    avatar,
    pathIndexes: mapValues(networksAccounts, getPathIndexes),
  };
}

/**
 * Creates a new account with the given options.
 * Supports creating accounts for Solana, Bitcoin, and Ethereum networks.
 */
async function restoreAccount(options: RestoreAccountOptions): Promise<Account> {
  const { name, avatar, mnemonic, pathIndexes = {} } = options;

  const id = generateAccountId();
  // Default to Solana mainnet if no path indexes provided
  const defaultPathIndexes = Object.keys(pathIndexes).length > 0
    ? pathIndexes
    : { 'solana-mainnet': [0] };

  const networksEntries = await Promise.all(
    Object.entries(defaultPathIndexes).map(async ([networkId, indexes]) => {
      const resolvedAccounts = await Promise.all(
        indexes.map(async (index) => {
          if (index === null) {
            return { index: null as null, account: null };
          }

          const account = await createBlockchainAccountForNetwork(
            networkId,
            mnemonic,
            index
          );

          return { index, account };
        })
      );

      const networkAccounts: NetworksAccounts[string] = [];

      resolvedAccounts.forEach(({ index, account }) => {
        if (index === null) {
          networkAccounts.push(null);
          return;
        }

        if (!account) {
          while (networkAccounts.length <= index) {
            networkAccounts.push(null);
          }
          return;
        }

        while (networkAccounts.length <= index) {
          networkAccounts.push(null);
        }
        networkAccounts[index] = account;
      });

      return [networkId, networkAccounts] as const;
    })
  );

  const networksAccounts = Object.fromEntries(networksEntries) as NetworksAccounts;

  return {
    id,
    name: name ?? `Account ${id.slice(-4)}`,
    avatar: avatar ?? getRandomAvatar(),
    mnemonic,
    pathIndexes: defaultPathIndexes,
    networksAccounts,
  };
}

/**
 * Creates multiple accounts from stored data.
 */
async function restoreManyAccounts(
  data: Array<StoredAccount & { mnemonic: string }>
): Promise<Account[]> {
  return Promise.all(
    data.map(async (item) => {
      const account = await restoreAccount({
        mnemonic: item.mnemonic,
        pathIndexes: item.pathIndexes,
      });

      // Override with stored values
      account.id = item.id;
      account.name = item.name;
      account.avatar = item.avatar;

      return account;
    })
  );
}

// ============================================================================
// Mnemonics Type
// ============================================================================

/**
 * Extended LockedVault with isEncrypted flag.
 * The isEncrypted flag differentiates from plain Record<string, string>.
 */
interface EncryptedMnemonics extends LockedVault {
  isEncrypted: true;
}

/**
 * Type for stored mnemonics - either plain object or encrypted vault.
 */
type StoredMnemonics = Record<string, string> | EncryptedMnemonics;

/**
 * Type guard to check if mnemonics are encrypted.
 */
function isEncryptedMnemonics(
  mnemonics: StoredMnemonics
): mnemonics is EncryptedMnemonics {
  return (
    typeof mnemonics === 'object' &&
    mnemonics !== null &&
    'isEncrypted' in mnemonics &&
    (mnemonics as EncryptedMnemonics).isEncrypted === true
  );
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing wallet accounts.
 *
 * Provides complete account lifecycle management including:
 * - Account creation, editing, and deletion
 * - Network and account switching
 * - Password-based encryption
 * - Trusted apps and custom tokens
 *
 * @returns A tuple of [state, actions]
 *
 * @example
 * ```tsx
 * function WalletComponent() {
 *   const [state, actions] = useAccounts();
 *
 *   if (!state.ready) return <Loading />;
 *   if (state.locked) return <UnlockScreen onUnlock={actions.unlockAccounts} />;
 *
 *   return (
 *     <div>
 *       <p>Active: {state.activeAccount?.name}</p>
 *       <p>Address: {state.activeBlockchainAccount?.getReceiveAddress()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccounts(): [UseAccountsState, UseAccountsActions] {
  const [ready, setReady] = useState(false);
  const [_loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [requiredLock, setRequiredLock] = useState(false);
  const [counter, setCounter] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [trustedApps, setTrustedApps] = useState<TrustedApps>({});
  const [tokens, setTokens] = useState<CustomTokens>({});
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Legacy Migration (v2 -> v3)
  // --------------------------------------------------------------------------

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

    // result.status === 'migrated'
    // State is set by the caller (init / unlockAccounts) after loading;
    // storage writes already happened inside migrateLegacyWallets.
    return true;
  }, []);

  // --------------------------------------------------------------------------
  // Update activity timestamp on mount
  // --------------------------------------------------------------------------

  useEffect(() => {
    updateLastActivity();
  }, []);

  // --------------------------------------------------------------------------
  // Account Loading
  // --------------------------------------------------------------------------

  /**
   * Loads account metadata without mnemonics (for locked state).
   * This allows the app to know accounts exist even when locked.
   */
  const loadMetadata = useCallback(async (): Promise<void> => {
    const storedAccounts = await getStorageItem<StoredAccount[]>(STORAGE_KEYS.ACCOUNTS);
    if (!storedAccounts) {
      setLoaded(true);
      return;
    }

    // Create minimal Account objects with empty mnemonics and no blockchain accounts
    const accountsWithMetadata: Account[] = storedAccounts.map((stored) => ({
      ...stored,
      mnemonic: '', // Empty mnemonic placeholder - will be populated on unlock
      networksAccounts: {}, // Empty networks - will be populated on unlock
    }));

    const storedCounter = await getStorageItem<number>(STORAGE_KEYS.COUNTER);
    setCounter(storedCounter ?? 0);

    setAccounts(accountsWithMetadata);

    const storedAccountId = await getStorageItem<string>(STORAGE_KEYS.ACCOUNT_ID);
    const storedNetworkId = await getStorageItem<string>(STORAGE_KEYS.NETWORK_ID);

    setAccountId(storedAccountId ?? null);
    setNetworkId(storedNetworkId ?? null);
    setPathIndex((await getStorageItem<number>(STORAGE_KEYS.PATH_INDEX)) ?? 0);
    setTrustedApps((await getStorageItem<TrustedApps>(STORAGE_KEYS.TRUSTED_APPS)) ?? {});
    setTokens((await getStorageItem<CustomTokens>(STORAGE_KEYS.CUSTOM_TOKENS)) ?? {});

    setLoaded(true);
  }, []);

  const load = useCallback(async (mnemonics: Record<string, string>): Promise<void> => {
    const storedAccounts = await getStorageItem<StoredAccount[]>(STORAGE_KEYS.ACCOUNTS);
    if (!storedAccounts) {
      setLoaded(true);
      return;
    }

    const data = storedAccounts.map((account) => ({
      ...account,
      mnemonic: mnemonics[account.id],
    }));

    const storedCounter = await getStorageItem<number>(STORAGE_KEYS.COUNTER);
    setCounter(storedCounter ?? 0);

    const loadedAccounts = await restoreManyAccounts(data);
    // Seed cache served its purpose — clear to minimise sensitive data in memory
    clearSeedCache();
    setAccounts(loadedAccounts);

    const storedAccountId = await getStorageItem<string>(STORAGE_KEYS.ACCOUNT_ID);
    const storedNetworkId = await getStorageItem<string>(STORAGE_KEYS.NETWORK_ID);

    // Default to Solana mainnet if no network stored
    let defaultNetworkId = storedNetworkId;
    if (!defaultNetworkId && loadedAccounts.length > 0) {
      const firstAccount = loadedAccounts[0];
      const availableNetworks = Object.keys(firstAccount.networksAccounts);
      defaultNetworkId = availableNetworks.includes('solana-mainnet')
        ? 'solana-mainnet'
        : availableNetworks[0];
    }

    setAccountId(storedAccountId ?? null);
    setNetworkId(defaultNetworkId ?? null);
    setPathIndex((await getStorageItem<number>(STORAGE_KEYS.PATH_INDEX)) ?? 0);
    setTrustedApps((await getStorageItem<TrustedApps>(STORAGE_KEYS.TRUSTED_APPS)) ?? {});
    setTokens((await getStorageItem<CustomTokens>(STORAGE_KEYS.CUSTOM_TOKENS)) ?? {});

    // Save default network if not stored
    if (!storedNetworkId && defaultNetworkId) {
      await setStorageItem(STORAGE_KEYS.NETWORK_ID, defaultNetworkId);
    }

    setLoaded(true);
  }, []);

  // --------------------------------------------------------------------------
  // Password Management
  // --------------------------------------------------------------------------

  const checkPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
      if (!storedMnemonics || !isEncryptedMnemonics(storedMnemonics)) {
        return true;
      }

      // Use unlockAndGetKey to cache the derived key for later reuse
      // This avoids a second expensive PBKDF2 derivation in addAccount/removeAccount
      const { keyCache } = await unlockAndGetKey<Record<string, string>>(
        storedMnemonics,
        password
      );

      // Cache the derived key in stash for reuse within this session
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

      // Decrypt with old password
      const { data: mnemonics } = await unlockAndGetKey<Record<string, string>>(
        storedMnemonics,
        oldPassword
      );

      // Re-encrypt with new password (fresh salt + PBKDF2 derivation)
      const newVault = await lock(mnemonics, newPassword);
      await setStorageItem(STORAGE_KEYS.MNEMONICS, newVault);

      // Update stash caches
      await setStashItem(STASH_KEYS.PASSWORD, newPassword);
      await removeStashItem(STASH_KEYS.DERIVED_KEY);

      return true;
    } catch {
      return false;
    }
  }, []);

  const lockAccounts = useCallback(async (): Promise<void> => {
    setLocked(true);
    await removeStashItem(STASH_KEYS.PASSWORD);
    // Clear cached derived key for security
    await removeStashItem(STASH_KEYS.DERIVED_KEY);
  }, []);

  const unlockAccounts = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const t0 = Date.now();
        await runUpgrades(password);
        console.log(`[perf] unlock: runUpgrades ${Date.now() - t0}ms`);

        const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
        if (!storedMnemonics) {
          setLocked(false);
          return true;
        }

        let mnemonics: Record<string, string>;
        if (isEncryptedMnemonics(storedMnemonics)) {
          const t1 = Date.now();
          // Use unlockAndGetKey to cache the derived key for later reuse
          const { data, keyCache } = await unlockAndGetKey<Record<string, string>>(
            storedMnemonics,
            password
          );
          console.log(`[perf] unlock: PBKDF2 decrypt ${Date.now() - t1}ms`);
          mnemonics = data;
          // Cache the derived key for subsequent operations
          await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);

          // Migrate vault to current encryption defaults if outdated
          // (e.g. sha256 → sha512, or iterations bump). One-time cost.
          if (
            storedMnemonics.digest !== DEFAULT_DIGEST ||
            storedMnemonics.iterations !== DEFAULT_ITERATIONS
          ) {
            console.log(`[perf] unlock: migrating vault from ${storedMnemonics.digest}/${storedMnemonics.iterations} to ${DEFAULT_DIGEST}/${DEFAULT_ITERATIONS}`);
            const t3 = Date.now();
            const { vault: newVault, keyCache: newKeyCache } = await lockAndGetKey(mnemonics, password);
            await setStorageItem(STORAGE_KEYS.MNEMONICS, { ...newVault, isEncrypted: true });
            await setStashItem(STASH_KEYS.DERIVED_KEY, newKeyCache);
            console.log(`[perf] unlock: vault migration ${Date.now() - t3}ms`);
          }
        } else {
          mnemonics = storedMnemonics;
        }

        // Always reload accounts with decrypted mnemonics on unlock.
        // Even if loadMetadata() was called (setting loaded=true), we need to
        // populate the actual blockchain account instances in networksAccounts.
        const t2 = Date.now();
        await load(mnemonics);
        console.log(`[perf] unlock: load (restore accounts) ${Date.now() - t2}ms`);
        console.log(`[perf] unlock: TOTAL ${Date.now() - t0}ms`);
        setLocked(false);
        await updateLastActivity();

        await setStashItem(STASH_KEYS.PASSWORD, password);

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to unlock accounts';
        console.warn('Failed to unlock accounts:', err);
        setError(msg);
        return false;
      }
    },
    [runUpgrades, load]
  );

  /**
   * Unlocks accounts using a cached derived key (for biometric unlock).
   * This avoids the expensive PBKDF2 key derivation by using a previously
   * cached key from a password unlock.
   *
   * @param keyCache - The cached derived key from a previous password unlock
   * @returns true if unlock succeeded, false otherwise
   */
  const unlockWithCachedKey = useCallback(
    async (keyCache: DerivedKeyCache): Promise<boolean> => {
      try {
        // Validate the key cache
        if (!isKeyCacheValid(keyCache)) {
          console.warn('Key cache is expired or invalid');
          return false;
        }

        const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
        if (!storedMnemonics) {
          setLocked(false);
          return true;
        }

        let mnemonics: Record<string, string>;
        if (isEncryptedMnemonics(storedMnemonics)) {
          // Use the cached key to decrypt (no PBKDF2 needed)
          mnemonics = unlockWithKey<Record<string, string>>(storedMnemonics, keyCache);
          // Cache the key for subsequent operations
          await setStashItem(STASH_KEYS.DERIVED_KEY, keyCache);
        } else {
          mnemonics = storedMnemonics;
        }

        // Always reload accounts with decrypted mnemonics on unlock.
        // Even if loadMetadata() was called (setting loaded=true), we need to
        // populate the actual blockchain account instances in networksAccounts.
        await load(mnemonics);
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
    [load]
  );

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  useEffect(() => {
    const init = async (): Promise<void> => {
      const upgraded = await runUpgrades();

      const storedMnemonics = await getStorageItem<StoredMnemonics>(STORAGE_KEYS.MNEMONICS);
      if (storedMnemonics) {
        if (!isEncryptedMnemonics(storedMnemonics)) {
          await load(storedMnemonics);
          setRequiredLock(false);
        } else {
          setRequiredLock(true);

          let result = false;
          const password = await getStashItem<string>(STASH_KEYS.PASSWORD);
          if (password) {
            result = await unlockAccounts(password);
          }
          if (!result) {
            // Load account metadata even when locked so the lock screen can display
            // This doesn't decrypt mnemonics - just loads account names, avatars, etc.
            await loadMetadata();
            setLocked(true);
          }
        }
      } else if (upgraded) {
        setLoaded(true);
      }

      setReady(true);
    };

    init().catch((err) => {
      const msg = err instanceof Error ? err.message : 'Account initialization failed';
      console.error('[useAccounts] init failed:', err);
      setError(msg);
      setReady(true);
    });
  }, [runUpgrades, unlockAccounts, load, loadMetadata]);

  // --------------------------------------------------------------------------
  // Computed Values
  // --------------------------------------------------------------------------

  const findAccount = useCallback(
    (targetId: string): Account | undefined => accounts.find(({ id }) => id === targetId),
    [accounts]
  );

  const activeAccount = useMemo(
    () => (accountId ? findAccount(accountId) : undefined),
    [findAccount, accountId]
  );

  const activeBlockchainAccount = useMemo((): BlockchainAccount | undefined => {
    if (!activeAccount || !networkId) return undefined;
    return activeAccount.networksAccounts[networkId]?.[pathIndex] ?? undefined;
  }, [activeAccount, networkId, pathIndex]);

  const activeTrustedApps = useMemo(
    (): Record<string, TrustedApp> => (networkId ? trustedApps[networkId] ?? {} : {}),
    [trustedApps, networkId]
  );

  const activeTokens = useMemo(
    (): Record<string, TokenInfo> => (networkId ? tokens[networkId] ?? {} : {}),
    [tokens, networkId]
  );

  // --------------------------------------------------------------------------
  // Connection Info Effect
  // --------------------------------------------------------------------------

  useEffect(() => {
    const updateConnection = async (): Promise<void> => {
      if (activeBlockchainAccount && networkId) {
        const { network } = activeBlockchainAccount;
        const blockchainType = getBlockchainFromNetworkId(networkId);
        const connectionInfo: ConnectionInfo = {
          blockchain: blockchainType.toUpperCase(),
          environment: network.id,
          address: activeBlockchainAccount.getReceiveAddress(),
        };
        await setStorageItem(STORAGE_KEYS.CONNECTION, connectionInfo);
      } else {
        await removeStorageItem(STORAGE_KEYS.CONNECTION);
      }
    };

    updateConnection();
  }, [activeBlockchainAccount, networkId]);

  // --------------------------------------------------------------------------
  // Account Actions
  // --------------------------------------------------------------------------

  const changeAccount = useCallback(
    async (targetId: string): Promise<void> => {
      if (accountId === targetId) return;

      const account = findAccount(targetId);
      if (!account) return;

      setSwitchingNetwork(true);
      setAccountId(targetId);
      setPathIndex(networkId ? getDefaultPathIndex(account, networkId) : 0);

      await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, targetId);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);
    },
    [accountId, networkId, findAccount]
  );

  const clearSwitchingNetwork = useCallback(() => setSwitchingNetwork(false), []);

  const changeNetwork = useCallback(
    async (targetId: string): Promise<void> => {
      if (networkId === targetId || !activeAccount) return;

      const { networksAccounts } = activeAccount;
      if (!Object.keys(networksAccounts).includes(targetId)) return;

      setSwitchingNetwork(true);

      const targetIndex = networksAccounts[targetId]?.[pathIndex]
        ? pathIndex
        : getDefaultPathIndex(activeAccount, targetId);

      setNetworkId(targetId);
      setPathIndex(targetIndex);

      await setStorageItem(STORAGE_KEYS.NETWORK_ID, targetId);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, targetIndex);
    },
    [networkId, pathIndex, activeAccount]
  );

  const switchNetwork = useCallback(
    async (targetNetworkId: string): Promise<void> => {
      await changeNetwork(targetNetworkId);
    },
    [changeNetwork]
  );

  const getNetworkId = useCallback((): string | null => {
    return networkId;
  }, [networkId]);

  const changePathIndex = useCallback(
    async (targetIndex: number): Promise<void> => {
      if (pathIndex === targetIndex || !activeAccount || !networkId) return;

      const blockchainAccounts = activeAccount.networksAccounts[networkId];
      if (!blockchainAccounts || targetIndex < 0 || targetIndex >= blockchainAccounts.length) {
        return;
      }

      setPathIndex(targetIndex);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, targetIndex);
    },
    [pathIndex, activeAccount, networkId]
  );

  const addAccount = useCallback(
    async (account: Account, password?: string): Promise<void> => {
      const newCounter = counter + 1;
      const newAccounts = [...accounts, account];
      const newAccountId = account.id;

      // Default to mainnet-beta
      const availableNetworks = Object.keys(account.networksAccounts);
      const newNetworkId =
        networkId ??
        (availableNetworks.includes('solana-mainnet')
          ? 'solana-mainnet'
          : availableNetworks[0]);

      const newMnemonics = newAccounts.reduce(
        (mnemonics, { id, mnemonic }) => {
          mnemonics[id] = mnemonic;
          return mnemonics;
        },
        {} as Record<string, string>
      );

      setCounter(newCounter);
      setAccounts(newAccounts);
      setAccountId(newAccountId);
      setNetworkId(newNetworkId);
      setPathIndex(getDefaultPathIndex(account, newNetworkId));

      const te0 = Date.now();
      const encryptResult = await encryptMnemonics(newMnemonics, password, { cacheNewKey: !!password });
      console.log(`[perf] addAccount: encryptMnemonics ${Date.now() - te0}ms`);
      await setStorageItem(STORAGE_KEYS.MNEMONICS, encryptResult.vault);
      if (password) {
        setRequiredLock(true);
      } else if (!encryptResult.requiredLock) {
        setRequiredLock(false);
      }

      await setStorageItem(STORAGE_KEYS.COUNTER, newCounter);
      await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));
      await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, newAccountId);
      await setStorageItem(STORAGE_KEYS.NETWORK_ID, newNetworkId);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);
    },
    [counter, accounts, networkId]
  );

  const editAccount = useCallback(
    async (targetId: string, { name, avatar, newDerivedAccounts }: EditAccountParams): Promise<void> => {
      const index = accounts.findIndex(({ id }) => id === targetId);
      if (index < 0) return;

      const newAccounts = [...accounts];
      const newAccount = { ...accounts[index] };

      if (name) newAccount.name = name;
      if (avatar) newAccount.avatar = avatar;

      if (newDerivedAccounts) {
        for (const derivedAccount of newDerivedAccounts) {
          const { network, index: accountIndex } = derivedAccount;
          if (!newAccount.networksAccounts[network.id]) {
            newAccount.networksAccounts[network.id] = [];
          }
          // Ensure array is large enough
          while (newAccount.networksAccounts[network.id].length <= accountIndex) {
            newAccount.networksAccounts[network.id].push(null);
          }
          newAccount.networksAccounts[network.id][accountIndex] = derivedAccount;
        }
      }

      newAccounts[index] = newAccount;
      setAccounts(newAccounts);
      await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));
    },
    [accounts]
  );

  const removeAllAccounts = useCallback(async (): Promise<void> => {
    await removeStorageItem(STORAGE_KEYS.COUNTER);
    await removeStorageItem(STORAGE_KEYS.ACCOUNTS);
    await removeStorageItem(STORAGE_KEYS.MNEMONICS);
    await removeStorageItem(STORAGE_KEYS.ACCOUNT_ID);
    await removeStorageItem(STORAGE_KEYS.NETWORK_ID);
    await removeStorageItem(STORAGE_KEYS.PATH_INDEX);
    await removeStorageItem(STORAGE_KEYS.TRUSTED_APPS);
    await removeStorageItem(STORAGE_KEYS.CUSTOM_TOKENS);
    await removeStorageItem(STORAGE_KEYS.CONNECTION);

    // Clear session data including cached key
    await removeStashItem(STASH_KEYS.PASSWORD);
    await removeStashItem(STASH_KEYS.DERIVED_KEY);

    setLocked(false);
    setRequiredLock(false);
    setCounter(0);
    setAccounts([]);
    setAccountId(null);
    setNetworkId(null);
    setPathIndex(0);
    setTrustedApps({});
    setTokens({});
  }, []);

  const removeAccount = useCallback(
    async (targetId: string, password?: string): Promise<void> => {
      const newAccounts = accounts.filter(({ id }) => id !== targetId);

      if (newAccounts.length === 0) {
        await removeAllAccounts();
        return;
      }

      setAccounts(newAccounts);

      const newMnemonics = newAccounts.reduce(
        (mnemonics, { id, mnemonic }) => {
          mnemonics[id] = mnemonic;
          return mnemonics;
        },
        {} as Record<string, string>
      );

      if (accountId === targetId) {
        const account = accounts.find(({ id }) => id !== targetId);
        if (account) {
          setAccountId(account.id);
          setPathIndex(networkId ? getDefaultPathIndex(account, networkId) : 0);

          await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, account.id);
          await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);
        }
      }

      await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));

      const encryptResult = await encryptMnemonics(newMnemonics, password, { cacheNewKey: false });
      await setStorageItem(STORAGE_KEYS.MNEMONICS, encryptResult.vault);
      if (password) {
        setRequiredLock(true);
      } else if (!encryptResult.requiredLock) {
        setRequiredLock(false);
      }
    },
    [accounts, accountId, networkId, removeAllAccounts]
  );

  // --------------------------------------------------------------------------
  // Trusted Apps Actions
  // --------------------------------------------------------------------------

  const addTrustedApp = useCallback(
    async (
      domain: string,
      { name, icon }: TrustedApp = {},
      targetNetworkId?: string,
    ): Promise<void> => {
      const resolvedNetworkId = targetNetworkId ?? networkId;
      if (!resolvedNetworkId) return;

      const newTrustedApps = { ...trustedApps };
      merge(newTrustedApps, { [resolvedNetworkId]: { [domain]: { name, icon } } });
      await setStorageItem(STORAGE_KEYS.TRUSTED_APPS, newTrustedApps);
      setTrustedApps(newTrustedApps);
    },
    [trustedApps, networkId]
  );

  const removeTrustedApp = useCallback(
    async (domain: string): Promise<void> => {
      if (!networkId) return;

      const newTrustedApps = { ...trustedApps };
      if (newTrustedApps[networkId]) {
        delete newTrustedApps[networkId][domain];
      }
      await setStorageItem(STORAGE_KEYS.TRUSTED_APPS, newTrustedApps);
      setTrustedApps(newTrustedApps);
    },
    [trustedApps, networkId]
  );

  // --------------------------------------------------------------------------
  // Token Import Action
  // --------------------------------------------------------------------------

  const importTokens = useCallback(
    async (targetNetworkId: string, tokenList: TokenToImport[] = []): Promise<void> => {
      const importedTokens = tokenList
        .filter(({ address }) => address)
        .reduce(
          (obj, token) => ({
            ...obj,
            [token.address]: omit(token, 'address'),
          }),
          {} as Record<string, TokenInfo>
        );

      const newTokens = { ...tokens };
      merge(newTokens, { [targetNetworkId]: importedTokens });
      await setStorageItem(STORAGE_KEYS.CUSTOM_TOKENS, newTokens);
      setTokens(newTokens);
    },
    [tokens]
  );

  const resetError = useCallback(() => setError(null), []);

  // --------------------------------------------------------------------------
  // Return State and Actions
  // --------------------------------------------------------------------------

  const state: UseAccountsState = {
    ready,
    locked,
    requiredLock,
    counter,
    accounts,
    accountId,
    networkId,
    pathIndex,
    activeAccount,
    activeBlockchainAccount,
    activeTrustedApps,
    activeTokens,
    switchingNetwork,
    error,
    isError: error !== null,
  };

  const actions: UseAccountsActions = {
    checkPassword,
    changePassword,
    lockAccounts,
    unlockAccounts,
    unlockWithCachedKey,
    changeAccount,
    clearSwitchingNetwork,
    changeNetwork,
    switchNetwork,
    getNetworkId,
    changePathIndex,
    addAccount,
    editAccount,
    removeAccount,
    removeAllAccounts,
    addTrustedApp,
    removeTrustedApp,
    importTokens,
    resetError,
  };

  return [state, actions];
}
