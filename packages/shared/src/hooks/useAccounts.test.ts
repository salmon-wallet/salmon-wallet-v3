/**
 * @vitest-environment jsdom
 * Tests for useAccounts hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from './useAccounts';
import type { Account, EditAccountParams } from './useAccounts';
import * as storage from '../storage';
import * as encryption from '../crypto/encryption';
import { createSolanaAccount } from '../blockchain/solana';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  removeStorageItem: vi.fn(),
  getStashItem: vi.fn(),
  setStashItem: vi.fn(),
  removeStashItem: vi.fn(),
  updateLastActivity: vi.fn(),
}));

vi.mock('../crypto/encryption', () => ({
  lock: vi.fn(),
  unlock: vi.fn(),
  unlockAndGetKey: vi.fn(),
  lockWithKey: vi.fn(),
  isKeyCacheValid: vi.fn(),
}));

vi.mock('../blockchain/solana', () => ({
  createSolanaAccount: vi.fn(),
  SOLANA_NETWORKS: {
    'mainnet-beta': {
      id: 'mainnet-beta',
      name: 'Mainnet Beta',
      blockchain: 'SOLANA',
      environment: 'mainnet-beta',
    },
    devnet: {
      id: 'devnet',
      name: 'Devnet',
      blockchain: 'SOLANA',
      environment: 'devnet',
    },
  },
}));

vi.mock('../blockchain/bitcoin', () => ({
  createBitcoinAccount: vi.fn(),
  BITCOIN_NETWORKS: {
    mainnet: {
      id: 'bitcoin',
      name: 'Bitcoin Mainnet',
      blockchain: 'BITCOIN',
      environment: 'mainnet',
    },
    testnet: {
      id: 'bitcoin-testnet',
      name: 'Bitcoin Testnet',
      blockchain: 'BITCOIN',
      environment: 'testnet',
    },
  },
}));

vi.mock('../blockchain/ethereum', () => ({
  createEthereumAccount: vi.fn(),
  ETHEREUM_NETWORKS: {
    mainnet: {
      id: 'ethereum',
      name: 'Ethereum Mainnet',
      blockchain: 'ETHEREUM',
      environment: 'mainnet',
    },
    sepolia: {
      id: 'ethereum-sepolia',
      name: 'Sepolia Testnet',
      blockchain: 'ETHEREUM',
      environment: 'sepolia',
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const MOCK_MNEMONIC = 'test test test test test test test test test test test test';
const MOCK_PASSWORD = 'SecurePassword123!';
const MOCK_ACCOUNT_ID = 'account_123456_abc';

const mockSolanaAccount = {
  path: "m/44'/501'/0'/0'",
  index: 0,
  network: {
    id: 'mainnet-beta',
    name: 'Mainnet Beta',
    blockchain: 'SOLANA',
  },
  getReceiveAddress: vi.fn(() => 'TestAddress111111111111111111111111111111'),
};

// ============================================================================
// Helper Functions
// ============================================================================

function createMockAccount(): Account {
  return {
    id: MOCK_ACCOUNT_ID,
    name: 'Test Account',
    avatar: 'default',
    mnemonic: MOCK_MNEMONIC,
    pathIndexes: {
      'mainnet-beta': [0],
    },
    networksAccounts: {
      'mainnet-beta': [mockSolanaAccount as any],
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useAccounts Hook', () => {
  // Track stashed values to simulate real stash behavior
  let stashStore: Record<string, any> = {};

  beforeEach(() => {
    vi.resetAllMocks();
    stashStore = {};

    // Default mock implementations
    (storage.getStorageItem as any).mockResolvedValue(null);
    (createSolanaAccount as any).mockResolvedValue(mockSolanaAccount);
    (storage.updateLastActivity as any).mockResolvedValue(undefined);

    // Stateful stash mocks - getStashItem returns what setStashItem stored
    (storage.setStashItem as any).mockImplementation((key: string, value: any) => {
      stashStore[key] = value;
      return Promise.resolve();
    });
    (storage.getStashItem as any).mockImplementation((key: string) => {
      return Promise.resolve(stashStore[key] ?? null);
    });
    (storage.removeStashItem as any).mockImplementation((key: string) => {
      delete stashStore[key];
      return Promise.resolve();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    stashStore = {};
  });

  describe('Initialization', () => {
    it('should initialize with default state when no stored data', async () => {
      const { result } = renderHook(() => useAccounts());
      const [state] = result.current;

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [finalState] = result.current;
      expect(finalState.locked).toBe(false);
      expect(finalState.requiredLock).toBe(false);
      expect(finalState.accounts).toEqual([]);
      expect(finalState.accountId).toBeNull();
      expect(finalState.networkId).toBeNull();
      expect(finalState.counter).toBe(0);
    });

    it('should load accounts from storage', async () => {
      const mockAccount = createMockAccount();
      const storedAccounts = [{
        id: mockAccount.id,
        name: mockAccount.name,
        avatar: mockAccount.avatar,
        pathIndexes: mockAccount.pathIndexes,
      }];

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve(storedAccounts);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_active_path_index') return Promise.resolve(0);
        if (key === 'salmon_account_counter') return Promise.resolve(1);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.accounts).toHaveLength(1);
      expect(state.accountId).toBe(mockAccount.id);
      expect(state.networkId).toBe('mainnet-beta');
      expect(state.activeAccount).toBeDefined();
    });

    it('should detect encrypted mnemonics and set locked state', async () => {
      const encryptedData = {
        isEncrypted: true,
        nonce: 'test-nonce',
        salt: 'test-salt',
        ciphertext: 'encrypted-data',
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve(encryptedData);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.locked).toBe(true);
      expect(state.requiredLock).toBe(true);
    });

    it('should load account metadata even when locked (without decrypting mnemonics)', async () => {
      const mockAccount = createMockAccount();
      const storedAccounts = [{
        id: mockAccount.id,
        name: mockAccount.name,
        avatar: mockAccount.avatar,
        pathIndexes: mockAccount.pathIndexes,
      }];

      const encryptedData = {
        isEncrypted: true,
        nonce: 'test-nonce',
        salt: 'test-salt',
        ciphertext: 'encrypted-data',
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve(encryptedData);
        if (key === 'salmon_accounts') return Promise.resolve(storedAccounts);
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_account_counter') return Promise.resolve(1);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.locked).toBe(true);
      expect(state.requiredLock).toBe(true);
      // Critical: accounts array should NOT be empty even when locked
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe(mockAccount.id);
      expect(state.accounts[0].name).toBe(mockAccount.name);
      expect(state.accounts[0].avatar).toBe(mockAccount.avatar);
      // Mnemonic should be empty placeholder (not decrypted)
      expect(state.accounts[0].mnemonic).toBe('');
      // Networks should be empty (not loaded until unlock)
      expect(state.accounts[0].networksAccounts).toEqual({});
    });

    it('should update last activity on mount', async () => {
      renderHook(() => useAccounts());

      await waitFor(() => {
        expect(storage.updateLastActivity).toHaveBeenCalled();
      });
    });
  });

  describe('Password Management', () => {
    it('should check password correctly', async () => {
      const encryptedData = {
        isEncrypted: true,
        nonce: 'test-nonce',
        salt: 'test-salt',
        ciphertext: 'encrypted-data',
      };

      const mockKeyCache = {
        salt: 'test-salt',
        derivedKey: new Uint8Array(32),
        createdAt: Date.now(),
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve(encryptedData);
        if (key === 'salmon_wallets') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      (encryption.unlockAndGetKey as any).mockResolvedValue({
        data: { test: 'mnemonic' },
        keyCache: mockKeyCache,
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        const isValid = await actions.checkPassword(MOCK_PASSWORD);
        expect(isValid).toBe(true);
      });

      expect(encryption.unlockAndGetKey).toHaveBeenCalledWith(encryptedData, MOCK_PASSWORD);
    });

    it('should return true for checkPassword when no encryption', async () => {
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve({ test: 'plain-mnemonic' });
        if (key === 'salmon_wallets') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        const isValid = await actions.checkPassword(MOCK_PASSWORD);
        expect(isValid).toBe(true);
      });
    });

    it('should lock accounts', async () => {
      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.lockAccounts();
      });

      const [state] = result.current;
      expect(state.locked).toBe(true);
      expect(storage.removeStashItem).toHaveBeenCalledWith('password');
    });

    it('should unlock accounts with correct password', async () => {
      const mockAccount = createMockAccount();
      const encryptedData = {
        isEncrypted: true,
        nonce: 'test-nonce',
        salt: 'test-salt',
        ciphertext: 'encrypted-data',
      };

      const mockKeyCache = {
        salt: 'test-salt',
        derivedKey: new Uint8Array(32),
        createdAt: Date.now(),
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve(encryptedData);
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_wallets') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      (encryption.unlockAndGetKey as any).mockResolvedValue({
        data: { [mockAccount.id]: MOCK_MNEMONIC },
        keyCache: mockKeyCache,
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        const success = await actions.unlockAccounts(MOCK_PASSWORD);
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(result.current[0].locked).toBe(false);
      });

      expect(storage.setStashItem).toHaveBeenCalledWith('password', MOCK_PASSWORD);
    });

    it('should fail to unlock with incorrect password', async () => {
      const encryptedData = {
        isEncrypted: true,
        nonce: 'test-nonce',
        salt: 'test-salt',
        ciphertext: 'encrypted-data',
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_mnemonics') return Promise.resolve(encryptedData);
        if (key === 'salmon_wallets') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      (encryption.unlockAndGetKey as any).mockRejectedValue(new Error('Decryption failed'));

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        const success = await actions.unlockAccounts('wrong-password');
        expect(success).toBe(false);
      });

      const [state] = result.current;
      expect(state.locked).toBe(true);
    });
  });

  describe('Account Management', () => {
    it('should add new account', async () => {
      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const newAccount = createMockAccount();
      const [, actions] = result.current;

      await act(async () => {
        await actions.addAccount(newAccount);
      });

      const [state] = result.current;
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe(newAccount.id);
      expect(storage.setStorageItem).toHaveBeenCalledWith(
        'salmon_accounts',
        expect.any(Array)
      );
    });

    it('should add account with password encryption', async () => {
      (encryption.lock as any).mockResolvedValue({
        nonce: 'nonce',
        salt: 'salt',
        ciphertext: 'encrypted',
      });
      (encryption.isKeyCacheValid as any).mockReturnValue(false);

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const newAccount = createMockAccount();
      const [, actions] = result.current;

      await act(async () => {
        await actions.addAccount(newAccount, MOCK_PASSWORD);
      });

      expect(encryption.lock).toHaveBeenCalled();
      expect(storage.setStorageItem).toHaveBeenCalledWith(
        'salmon_mnemonics',
        expect.objectContaining({ isEncrypted: true })
      );
      expect(storage.setStashItem).toHaveBeenCalledWith('password', MOCK_PASSWORD);
    });

    it('should edit account name', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;
      const newName = 'Updated Account Name';

      await act(async () => {
        await actions.editAccount(mockAccount.id, { name: newName });
      });

      const [state] = result.current;
      expect(state.accounts[0].name).toBe(newName);
    });

    it('should edit account avatar', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;
      const newAvatar = 'custom-avatar';

      await act(async () => {
        await actions.editAccount(mockAccount.id, { avatar: newAvatar });
      });

      const [state] = result.current;
      expect(state.accounts[0].avatar).toBe(newAvatar);
    });

    it('should remove account', async () => {
      const mockAccount1 = createMockAccount();
      const mockAccount2 = { ...createMockAccount(), id: 'account_789' };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([
          {
            id: mockAccount1.id,
            name: mockAccount1.name,
            avatar: mockAccount1.avatar,
            pathIndexes: mockAccount1.pathIndexes,
          },
          {
            id: mockAccount2.id,
            name: mockAccount2.name,
            avatar: mockAccount2.avatar,
            pathIndexes: mockAccount2.pathIndexes,
          },
        ]);
        if (key === 'salmon_mnemonics') return Promise.resolve({
          [mockAccount1.id]: MOCK_MNEMONIC,
          [mockAccount2.id]: MOCK_MNEMONIC,
        });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount1.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
        expect(result.current[0].accounts).toHaveLength(2);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.removeAccount(mockAccount1.id);
      });

      const [state] = result.current;
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe(mockAccount2.id);
    });

    it('should remove all accounts when removing last account', async () => {
      const mockAccount = createMockAccount();

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.removeAccount(mockAccount.id);
      });

      const [state] = result.current;
      expect(state.accounts).toEqual([]);
      expect(state.accountId).toBeNull();
      expect(storage.removeStorageItem).toHaveBeenCalledWith('salmon_mnemonics');
    });

    it('should remove all accounts', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.removeAllAccounts();
      });

      const [state] = result.current;
      expect(state.accounts).toEqual([]);
      expect(state.locked).toBe(false);
      expect(state.requiredLock).toBe(false);
      expect(storage.removeStorageItem).toHaveBeenCalledWith('salmon_mnemonics');
      expect(storage.removeStorageItem).toHaveBeenCalledWith('salmon_accounts');
    });
  });

  describe('Account Switching', () => {
    it('should change active account', async () => {
      const mockAccount1 = createMockAccount();
      const mockAccount2 = { ...createMockAccount(), id: 'account_789' };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([
          {
            id: mockAccount1.id,
            name: mockAccount1.name,
            avatar: mockAccount1.avatar,
            pathIndexes: mockAccount1.pathIndexes,
          },
          {
            id: mockAccount2.id,
            name: mockAccount2.name,
            avatar: mockAccount2.avatar,
            pathIndexes: mockAccount2.pathIndexes,
          },
        ]);
        if (key === 'salmon_mnemonics') return Promise.resolve({
          [mockAccount1.id]: MOCK_MNEMONIC,
          [mockAccount2.id]: MOCK_MNEMONIC,
        });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount1.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.changeAccount(mockAccount2.id);
      });

      const [state] = result.current;
      expect(state.accountId).toBe(mockAccount2.id);
      expect(storage.setStorageItem).toHaveBeenCalledWith('salmon_active_account_id', mockAccount2.id);
    });

    it('should change active network', async () => {
      const mockAccount = createMockAccount();
      mockAccount.networksAccounts['devnet'] = [mockSolanaAccount as any];
      mockAccount.pathIndexes['devnet'] = [0];

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.changeNetwork('devnet');
      });

      const [state] = result.current;
      expect(state.networkId).toBe('devnet');
      expect(storage.setStorageItem).toHaveBeenCalledWith('salmon_active_network_id', 'devnet');
    });

    it('should change path index', async () => {
      const mockAccount = createMockAccount();
      mockAccount.networksAccounts['mainnet-beta'] = [mockSolanaAccount as any, mockSolanaAccount as any];
      mockAccount.pathIndexes['mainnet-beta'] = [0, 1];

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_active_path_index') return Promise.resolve(0);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.changePathIndex(1);
      });

      const [state] = result.current;
      expect(state.pathIndex).toBe(1);
      expect(storage.setStorageItem).toHaveBeenCalledWith('salmon_active_path_index', 1);
    });
  });

  describe('switchNetwork', () => {
    it('should switch to a valid network and persist to storage', async () => {
      const mockAccount = createMockAccount();
      mockAccount.networksAccounts['devnet'] = [mockSolanaAccount as any];
      mockAccount.pathIndexes['devnet'] = [0];

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.switchNetwork('devnet');
      });

      const [state] = result.current;
      expect(state.networkId).toBe('devnet');
      expect(storage.setStorageItem).toHaveBeenCalledWith('salmon_active_network_id', 'devnet');
    });

    it('should handle switching to an invalid network gracefully', async () => {
      const mockAccount = createMockAccount();

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.switchNetwork('invalid-network');
      });

      const [state] = result.current;
      // Should remain on the original network
      expect(state.networkId).toBe('mainnet-beta');
    });
  });

  describe('getNetworkId', () => {
    it('should return current network ID', async () => {
      const mockAccount = createMockAccount();

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;
      const networkId = actions.getNetworkId();

      expect(networkId).toBe('mainnet-beta');
    });

    it('should return default network when none is set', async () => {
      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;
      const networkId = actions.getNetworkId();

      expect(networkId).toBeNull();
    });
  });

  describe('Trusted Apps', () => {
    it('should add trusted app', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_trusted_apps') return Promise.resolve({});
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.addTrustedApp('example.com', { name: 'Example App', icon: 'icon.png' });
      });

      const [state] = result.current;
      expect(state.activeTrustedApps['example.com']).toBeDefined();
      expect(state.activeTrustedApps['example.com'].name).toBe('Example App');
    });

    it('should remove trusted app', async () => {
      const mockAccount = createMockAccount();
      const initialTrustedApps = {
        'mainnet-beta': {
          'example.com': { name: 'Example App', icon: 'icon.png' },
        },
      };

      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_trusted_apps') return Promise.resolve(initialTrustedApps);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.removeTrustedApp('example.com');
      });

      const [state] = result.current;
      expect(state.activeTrustedApps['example.com']).toBeUndefined();
    });
  });

  describe('Custom Tokens', () => {
    it('should import custom tokens', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_custom_tokens') return Promise.resolve({});
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      await act(async () => {
        await actions.importTokens('mainnet-beta', [
          {
            address: 'TokenAddress1111111111111111111111111111',
            symbol: 'TKN',
            name: 'Token',
            decimals: 9,
            logoURI: 'logo.png',
          },
        ]);
      });

      const [state] = result.current;
      expect(state.activeTokens['TokenAddress1111111111111111111111111111']).toBeDefined();
      expect(state.activeTokens['TokenAddress1111111111111111111111111111'].symbol).toBe('TKN');
    });
  });

  describe('Computed Values', () => {
    it('should provide active account', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.activeAccount).toBeDefined();
      expect(state.activeAccount?.id).toBe(mockAccount.id);
    });

    it('should provide active blockchain account', async () => {
      const mockAccount = createMockAccount();
      (storage.getStorageItem as any).mockImplementation((key: string) => {
        if (key === 'salmon_accounts') return Promise.resolve([{
          id: mockAccount.id,
          name: mockAccount.name,
          avatar: mockAccount.avatar,
          pathIndexes: mockAccount.pathIndexes,
        }]);
        if (key === 'salmon_mnemonics') return Promise.resolve({ [mockAccount.id]: MOCK_MNEMONIC });
        if (key === 'salmon_active_account_id') return Promise.resolve(mockAccount.id);
        if (key === 'salmon_active_network_id') return Promise.resolve('mainnet-beta');
        if (key === 'salmon_active_path_index') return Promise.resolve(0);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAccounts());

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.activeBlockchainAccount).toBeDefined();
      expect(state.activeBlockchainAccount?.getReceiveAddress()).toBeTruthy();
    });
  });
});
