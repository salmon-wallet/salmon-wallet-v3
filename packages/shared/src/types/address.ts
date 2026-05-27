/**
 * Address-book domain types.
 *
 * @module types/address
 */

import type { BlockchainType } from './blockchain';

// ============================================================================
// Network
// ============================================================================

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

// ============================================================================
// Address models
// ============================================================================

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

// ============================================================================
// Network adapter
// ============================================================================

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
