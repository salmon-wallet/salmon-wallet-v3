import { useCallback, type Dispatch, type SetStateAction } from 'react';

import { encryptMnemonics } from '../crypto/encrypt-mnemonics';
import {
  removeStorageItem,
  removeStashItem,
  setStorageItem,
  STASH_KEYS,
  STORAGE_KEYS,
} from '../storage';
import type {
  Account,
  EditAccountParams,
  StoredAccount,
} from '../types/account';
import type { CustomTokens } from '../types/token';
import type { TrustedApps } from '../types/trusted-app';

interface UseAccountsMutationsParams {
  counter: number;
  setCounter: Dispatch<SetStateAction<number>>;
  accounts: Account[];
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  accountId: string | null;
  setAccountId: Dispatch<SetStateAction<string | null>>;
  networkId: string | null;
  setNetworkId: Dispatch<SetStateAction<string | null>>;
  setPathIndex: Dispatch<SetStateAction<number>>;
  setLocked: Dispatch<SetStateAction<boolean>>;
  setRequiredLock: Dispatch<SetStateAction<boolean>>;
  setTrustedApps: Dispatch<SetStateAction<TrustedApps>>;
  setTokens: Dispatch<SetStateAction<CustomTokens>>;
  formatAccountForStorage: (account: Account) => StoredAccount;
  getDefaultPathIndex: (account: Account, networkId: string) => number;
}

interface UseAccountsMutationsResult {
  addAccount: (account: Account, password?: string) => Promise<void>;
  editAccount: (targetId: string, params: EditAccountParams) => Promise<void>;
  removeAccount: (targetId: string, password?: string) => Promise<void>;
  removeAllAccounts: () => Promise<void>;
}

export function useAccountsMutations({
  counter,
  setCounter,
  accounts,
  setAccounts,
  accountId,
  setAccountId,
  networkId,
  setNetworkId,
  setPathIndex,
  setLocked,
  setRequiredLock,
  setTrustedApps,
  setTokens,
  formatAccountForStorage,
  getDefaultPathIndex,
}: UseAccountsMutationsParams): UseAccountsMutationsResult {
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
  }, [
    setAccountId,
    setAccounts,
    setCounter,
    setLocked,
    setNetworkId,
    setPathIndex,
    setRequiredLock,
    setTokens,
    setTrustedApps,
  ]);

  const addAccount = useCallback(
    async (account: Account, password?: string): Promise<void> => {
      const newCounter = counter + 1;
      const newAccounts = [...accounts, account];
      const newAccountId = account.id;

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
    [
      accounts,
      counter,
      formatAccountForStorage,
      getDefaultPathIndex,
      networkId,
      setAccountId,
      setAccounts,
      setCounter,
      setNetworkId,
      setPathIndex,
      setRequiredLock,
    ]
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
    [accounts, formatAccountForStorage, setAccounts]
  );

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
    [
      accountId,
      accounts,
      formatAccountForStorage,
      getDefaultPathIndex,
      networkId,
      removeAllAccounts,
      setAccountId,
      setAccounts,
      setPathIndex,
      setRequiredLock,
    ]
  );

  return {
    addAccount,
    editAccount,
    removeAccount,
    removeAllAccounts,
  };
}
