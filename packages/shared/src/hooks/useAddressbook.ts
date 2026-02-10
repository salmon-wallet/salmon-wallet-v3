/**
 * Address book hook for managing saved addresses across different blockchain networks.
 *
 * This hook provides functionality to add, edit, remove, and retrieve saved addresses
 * with support for multiple blockchain networks (Solana, Bitcoin, Ethereum).
 *
 * @module hooks/useAddressbook
 *
 * @example
 * ```typescript
 * import { useAddressbook } from '@salmon/shared/hooks';
 *
 * function AddressBookScreen() {
 *   const [{ addressBook, ready }, { addAddress, editAddress, removeAddress }] = useAddressbook({
 *     getNetwork: async (networkId) => networks.find(n => n.id === networkId),
 *     getNetworks: async () => networks,
 *   });
 *
 *   if (!ready) return <Loading />;
 *
 *   return (
 *     <AddressList
 *       addresses={addressBook}
 *       onAdd={(data) => addAddress(data)}
 *       onEdit={(oldAddress, data) => editAddress(oldAddress, data)}
 *       onRemove={(address) => removeAddress(address)}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getStorage, STORAGE_KEYS } from '../storage';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Supported blockchain types for address book entries.
 */
export type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Base network interface that all blockchain networks must implement.
 * This is a minimal interface to support address book functionality.
 */
export interface AddressBookNetwork {
  /** Unique network identifier (e.g., 'solana-mainnet', 'bitcoin-mainnet', 'ethereum-mainnet') */
  id: string;
  /** Human-readable network name */
  name: string;
  /** Blockchain type */
  blockchain?: BlockchainType;
}

/**
 * Stored address entry format (persisted to storage).
 * Uses networkId instead of full network object for efficient storage.
 */
export interface StoredAddress {
  /** Blockchain address (public key, wallet address, etc.) */
  address: string;
  /** Optional domain name associated with the address (e.g., .sol, .eth) */
  domain?: string | null;
  /** User-defined label for this address */
  name: string;
  /** Network identifier where this address is valid */
  networkId: string;
}

/**
 * Address entry with resolved network object.
 * This is the format returned by the hook for display and use.
 */
export interface Address {
  /** Blockchain address (public key, wallet address, etc.) */
  address: string;
  /** Optional domain name associated with the address */
  domain?: string | null;
  /** User-defined label for this address */
  name: string;
  /** Full network object */
  network: AddressBookNetwork;
}

/**
 * Input data for adding or editing an address.
 */
export interface AddressInput {
  /** Blockchain address */
  address: string;
  /** Optional domain name */
  domain?: string | null;
  /** User-defined label */
  name: string;
  /** Network identifier */
  networkId: string;
}

/**
 * Legacy stored address format (from v2).
 * Used for migration from older storage format.
 */
interface LegacyStoredAddress {
  name: string;
  address: string;
  domain?: string | null;
  /** Legacy field: blockchain name (e.g., 'SOLANA', 'BITCOIN') */
  chain: string;
}

/**
 * State returned by the address book hook.
 */
export interface AddressbookState {
  /** List of addresses with resolved network objects */
  addressBook: Address[];
  /** Whether the address book has finished loading from storage */
  ready: boolean;
  /** Error message if loading failed */
  error?: string;
}

/**
 * Actions available for managing the address book.
 */
export interface AddressbookActions {
  /** Adds a new address to the address book */
  addAddress: (data: AddressInput) => Promise<void>;
  /** Edits an existing address by its old address value */
  editAddress: (oldAddress: string, data: AddressInput) => Promise<void>;
  /** Removes an address from the address book */
  removeAddress: (address: string) => Promise<void>;
  /** Refreshes the address book from storage */
  refresh: () => Promise<void>;
}

/**
 * Network adapter interface for resolving networks.
 * The app must provide these functions to resolve network IDs to network objects.
 */
export interface NetworkAdapter {
  /** Retrieves a network by its ID */
  getNetwork: (networkId: string) => Promise<AddressBookNetwork | undefined>;
  /** Retrieves all available networks */
  getNetworks: () => Promise<AddressBookNetwork[]>;
}

/**
 * Return type of the useAddressbook hook.
 */
export type UseAddressbookReturn = [AddressbookState, AddressbookActions];

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Storage key for the address book.
 * Uses the CONTACTS key from the storage module.
 */
const ADDRESS_BOOK_KEY = STORAGE_KEYS.CONTACTS;

/**
 * Legacy storage key for migration (from v2).
 */
const LEGACY_ADDRESS_KEY = 'salmon_address';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses a stored address into a full Address object with resolved network.
 *
 * @param stored - The stored address data
 * @param networks - Available networks to resolve the networkId
 * @returns Address with resolved network, or null if network not found
 */
function parseStoredAddress(
  stored: StoredAddress,
  networks: AddressBookNetwork[]
): Address | null {
  const network = networks.find((n) => n.id === stored.networkId);
  if (!network) {
    return null;
  }

  return {
    address: stored.address,
    domain: stored.domain,
    name: stored.name,
    network,
  };
}

/**
 * Formats an Address object for storage.
 *
 * @param address - The address to format
 * @returns StoredAddress ready for persistence
 */
function formatAddressForStorage(address: Address): StoredAddress {
  return {
    address: address.address,
    domain: address.domain,
    name: address.name,
    networkId: address.network.id,
  };
}

/**
 * Migrates legacy address format to new format.
 *
 * @param legacy - Legacy address entry
 * @param networks - Available networks
 * @returns StoredAddress in new format, or null if migration fails
 */
function migrateLegacyAddress(
  legacy: LegacyStoredAddress,
  networks: AddressBookNetwork[]
): StoredAddress | null {
  // Find network by blockchain name (case-insensitive)
  const network = networks.find(
    (n) =>
      n.blockchain?.toUpperCase() === legacy.chain.toUpperCase() ||
      n.id.toUpperCase().includes(legacy.chain.toUpperCase())
  );

  if (!network) {
    return null;
  }

  return {
    name: legacy.name,
    address: legacy.address,
    domain: legacy.domain,
    networkId: network.id,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for managing the address book.
 *
 * Provides CRUD operations for saved addresses with support for multiple
 * blockchain networks. Handles storage persistence and migration from
 * legacy formats.
 *
 * @param adapter - Network adapter for resolving network IDs
 * @returns Tuple of [state, actions]
 *
 * @example
 * ```typescript
 * const [{ addressBook, ready }, { addAddress, removeAddress }] = useAddressbook({
 *   getNetwork: async (id) => networkService.getById(id),
 *   getNetworks: async () => networkService.getAll(),
 * });
 *
 * // Add a new address
 * await addAddress({
 *   address: 'So11111111111111111111111111111111111111112',
 *   name: 'My Solana Wallet',
 *   networkId: 'solana-mainnet',
 * });
 *
 * // Edit an existing address
 * await editAddress('So11111111111111111111111111111111111111112', {
 *   address: 'So11111111111111111111111111111111111111112',
 *   name: 'Updated Name',
 *   networkId: 'solana-mainnet',
 * });
 *
 * // Remove an address
 * await removeAddress('So11111111111111111111111111111111111111112');
 * ```
 */
export function useAddressbook(adapter: NetworkAdapter): UseAddressbookReturn {
  const [addressBook, setAddressbook] = useState<Address[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  /**
   * Loads the address book from storage, handling migration if needed.
   */
  const load = useCallback(async (): Promise<void> => {
    try {
      const storage = getStorage();
      const networks = await adapter.getNetworks();

      // Check for legacy data and migrate if present
      const legacyData = await storage.getItem<LegacyStoredAddress[]>(LEGACY_ADDRESS_KEY);
      if (legacyData && legacyData.length > 0) {
        const migratedAddresses = legacyData
          .map((legacy) => migrateLegacyAddress(legacy, networks))
          .filter((addr): addr is StoredAddress => addr !== null);

        if (migratedAddresses.length > 0) {
          await storage.setItem(ADDRESS_BOOK_KEY, migratedAddresses);
        }
        await storage.removeItem(LEGACY_ADDRESS_KEY);
      }

      // Load current address book
      const storedAddresses = await storage.getItem<StoredAddress[]>(ADDRESS_BOOK_KEY);
      if (storedAddresses && storedAddresses.length > 0) {
        const parsedAddresses = storedAddresses
          .map((stored) => parseStoredAddress(stored, networks))
          .filter((addr): addr is Address => addr !== null);

        setAddressbook(parsedAddresses);
      } else {
        setAddressbook([]);
      }

      setError(undefined);
      setReady(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load address book';
      setError(message);
      setReady(true);
    }
  }, [adapter]);

  /**
   * Persists the address book to storage.
   */
  const persist = useCallback(async (addresses: Address[]): Promise<void> => {
    const storage = getStorage();
    const storedAddresses = addresses.map(formatAddressForStorage);
    await storage.setItem(ADDRESS_BOOK_KEY, storedAddresses);
  }, []);

  /**
   * Adds a new address to the address book.
   */
  const addAddress = useCallback(
    async (data: AddressInput): Promise<void> => {
      const network = await adapter.getNetwork(data.networkId);
      if (!network) {
        throw new Error(`Network not found: ${data.networkId}`);
      }

      const newAddress: Address = {
        address: data.address,
        domain: data.domain,
        name: data.name,
        network,
      };

      const newAddressBook = [...addressBook, newAddress];
      await persist(newAddressBook);
      setAddressbook(newAddressBook);
    },
    [addressBook, adapter, persist]
  );

  /**
   * Edits an existing address in the address book.
   */
  const editAddress = useCallback(
    async (oldAddress: string, data: AddressInput): Promise<void> => {
      const network = await adapter.getNetwork(data.networkId);
      if (!network) {
        throw new Error(`Network not found: ${data.networkId}`);
      }

      const updatedAddress: Address = {
        address: data.address,
        domain: data.domain,
        name: data.name,
        network,
      };

      const newAddressBook = [
        ...addressBook.filter((item) => item.address !== oldAddress),
        updatedAddress,
      ];

      await persist(newAddressBook);
      setAddressbook(newAddressBook);
    },
    [addressBook, adapter, persist]
  );

  /**
   * Removes an address from the address book.
   */
  const removeAddress = useCallback(
    async (address: string): Promise<void> => {
      const newAddressBook = addressBook.filter((a) => a.address !== address);
      await persist(newAddressBook);
      setAddressbook(newAddressBook);
    },
    [addressBook, persist]
  );

  /**
   * Refreshes the address book from storage.
   */
  const refresh = useCallback(async (): Promise<void> => {
    setReady(false);
    await load();
  }, [load]);

  // Load address book on mount
  useEffect(() => {
    load();
  }, [load]);

  return [
    { addressBook, ready, error },
    { addAddress, editAddress, removeAddress, refresh },
  ];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Finds an address in the address book by its address string.
 *
 * @param addressBook - The address book to search
 * @param address - The address string to find
 * @returns The matching Address or undefined
 */
export function findAddress(
  addressBook: Address[],
  address: string
): Address | undefined {
  return addressBook.find((a) => a.address === address);
}

/**
 * Filters addresses by network.
 *
 * @param addressBook - The address book to filter
 * @param networkId - The network ID to filter by
 * @returns Addresses matching the network
 */
export function filterByNetwork(
  addressBook: Address[],
  networkId: string
): Address[] {
  return addressBook.filter((a) => a.network.id === networkId);
}

/**
 * Filters addresses by blockchain type.
 *
 * @param addressBook - The address book to filter
 * @param blockchain - The blockchain type to filter by
 * @returns Addresses matching the blockchain
 */
export function filterByBlockchain(
  addressBook: Address[],
  blockchain: BlockchainType
): Address[] {
  return addressBook.filter((a) => a.network.blockchain === blockchain);
}

/**
 * Searches addresses by name or address string (case-insensitive).
 *
 * @param addressBook - The address book to search
 * @param query - The search query
 * @returns Matching addresses
 */
export function searchAddresses(
  addressBook: Address[],
  query: string
): Address[] {
  const lowerQuery = query.toLowerCase();
  return addressBook.filter(
    (a) =>
      a.name.toLowerCase().includes(lowerQuery) ||
      a.address.toLowerCase().includes(lowerQuery) ||
      a.domain?.toLowerCase().includes(lowerQuery)
  );
}

export default useAddressbook;
