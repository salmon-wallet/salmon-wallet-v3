/**
 * Account Factory - Creates accounts with blockchain accounts
 *
 * This factory consolidates account creation logic, similar to V2's
 * account-factory.js but adapted for V3's TypeScript architecture.
 *
 * Supports multi-chain account derivation:
 * - Solana (solana-mainnet, solana-devnet)
 * - Bitcoin (bitcoin-mainnet, bitcoin-testnet)
 * - Ethereum (ethereum-mainnet, ethereum-sepolia)
 *
 * @module factories/account-factory
 */

import { getRandomAvatar } from '../utils/avatar';
import {
  createSolanaAccount,
  SOLANA_NETWORKS,
  type SolanaAccount,
} from '../blockchain/solana';
import {
  createBitcoinAccount,
  BITCOIN_NETWORKS,
  type BitcoinAccount,
  type BitcoinAccountApiFunctions,
} from '../blockchain/bitcoin';
import {
  fetchBitcoinAccountBalance,
  fetchBitcoinAccountPrices,
  fetchBitcoinAccountTransaction,
  fetchBitcoinAccountRecentTransactions,
} from '../api/services/bitcoin-account';
import {
  createEthereumAccount,
  ETHEREUM_NETWORKS,
  type EthereumAccount,
} from '../blockchain/ethereum';
import type {
  Account,
  NetworksAccounts,
  NetworkPathIndexes,
  BlockchainAccount,
} from '../hooks/useAccounts';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for creating a new account
 */
export interface CreateAccountOptions {
  /** Optional custom ID (generates UUID if not provided) */
  id?: string;
  /** Account name (e.g., "Account #1") */
  name: string;
  /** Avatar URL (generates random if not provided) */
  avatar?: string;
  /** BIP39 mnemonic phrase */
  mnemonic: string;
  /** Network IDs to create accounts for (defaults to ['solana-mainnet']) */
  networkIds?: string[];
  /** Starting derivation index (defaults to 0) */
  startIndex?: number;
}

/**
 * Result of account creation
 */
export interface CreateAccountResult {
  /** The created account with all metadata */
  account: Account;
  /** Blockchain accounts indexed by network ID */
  blockchainAccounts: NetworksAccounts;
}

// ============================================================================
// Blockchain Type Detection
// ============================================================================

/**
 * Supported blockchain types
 */
type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Determines the blockchain type from a network ID.
 *
 * @param networkId - The network identifier
 * @returns The blockchain type
 */
function getBlockchainType(networkId: string): BlockchainType {
  // Check Bitcoin networks
  if (BITCOIN_NETWORKS[networkId] || networkId.startsWith('bitcoin')) {
    return 'bitcoin';
  }

  // Check Ethereum networks
  if (ETHEREUM_NETWORKS[networkId] || networkId.startsWith('ethereum')) {
    return 'ethereum';
  }

  // Default to Solana (for backwards compatibility)
  return 'solana';
}

/**
 * Maps a network ID to its corresponding network key in the networks object.
 * Handles cases where the network ID differs from the key (e.g., 'bitcoin-mainnet' -> 'bitcoin-mainnet').
 */
function getNetworkKey(networkId: string, _blockchainType: BlockchainType): string {
  // Network IDs match the keys in BITCOIN_NETWORKS, ETHEREUM_NETWORKS, and SOLANA_NETWORKS directly
  return networkId;
}

// ============================================================================
// Bitcoin API Functions
// ============================================================================

const bitcoinApiFunctions: BitcoinAccountApiFunctions = {
  fetchBalance: fetchBitcoinAccountBalance,
  fetchPrices: fetchBitcoinAccountPrices,
  fetchTransaction: fetchBitcoinAccountTransaction,
  fetchRecentTransactions: fetchBitcoinAccountRecentTransactions,
};

// ============================================================================
// UUID Generation
// ============================================================================

/**
 * Generates a unique identifier for an account.
 * Uses crypto.randomUUID() if available, falls back to timestamp + random.
 *
 * @returns A unique identifier string
 */
function generateAccountId(): string {
  // Try crypto.randomUUID first (Node.js 14.17+ / modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Account Creation
// ============================================================================

/**
 * Creates a blockchain account for a specific network.
 *
 * Routes to the appropriate factory based on the blockchain type.
 *
 * @param networkId - The network identifier
 * @param mnemonic - BIP39 mnemonic phrase
 * @param index - Account derivation index
 * @returns Promise resolving to the blockchain account, or null if network not found
 */
async function createBlockchainAccountForNetwork(
  networkId: string,
  mnemonic: string,
  index: number
): Promise<BlockchainAccount | null> {
  const blockchainType = getBlockchainType(networkId);
  const networkKey = getNetworkKey(networkId, blockchainType);

  switch (blockchainType) {
    case 'bitcoin': {
      const network = BITCOIN_NETWORKS[networkKey];
      if (!network) {
        console.warn(`Unknown Bitcoin network: ${networkId}`);
        return null;
      }
      return createBitcoinAccount({ network, mnemonic, index, apiFunctions: bitcoinApiFunctions });
    }

    case 'ethereum': {
      const network = ETHEREUM_NETWORKS[networkKey];
      if (!network) {
        console.warn(`Unknown Ethereum network: ${networkId}`);
        return null;
      }
      return createEthereumAccount({ network, mnemonic, index });
    }

    case 'solana':
    default: {
      const network = SOLANA_NETWORKS[networkKey];
      if (!network) {
        console.warn(`Unknown Solana network: ${networkId}`);
        return null;
      }
      return createSolanaAccount({ network, mnemonic, index });
    }
  }
}

/**
 * Creates an Account with derived blockchain accounts.
 *
 * This function:
 * - Generates a unique ID if not provided
 * - Creates blockchain accounts for specified networks (Solana, Bitcoin, Ethereum)
 * - Derives accounts from the mnemonic using BIP44 paths
 * - Returns a complete Account object ready for use
 *
 * @param options - Account creation options
 * @returns Promise resolving to account and blockchain accounts
 *
 * @example
 * ```typescript
 * // Create account with all blockchains
 * const result = await createAccount({
 *   name: 'My Wallet',
 *   mnemonic: 'abandon abandon abandon...',
 *   networkIds: ['solana-mainnet', 'bitcoin-mainnet', 'ethereum-mainnet'],
 * });
 *
 * console.log(result.account.id); // 'uuid-here'
 * console.log(result.account.name); // 'My Wallet'
 * console.log(result.blockchainAccounts['solana-mainnet'][0]); // SolanaAccount
 * console.log(result.blockchainAccounts['bitcoin-mainnet'][0]); // BitcoinAccount
 * console.log(result.blockchainAccounts['ethereum-mainnet'][0]); // EthereumAccount
 * ```
 */
export async function createAccount(
  options: CreateAccountOptions
): Promise<CreateAccountResult> {
  const {
    id = generateAccountId(),
    name,
    avatar = getRandomAvatar(),
    mnemonic,
    networkIds = ['solana-mainnet'],
    startIndex = 0,
  } = options;

  const networksAccounts: NetworksAccounts = {};
  const pathIndexes: NetworkPathIndexes = {};

  // Create accounts for each requested network (supports Solana, Bitcoin, Ethereum)
  for (const networkId of networkIds) {
    try {
      const blockchainAccount = await createBlockchainAccountForNetwork(
        networkId,
        mnemonic,
        startIndex
      );

      if (!blockchainAccount) {
        console.warn(`Skipping unknown network: ${networkId}`);
        continue;
      }

      networksAccounts[networkId] = [blockchainAccount];
      pathIndexes[networkId] = [startIndex];
    } catch (error) {
      console.error(`Failed to create account for network ${networkId}:`, error);
      throw error;
    }
  }

  const account: Account = {
    id,
    name,
    avatar,
    mnemonic,
    pathIndexes,
    networksAccounts,
  };

  return { account, blockchainAccounts: networksAccounts };
}

/**
 * Generates an account name using a counter.
 *
 * @param counter - Current account counter (0-based)
 * @param template - Name template with `{{number}}` placeholder
 * @returns Formatted account name
 *
 * @example
 * ```typescript
 * generateAccountName(0); // 'Account #1'
 * generateAccountName(5); // 'Account #6'
 * generateAccountName(0, 'Wallet {{number}}'); // 'Wallet 1'
 * ```
 */
export function generateAccountName(
  counter: number,
  template: string = 'Account #{{number}}'
): string {
  return template.replace('{{number}}', String(counter + 1));
}

/**
 * Derives additional blockchain accounts for an existing account.
 * Useful for adding new networks or additional derivation paths.
 *
 * Supports Solana, Bitcoin, and Ethereum networks.
 *
 * @param mnemonic - BIP39 mnemonic phrase
 * @param networkId - Network to derive account for
 * @param index - Derivation index
 * @returns Promise resolving to blockchain account instance
 *
 * @example
 * ```typescript
 * // Derive Solana account
 * const solana = await deriveBlockchainAccount(mnemonic, 'solana-mainnet', 1);
 *
 * // Derive Bitcoin account
 * const bitcoin = await deriveBlockchainAccount(mnemonic, 'bitcoin-mainnet', 0);
 *
 * // Derive Ethereum account
 * const ethereum = await deriveBlockchainAccount(mnemonic, 'ethereum-mainnet', 0);
 * ```
 */
export async function deriveBlockchainAccount(
  mnemonic: string,
  networkId: string,
  index: number
): Promise<BlockchainAccount> {
  const blockchainAccount = await createBlockchainAccountForNetwork(
    networkId,
    mnemonic,
    index
  );

  if (!blockchainAccount) {
    throw new Error(`Unknown network: ${networkId}`);
  }

  return blockchainAccount;
}
