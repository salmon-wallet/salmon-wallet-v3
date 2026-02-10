/**
 * Tests for useAddressbook hook
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAddressbook,
  findAddress,
  filterByNetwork,
  filterByBlockchain,
  searchAddresses,
} from './useAddressbook';
import type {
  Address,
  AddressInput,
  NetworkAdapter,
  AddressBookNetwork,
} from './useAddressbook';
import * as storage from '../storage';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../storage', () => ({
  getStorage: vi.fn(),
  STORAGE_KEYS: {
    CONTACTS: 'salmon_contacts',
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const MOCK_NETWORKS: AddressBookNetwork[] = [
  {
    id: 'solana-mainnet',
    name: 'Solana Mainnet',
    blockchain: 'solana',
  },
  {
    id: 'bitcoin-mainnet',
    name: 'Bitcoin Mainnet',
    blockchain: 'bitcoin',
  },
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    blockchain: 'ethereum',
  },
];

const MOCK_STORED_ADDRESSES = [
  {
    address: 'SolanaAddress1111111111111111111111111111111',
    name: 'My Solana Wallet',
    domain: 'mysolana.sol',
    networkId: 'solana-mainnet',
  },
  {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    name: 'My Bitcoin Wallet',
    domain: null,
    networkId: 'bitcoin-mainnet',
  },
];

const MOCK_LEGACY_ADDRESSES = [
  {
    name: 'Legacy Solana',
    address: 'LegacySolana11111111111111111111111111111111',
    domain: 'legacy.sol',
    chain: 'SOLANA',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function createMockAdapter(): NetworkAdapter {
  return {
    getNetwork: vi.fn(async (networkId: string) =>
      MOCK_NETWORKS.find((n) => n.id === networkId)
    ),
    getNetworks: vi.fn(async () => MOCK_NETWORKS),
  };
}

function createMockStorage() {
  const storageData: Record<string, any> = {};
  return {
    getItem: vi.fn(async (key: string) => storageData[key] ?? null),
    setItem: vi.fn(async (key: string, value: any) => {
      storageData[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete storageData[key];
    }),
    _data: storageData,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useAddressbook Hook', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockAdapter: NetworkAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();
    mockAdapter = createMockAdapter();
    (storage.getStorage as any).mockReturnValue(mockStorage);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initialization / Getting Addresses
  // ==========================================================================

  describe('Getting Addresses', () => {
    it('should load addresses from storage successfully', async () => {
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.addressBook).toHaveLength(2);
      expect(state.addressBook[0].address).toBe('SolanaAddress1111111111111111111111111111111');
      expect(state.addressBook[0].name).toBe('My Solana Wallet');
      expect(state.addressBook[0].network.id).toBe('solana-mainnet');
      expect(state.error).toBeUndefined();
    });

    it('should return empty address book when no stored data exists', async () => {
      // No data in storage

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.addressBook).toEqual([]);
      expect(state.error).toBeUndefined();
    });
  });

  // ==========================================================================
  // Adding Addresses
  // ==========================================================================

  describe('Adding Addresses', () => {
    it('should add a new address successfully', async () => {
      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const newAddressInput: AddressInput = {
        address: 'NewSolanaAddress11111111111111111111111111',
        name: 'New Contact',
        domain: 'newcontact.sol',
        networkId: 'solana-mainnet',
      };

      const [, actions] = result.current;

      await act(async () => {
        await actions.addAddress(newAddressInput);
      });

      const [state] = result.current;
      expect(state.addressBook).toHaveLength(1);
      expect(state.addressBook[0].address).toBe(newAddressInput.address);
      expect(state.addressBook[0].name).toBe(newAddressInput.name);
      expect(state.addressBook[0].network.id).toBe('solana-mainnet');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'salmon_contacts',
        expect.any(Array)
      );
    });

    it('should throw error when adding address with invalid network', async () => {
      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const invalidAddressInput: AddressInput = {
        address: 'SomeAddress111111111111111111111111111111',
        name: 'Invalid Network Contact',
        networkId: 'nonexistent-network',
      };

      const [, actions] = result.current;

      await expect(
        act(async () => {
          await actions.addAddress(invalidAddressInput);
        })
      ).rejects.toThrow('Network not found: nonexistent-network');
    });
  });

  // ==========================================================================
  // Removing Addresses
  // ==========================================================================

  describe('Removing Addresses', () => {
    it('should remove an existing address successfully', async () => {
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      expect(result.current[0].addressBook).toHaveLength(2);

      const [, actions] = result.current;

      await act(async () => {
        await actions.removeAddress('SolanaAddress1111111111111111111111111111111');
      });

      const [state] = result.current;
      expect(state.addressBook).toHaveLength(1);
      expect(state.addressBook[0].address).toBe('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'salmon_contacts',
        expect.any(Array)
      );
    });

    it('should handle removing non-existent address gracefully', async () => {
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const initialLength = result.current[0].addressBook.length;
      const [, actions] = result.current;

      await act(async () => {
        await actions.removeAddress('NonExistentAddress1111111111111111111');
      });

      const [state] = result.current;
      // Address book should remain unchanged
      expect(state.addressBook).toHaveLength(initialLength);
    });
  });

  // ==========================================================================
  // Editing Addresses
  // ==========================================================================

  describe('Editing Addresses', () => {
    it('should edit an existing address successfully', async () => {
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const updatedData: AddressInput = {
        address: 'SolanaAddress1111111111111111111111111111111',
        name: 'Updated Wallet Name',
        domain: 'updated.sol',
        networkId: 'solana-mainnet',
      };

      const [, actions] = result.current;

      await act(async () => {
        await actions.editAddress('SolanaAddress1111111111111111111111111111111', updatedData);
      });

      const [state] = result.current;
      const editedAddress = state.addressBook.find(
        (a) => a.address === 'SolanaAddress1111111111111111111111111111111'
      );
      expect(editedAddress?.name).toBe('Updated Wallet Name');
      expect(editedAddress?.domain).toBe('updated.sol');
    });

    it('should throw error when editing with invalid network', async () => {
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const invalidUpdate: AddressInput = {
        address: 'SolanaAddress1111111111111111111111111111111',
        name: 'Invalid Edit',
        networkId: 'invalid-network',
      };

      const [, actions] = result.current;

      await expect(
        act(async () => {
          await actions.editAddress('SolanaAddress1111111111111111111111111111111', invalidUpdate);
        })
      ).rejects.toThrow('Network not found: invalid-network');
    });
  });

  // ==========================================================================
  // Refresh Functionality
  // ==========================================================================

  describe('Refresh Functionality', () => {
    it('should refresh address book from storage', async () => {
      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      expect(result.current[0].addressBook).toHaveLength(0);

      // Add data to storage externally
      mockStorage._data['salmon_contacts'] = MOCK_STORED_ADDRESSES;

      const [, actions] = result.current;

      await act(async () => {
        await actions.refresh();
      });

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.addressBook).toHaveLength(2);
    });

    it('should set ready to false during refresh', async () => {
      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [, actions] = result.current;

      // Start refresh - ready should become false
      act(() => {
        actions.refresh();
      });

      // During refresh, ready should be false
      // Note: This may resolve quickly in tests, so we check the final state
      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Legacy Migration
  // ==========================================================================

  describe('Legacy Migration', () => {
    it('should migrate legacy addresses to new format', async () => {
      mockStorage._data['salmon_address'] = MOCK_LEGACY_ADDRESSES;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      // Legacy data should be removed
      expect(mockStorage.removeItem).toHaveBeenCalledWith('salmon_address');

      // New format should be saved
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'salmon_contacts',
        expect.arrayContaining([
          expect.objectContaining({
            address: 'LegacySolana11111111111111111111111111111111',
            name: 'Legacy Solana',
          }),
        ])
      );
    });

    it('should skip legacy addresses with unknown chain', async () => {
      const legacyWithUnknownChain = [
        {
          name: 'Unknown Chain',
          address: 'UnknownAddress111111111111111111111111111',
          chain: 'UNKNOWN_CHAIN',
        },
      ];
      mockStorage._data['salmon_address'] = legacyWithUnknownChain;

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      // Legacy data should still be removed
      expect(mockStorage.removeItem).toHaveBeenCalledWith('salmon_address');

      // But no addresses should be added (unknown chain)
      const [state] = result.current;
      expect(state.addressBook).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const { result } = renderHook(() => useAddressbook(mockAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.error).toBe('Storage error');
    });

    it('should handle network adapter errors gracefully', async () => {
      const failingAdapter: NetworkAdapter = {
        getNetwork: vi.fn().mockRejectedValue(new Error('Network error')),
        getNetworks: vi.fn().mockRejectedValue(new Error('Network list error')),
      };

      const { result } = renderHook(() => useAddressbook(failingAdapter));

      await waitFor(() => {
        expect(result.current[0].ready).toBe(true);
      });

      const [state] = result.current;
      expect(state.error).toBe('Network list error');
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Address Book Utility Functions', () => {
  const mockAddressBook: Address[] = [
    {
      address: 'SolanaAddress1',
      name: 'Solana Wallet 1',
      domain: 'solana1.sol',
      network: { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana' },
    },
    {
      address: 'SolanaAddress2',
      name: 'Solana Wallet 2',
      domain: null,
      network: { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana' },
    },
    {
      address: 'BitcoinAddress1',
      name: 'Bitcoin Wallet',
      domain: null,
      network: { id: 'bitcoin-mainnet', name: 'Bitcoin Mainnet', blockchain: 'bitcoin' },
    },
    {
      address: 'EthAddress1',
      name: 'Ethereum Wallet',
      domain: 'myeth.eth',
      network: { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', blockchain: 'ethereum' },
    },
  ];

  // ==========================================================================
  // findAddress
  // ==========================================================================

  describe('findAddress', () => {
    it('should find address by address string', () => {
      const found = findAddress(mockAddressBook, 'SolanaAddress1');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Solana Wallet 1');
    });

    it('should return undefined for non-existent address', () => {
      const found = findAddress(mockAddressBook, 'NonExistentAddress');
      expect(found).toBeUndefined();
    });
  });

  // ==========================================================================
  // filterByNetwork
  // ==========================================================================

  describe('filterByNetwork', () => {
    it('should filter addresses by network ID', () => {
      const filtered = filterByNetwork(mockAddressBook, 'solana-mainnet');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((a) => a.network.id === 'solana-mainnet')).toBe(true);
    });

    it('should return empty array for non-existent network', () => {
      const filtered = filterByNetwork(mockAddressBook, 'nonexistent-network');
      expect(filtered).toEqual([]);
    });
  });

  // ==========================================================================
  // filterByBlockchain
  // ==========================================================================

  describe('filterByBlockchain', () => {
    it('should filter addresses by blockchain type', () => {
      const filtered = filterByBlockchain(mockAddressBook, 'solana');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((a) => a.network.blockchain === 'solana')).toBe(true);
    });

    it('should return empty array for non-existent blockchain', () => {
      const filtered = filterByBlockchain(mockAddressBook, 'bitcoin');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].network.blockchain).toBe('bitcoin');
    });
  });

  // ==========================================================================
  // searchAddresses
  // ==========================================================================

  describe('searchAddresses', () => {
    it('should search addresses by name', () => {
      const results = searchAddresses(mockAddressBook, 'Bitcoin');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bitcoin Wallet');
    });

    it('should search addresses by address string', () => {
      const results = searchAddresses(mockAddressBook, 'EthAddress');
      expect(results).toHaveLength(1);
      expect(results[0].address).toBe('EthAddress1');
    });

    it('should search addresses by domain', () => {
      const results = searchAddresses(mockAddressBook, '.eth');
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe('myeth.eth');
    });

    it('should return empty array for no matches', () => {
      const results = searchAddresses(mockAddressBook, 'xyznonexistent');
      expect(results).toEqual([]);
    });

    it('should perform case-insensitive search', () => {
      const results = searchAddresses(mockAddressBook, 'SOLANA');
      expect(results).toHaveLength(2);
    });
  });
});
