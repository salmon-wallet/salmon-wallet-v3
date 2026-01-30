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
import axios from 'axios';

import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getStashItem,
  setStashItem,
  removeStashItem,
  updateLastActivity,
} from '../storage';
import { lock, unlock, type LockedVault } from '../crypto/encryption';
import {
  SolanaAccount,
  createSolanaAccount,
  type SolanaNetwork,
  SOLANA_NETWORKS,
} from '../blockchain/solana';
import { getApiUrl } from '../api/config';
import { getPathIndex } from '../utils';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents the path indexes for each network in an account.
 * Key is the network ID (e.g., 'solana-mainnet'), value is an array of account indexes.
 */
export type NetworkPathIndexes = Record<string, (number | null)[]>;

/**
 * Represents the network accounts (blockchain account instances) for each network.
 * Key is the network ID, value is an array of SolanaAccount instances.
 */
export type NetworksAccounts = Record<string, (SolanaAccount | null)[]>;

/**
 * Serializable account data for storage.
 * Contains only the data needed to reconstruct accounts (no instances).
 */
export interface StoredAccount {
  /** Unique identifier for the account */
  id: string;
  /** User-defined name for the account */
  name: string;
  /** Avatar identifier */
  avatar: string;
  /** Path indexes by network ID */
  pathIndexes: NetworkPathIndexes;
}

/**
 * Full account with loaded blockchain account instances.
 */
export interface Account extends StoredAccount {
  /** The mnemonic phrase for this account */
  mnemonic: string;
  /** Loaded blockchain account instances by network */
  networksAccounts: NetworksAccounts;
}

/**
 * Trusted app metadata.
 */
export interface TrustedApp {
  /** App display name */
  name?: string;
  /** App icon URL */
  icon?: string;
}

/**
 * Trusted apps indexed by domain, grouped by network.
 */
export type TrustedApps = Record<string, Record<string, TrustedApp>>;

/**
 * Custom token metadata (without address as key).
 */
export interface TokenInfo {
  /** Token symbol */
  symbol?: string;
  /** Token name */
  name?: string;
  /** Token decimals */
  decimals?: number;
  /** Logo URI */
  logoURI?: string;
}

/**
 * Custom tokens indexed by address, grouped by network.
 */
export type CustomTokens = Record<string, Record<string, TokenInfo>>;

/**
 * Token to import with address.
 */
export interface TokenToImport extends TokenInfo {
  /** Token mint address */
  address: string;
}

/**
 * Active connection info for external apps.
 */
export interface ConnectionInfo {
  /** Blockchain type */
  blockchain: string;
  /** Network environment */
  environment: string;
  /** Connected address */
  address: string;
}

/**
 * Parameters for editing an account.
 */
export interface EditAccountParams {
  /** New name for the account */
  name?: string;
  /** New avatar for the account */
  avatar?: string;
  /** New derived accounts to add */
  newDerivedAccounts?: SolanaAccount[];
}

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
  /** The currently active blockchain account */
  activeBlockchainAccount: SolanaAccount | undefined;
  /** Trusted apps for the current network */
  activeTrustedApps: Record<string, TrustedApp>;
  /** Custom tokens for the current network */
  activeTokens: Record<string, TokenInfo>;
  /** Whether the current account is whitelisted */
  whitelisted: boolean;
}

/**
 * Actions returned by useAccounts hook.
 */
export interface UseAccountsActions {
  /** Check if a password is valid */
  checkPassword: (password: string) => Promise<boolean>;
  /** Lock accounts (require password to unlock) */
  lockAccounts: () => Promise<void>;
  /** Unlock accounts with password */
  unlockAccounts: (password: string) => Promise<boolean>;
  /** Change the active account */
  changeAccount: (targetId: string) => Promise<void>;
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
  addTrustedApp: (domain: string, app?: TrustedApp) => Promise<void>;
  /** Remove a trusted app */
  removeTrustedApp: (domain: string) => Promise<void>;
  /** Import custom tokens */
  importTokens: (targetNetworkId: string, tokenList?: TokenToImport[]) => Promise<void>;
}

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Storage keys for account-related data.
 */
const STORAGE_KEYS = {
  COUNTER: 'salmon_account_counter',
  ACCOUNTS: 'salmon_accounts',
  MNEMONICS: 'salmon_mnemonics',
  ACCOUNT_ID: 'salmon_active_account_id',
  NETWORK_ID: 'salmon_active_network_id',
  PATH_INDEX: 'salmon_active_path_index',
  TRUSTED_APPS: 'salmon_trusted_apps',
  TOKENS: 'salmon_custom_tokens',
  CONNECTION: 'salmon_connection',
  // Legacy keys for migration
  WALLETS: 'salmon_wallets',
  ACTIVE: 'salmon_active',
  ENDPOINTS: 'salmon_endpoints',
} as const;

/**
 * Stash keys for session data.
 */
const STASH_KEYS = {
  PASSWORD: 'password',
  ACTIVE_AT: 'active_at',
} as const;

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

  const getPathIndexes = (networkAccounts: (SolanaAccount | null)[]): (number | null)[] => {
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
 * Inverts an object's key-value pairs, grouping keys by their values.
 * Used for grouping addresses by mnemonic during migration.
 */
function invertBy<T extends Record<string, string>>(obj: T): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!result[value]) {
      result[value] = [];
    }
    result[value].push(key);
  }
  return result;
}

/**
 * Gets available networks configuration.
 * In v3, we focus on Solana networks.
 */
async function getNetworks(): Promise<SolanaNetwork[]> {
  return Object.values(SOLANA_NETWORKS).map((network) => ({
    ...network,
    blockchain: 'SOLANA',
    environment: network.id,
  })) as unknown as SolanaNetwork[];
}

// ============================================================================
// Account Factory
// ============================================================================

/**
 * Options for creating an account.
 */
interface CreateAccountOptions {
  name?: string;
  avatar?: string;
  mnemonic: string;
  pathIndexes?: NetworkPathIndexes;
}

/**
 * Creates a new account with the given options.
 */
async function createAccount(options: CreateAccountOptions): Promise<Account> {
  const { name, avatar, mnemonic, pathIndexes = {} } = options;

  const id = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const networksAccounts: NetworksAccounts = {};

  // Default to Solana mainnet if no path indexes provided
  const defaultPathIndexes = Object.keys(pathIndexes).length > 0
    ? pathIndexes
    : { 'mainnet-beta': [0] };

  // Create blockchain accounts for each network and path index
  for (const [networkId, indexes] of Object.entries(defaultPathIndexes)) {
    const network = SOLANA_NETWORKS[networkId];
    if (!network) continue;

    networksAccounts[networkId] = [];

    for (const index of indexes) {
      if (index === null) {
        networksAccounts[networkId].push(null);
        continue;
      }

      const solanaAccount = await createSolanaAccount({
        network,
        mnemonic,
        index,
      });

      // Ensure the array is large enough
      while (networksAccounts[networkId].length <= index) {
        networksAccounts[networkId].push(null);
      }
      networksAccounts[networkId][index] = solanaAccount;
    }
  }

  return {
    id,
    name: name ?? `Account ${id.slice(-4)}`,
    avatar: avatar ?? 'default',
    mnemonic,
    pathIndexes: defaultPathIndexes,
    networksAccounts,
  };
}

/**
 * Creates multiple accounts from stored data.
 */
async function createManyAccounts(
  data: Array<StoredAccount & { mnemonic: string }>
): Promise<Account[]> {
  const accounts: Account[] = [];

  for (const item of data) {
    const account = await createAccount({
      mnemonic: item.mnemonic,
      pathIndexes: item.pathIndexes,
    });

    // Override with stored values
    (account as Account).id = item.id;
    account.name = item.name;
    account.avatar = item.avatar;

    accounts.push(account);
  }

  return accounts;
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
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [requiredLock, setRequiredLock] = useState(false);
  const [counter, setCounter] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [trustedApps, setTrustedApps] = useState<TrustedApps>({});
  const [tokens, setTokens] = useState<CustomTokens>({});
  const [whitelisted, setWhitelisted] = useState(false);

  // --------------------------------------------------------------------------
  // Legacy Migration (v2 -> v3)
  // --------------------------------------------------------------------------

  const runUpgrades = useCallback(async (password?: string): Promise<boolean> => {
    interface LegacyWallets {
      passwordRequired?: boolean;
      wallets: Array<{
        address: string;
        path: string;
        chain: string;
        mnemonic?: string;
      }>;
      mnemonics?: StoredMnemonics;
      lastNumber?: number;
      config?: Record<string, {
        name?: string;
        avatar?: string;
        trustedApps?: Record<string, TrustedApp>;
        tokens?: Record<string, TokenInfo>;
      }>;
    }

    const storedWallets = await getStorageItem<LegacyWallets>(STORAGE_KEYS.WALLETS);
    if (!storedWallets) return true;

    // Handle password-protected wallets
    if (storedWallets.passwordRequired) {
      if (!password) {
        setLocked(true);
        return false;
      }

      if (!('mnemonics' in storedWallets) || !storedWallets.mnemonics) {
        // Migrate from old format where mnemonic was in wallet
        const decryptedWallets = await unlock<typeof storedWallets.wallets>(
          storedWallets.wallets as unknown as LockedVault,
          password
        );
        storedWallets.wallets = decryptedWallets;
        storedWallets.mnemonics = storedWallets.wallets.reduce(
          (m, wallet) => {
            if (wallet.mnemonic) {
              m[wallet.address] = wallet.mnemonic;
              delete wallet.mnemonic;
            }
            return m;
          },
          {} as Record<string, string>
        );
      } else {
        // New format with separate mnemonics
        storedWallets.mnemonics = await unlock<Record<string, string>>(
          storedWallets.mnemonics as unknown as LockedVault,
          password
        );
      }
    } else if (!('mnemonics' in storedWallets) || !storedWallets.mnemonics) {
      // Unprotected wallet, migrate mnemonics
      storedWallets.mnemonics = storedWallets.wallets.reduce(
        (m, wallet) => {
          if (wallet.mnemonic) {
            m[wallet.address] = wallet.mnemonic;
            delete wallet.mnemonic;
          }
          return m;
        },
        {} as Record<string, string>
      );
    }

    const storedIndex = await getStorageItem<number>(STORAGE_KEYS.ACTIVE);
    const activeWallet = storedWallets.wallets[storedIndex ?? 0];
    const storedEndpoints = await getStorageItem<Record<string, string>>(STORAGE_KEYS.ENDPOINTS);

    let newCounter = storedWallets.lastNumber ?? 0;
    const newAccounts: Account[] = [];
    let newMnemonics: Record<string, string> = {};
    let newAccountId: string | undefined;
    let newNetworkId: string | undefined;
    let newPathIndex: number | undefined;
    const newTrustedApps: TrustedApps = {};
    const newTokens: CustomTokens = {};

    const networks = await getNetworks();
    const mnemonicsObj = storedWallets.mnemonics as Record<string, string>;
    const grouped = invertBy(mnemonicsObj);

    for (const [mnemonic, addresses] of Object.entries(grouped)) {
      let name: string | undefined;
      let avatar: string | undefined;
      const pathIndexes: NetworkPathIndexes = {};

      for (const address of addresses) {
        const config = storedWallets.config?.[address];

        if (!name && config?.name) name = config.name;
        if (!avatar && config?.avatar) avatar = config.avatar;

        const wallet = storedWallets.wallets.find((w) => w.address === address);
        if (!wallet) continue;

        const { path, chain } = wallet;
        const network = networks.find(
          (n) => (n as unknown as { blockchain: string }).blockchain?.toUpperCase() === chain.toUpperCase()
        );

        if (!network) continue;

        const index = getPathIndex(path);
        if (index === undefined) continue;

        if (!pathIndexes[network.id]) {
          pathIndexes[network.id] = [];
        }
        pathIndexes[network.id].push(index);

        // Migrate trusted apps
        if (config?.trustedApps) {
          if (newTrustedApps[network.id]) {
            Object.assign(newTrustedApps[network.id], config.trustedApps);
          } else {
            newTrustedApps[network.id] = { ...config.trustedApps };
          }
        }

        // Migrate tokens
        if (config?.tokens) {
          if (newTokens[network.id]) {
            Object.assign(newTokens[network.id], config.tokens);
          } else {
            newTokens[network.id] = { ...config.tokens };
          }
        }
      }

      const account = await createAccount({
        name,
        avatar,
        mnemonic,
        pathIndexes,
      });

      newAccounts.push(account);
      newMnemonics[account.id] = mnemonic;

      // Find current account based on active wallet
      const current = Object.values(account.networksAccounts)
        .flat()
        .find((blockchainAccount) => {
          if (!blockchainAccount) return false;
          const { path, network } = blockchainAccount;
          const address = blockchainAccount.getReceiveAddress();
          return (
            path === activeWallet?.path &&
            address === activeWallet?.address &&
            network.id === storedEndpoints?.[(network as unknown as { blockchain: string }).blockchain?.toUpperCase()]
          );
        });

      if (current) {
        newAccountId = account.id;
        newNetworkId = current.network.id;
        newPathIndex = getPathIndex(current.path);
      }
    }

    // Set defaults if not found
    if (!newAccountId || !newNetworkId || newPathIndex === undefined) {
      const firstAccount = newAccounts[0];
      if (firstAccount) {
        newAccountId = firstAccount.id;
        const availableNetworks = Object.keys(firstAccount.pathIndexes);
        newNetworkId = availableNetworks.includes('mainnet-beta')
          ? 'mainnet-beta'
          : availableNetworks[0];
        newPathIndex = firstAccount.pathIndexes[newNetworkId]?.find(
          (n): n is number => typeof n === 'number'
        ) ?? 0;
      }
    }

    // Encrypt mnemonics if password required
    if (storedWallets.passwordRequired && password) {
      const lockedMnemonics = await lock(newMnemonics, password);
      await setStorageItem(STORAGE_KEYS.MNEMONICS, { ...lockedMnemonics, isEncrypted: true });
    } else {
      await setStorageItem(STORAGE_KEYS.MNEMONICS, newMnemonics);
    }

    // Save migrated data
    await setStorageItem(STORAGE_KEYS.COUNTER, newCounter);
    await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));
    await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, newAccountId);
    await setStorageItem(STORAGE_KEYS.NETWORK_ID, newNetworkId);
    await setStorageItem(STORAGE_KEYS.PATH_INDEX, newPathIndex);
    await setStorageItem(STORAGE_KEYS.TRUSTED_APPS, newTrustedApps);
    await setStorageItem(STORAGE_KEYS.TOKENS, newTokens);

    // Remove legacy storage
    await removeStorageItem(STORAGE_KEYS.WALLETS);
    await removeStorageItem(STORAGE_KEYS.ACTIVE);
    await removeStorageItem(STORAGE_KEYS.ENDPOINTS);

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

    const loadedAccounts = await createManyAccounts(data);
    setAccounts(loadedAccounts);

    const storedAccountId = await getStorageItem<string>(STORAGE_KEYS.ACCOUNT_ID);
    const storedNetworkId = await getStorageItem<string>(STORAGE_KEYS.NETWORK_ID);

    // Default to Solana mainnet if no network stored
    let defaultNetworkId = storedNetworkId;
    if (!defaultNetworkId && loadedAccounts.length > 0) {
      const firstAccount = loadedAccounts[0];
      const availableNetworks = Object.keys(firstAccount.networksAccounts);
      defaultNetworkId = availableNetworks.includes('mainnet-beta')
        ? 'mainnet-beta'
        : availableNetworks[0];
    }

    setAccountId(storedAccountId ?? null);
    setNetworkId(defaultNetworkId ?? null);
    setPathIndex((await getStorageItem<number>(STORAGE_KEYS.PATH_INDEX)) ?? 0);
    setTrustedApps((await getStorageItem<TrustedApps>(STORAGE_KEYS.TRUSTED_APPS)) ?? {});
    setTokens((await getStorageItem<CustomTokens>(STORAGE_KEYS.TOKENS)) ?? {});

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
      await unlock<Record<string, string>>(storedMnemonics, password);
      return true;
    } catch {
      return false;
    }
  }, []);

  const lockAccounts = useCallback(async (): Promise<void> => {
    setLocked(true);
    await removeStashItem(STASH_KEYS.PASSWORD);
  }, []);

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
          mnemonics = await unlock<Record<string, string>>(storedMnemonics, password);
        } else {
          mnemonics = storedMnemonics;
        }

        if (!loaded) {
          await load(mnemonics);
        }
        setLocked(false);

        await setStashItem(STASH_KEYS.PASSWORD, password);

        return true;
      } catch (error) {
        console.warn('Failed to unlock accounts:', error);
        return false;
      }
    },
    [runUpgrades, loaded, load]
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
            setLocked(true);
          }
        }
      } else if (upgraded) {
        setLoaded(true);
      }

      setReady(true);
    };

    init();
  }, [runUpgrades, unlockAccounts, load]);

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

  const activeBlockchainAccount = useMemo((): SolanaAccount | undefined => {
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
      if (activeBlockchainAccount) {
        const { network } = activeBlockchainAccount;
        const connectionInfo: ConnectionInfo = {
          blockchain: 'SOLANA',
          environment: network.id,
          address: activeBlockchainAccount.getReceiveAddress(),
        };
        await setStorageItem(STORAGE_KEYS.CONNECTION, connectionInfo);
      } else {
        await removeStorageItem(STORAGE_KEYS.CONNECTION);
      }
    };

    updateConnection();
  }, [activeBlockchainAccount]);

  // --------------------------------------------------------------------------
  // Whitelist Check Effect
  // --------------------------------------------------------------------------

  useEffect(() => {
    const checkWhitelist = async (): Promise<void> => {
      setWhitelisted(false);
      if (!activeBlockchainAccount || !networkId) return;

      try {
        const address = activeBlockchainAccount.getReceiveAddress();
        const apiUrl = getApiUrl();
        const url = `${apiUrl}/v1/${networkId}/account/${address}/info`;
        const { data } = await axios.get(url);
        if (data?.whitelisted) {
          setWhitelisted(true);
        }
      } catch {
        // Silently handle - not all accounts are whitelisted
      }
    };

    checkWhitelist();
  }, [activeBlockchainAccount, networkId]);

  // --------------------------------------------------------------------------
  // Account Actions
  // --------------------------------------------------------------------------

  const changeAccount = useCallback(
    async (targetId: string): Promise<void> => {
      if (accountId === targetId) return;

      const account = findAccount(targetId);
      if (!account || !networkId) return;

      setAccountId(targetId);
      setPathIndex(getDefaultPathIndex(account, networkId));

      await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, targetId);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);
    },
    [accountId, networkId, findAccount]
  );

  const changeNetwork = useCallback(
    async (targetId: string): Promise<void> => {
      if (networkId === targetId || !activeAccount) return;

      const { networksAccounts } = activeAccount;
      if (!Object.keys(networksAccounts).includes(targetId)) return;

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
        (availableNetworks.includes('mainnet-beta')
          ? 'mainnet-beta'
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

      if (password) {
        const lockedMnemonics = await lock(newMnemonics, password);
        await setStorageItem(STORAGE_KEYS.MNEMONICS, { ...lockedMnemonics, isEncrypted: true });
        await setStashItem(STASH_KEYS.PASSWORD, password);
      } else {
        await setStorageItem(STORAGE_KEYS.MNEMONICS, newMnemonics);
      }

      await setStorageItem(STORAGE_KEYS.COUNTER, newCounter);
      await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));
      await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, newAccountId);
      await setStorageItem(STORAGE_KEYS.NETWORK_ID, newNetworkId);
      await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);

      setRequiredLock(!!password);
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
    await removeStorageItem(STORAGE_KEYS.TOKENS);
    await removeStorageItem(STORAGE_KEYS.CONNECTION);

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
        if (account && networkId) {
          setAccountId(account.id);
          setPathIndex(getDefaultPathIndex(account, networkId));

          await setStorageItem(STORAGE_KEYS.ACCOUNT_ID, account.id);
          await setStorageItem(STORAGE_KEYS.PATH_INDEX, 0);
        }
      }

      await setStorageItem(STORAGE_KEYS.ACCOUNTS, newAccounts.map(formatAccountForStorage));

      if (password) {
        setRequiredLock(true);
        const lockedMnemonics = await lock(newMnemonics, password);
        await setStorageItem(STORAGE_KEYS.MNEMONICS, { ...lockedMnemonics, isEncrypted: true });
        await setStashItem(STASH_KEYS.PASSWORD, password);
      } else {
        setRequiredLock(false);
        await setStorageItem(STORAGE_KEYS.MNEMONICS, newMnemonics);
      }
    },
    [accounts, accountId, networkId, removeAllAccounts]
  );

  // --------------------------------------------------------------------------
  // Trusted Apps Actions
  // --------------------------------------------------------------------------

  const addTrustedApp = useCallback(
    async (domain: string, { name, icon }: TrustedApp = {}): Promise<void> => {
      if (!networkId) return;

      const newTrustedApps = { ...trustedApps };
      merge(newTrustedApps, { [networkId]: { [domain]: { name, icon } } });
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
      await setStorageItem(STORAGE_KEYS.TOKENS, newTokens);
      setTokens(newTokens);
    },
    [tokens]
  );

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
    whitelisted,
  };

  const actions: UseAccountsActions = {
    checkPassword,
    lockAccounts,
    unlockAccounts,
    changeAccount,
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
  };

  return [state, actions];
}

export default useAccounts;
