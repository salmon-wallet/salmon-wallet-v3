/**
 * Account utilities for wallet derivation path handling and blockchain type detection.
 */

import type { SolanaAccount } from '../blockchain/solana';
import type { BitcoinAccount } from '../blockchain/bitcoin';
import type { EthereumAccount } from '../blockchain/ethereum';
import { createSolanaAccount, SOLANA_NETWORKS } from '../blockchain/solana';
import { createBitcoinAccount, BITCOIN_NETWORKS } from '../blockchain/bitcoin';
import { createEthereumAccount, ETHEREUM_NETWORKS } from '../blockchain/ethereum';
import { bitcoinApiFunctions } from '../api/services/bitcoin-account';
import type { BlockchainAccount, BlockchainType } from '../types/blockchain';
import type { Account } from '../types/account';
import type { AccountKeyInfo } from '../types/settings';

// ============================================================================
// Blockchain Type Detection from Network ID
// ============================================================================

/**
 * Determines the blockchain type from a network ID string.
 *
 * @param networkId - Network identifier (e.g., 'solana-mainnet', 'bitcoin-testnet', 'ethereum-sepolia')
 * @returns The blockchain type ('solana', 'bitcoin', or 'ethereum')
 */
export function getBlockchainFromNetworkId(networkId: string): BlockchainType {
  if (networkId.startsWith('bitcoin')) return 'bitcoin';
  if (networkId.startsWith('ethereum')) return 'ethereum';
  return 'solana';
}

/**
 * Returns the human-readable display name for a blockchain type.
 */
export function getChainDisplayName(chain?: BlockchainType | string): string {
  switch (chain) {
    case 'bitcoin': return 'Bitcoin';
    case 'ethereum': return 'Ethereum';
    case 'solana':
    default: return 'Solana';
  }
}

// ============================================================================
// Account Type Detection (duck typing)
// ============================================================================

/**
 * Detects the blockchain type from an account instance using duck typing.
 *
 * @param account - The blockchain account to identify
 * @returns The blockchain type ('solana', 'bitcoin', or 'ethereum')
 */
export function getAccountBlockchainType(account: BlockchainAccount): BlockchainType {
  // Check for SolanaAccount - has getConnection and getPublicKey returns PublicKey (object with toBase58)
  if ('getConnection' in account && 'getPublicKey' in account) {
    const publicKey = account.getPublicKey();
    if (typeof publicKey === 'object' && publicKey !== null && 'toBase58' in publicKey) {
      return 'solana';
    }
    // EthereumAccount has getConnection but getPublicKey returns string
    if (typeof publicKey === 'string') {
      return 'ethereum';
    }
  }

  // Check for BitcoinAccount - has keyPair property
  if ('keyPair' in account) {
    return 'bitcoin';
  }

  // Check for EthereumAccount - has wallet property
  if ('wallet' in account) {
    return 'ethereum';
  }

  // Default to Solana for backwards compatibility
  return 'solana';
}

/**
 * Type guard to check if account is a SolanaAccount.
 */
export function isSolanaAccount(account: BlockchainAccount): account is SolanaAccount {
  return getAccountBlockchainType(account) === 'solana';
}

/**
 * Type guard to check if account is a BitcoinAccount.
 */
export function isBitcoinAccount(account: BlockchainAccount): account is BitcoinAccount {
  return getAccountBlockchainType(account) === 'bitcoin';
}

/**
 * Type guard to check if account is an EthereumAccount.
 */
export function isEthereumAccount(account: BlockchainAccount): account is EthereumAccount {
  return getAccountBlockchainType(account) === 'ethereum';
}

// ============================================================================
// ID & Name Generation
// ============================================================================

/**
 * Generates a unique identifier for an account.
 * Uses crypto.randomUUID() if available, falls back to timestamp + random.
 */
export function generateAccountId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates an account name using a counter.
 *
 * @example
 * generateAccountName(0); // 'Account #1'
 * generateAccountName(5); // 'Account #6'
 * generateAccountName(0, 'Wallet {{number}}'); // 'Wallet 1'
 */
export function generateAccountName(
  counter: number,
  template: string = 'Account #{{number}}'
): string {
  return template.replace('{{number}}', String(counter + 1));
}

// ============================================================================
// Blockchain Account Routing
// ============================================================================

/**
 * Creates a blockchain account for a specific network.
 * Routes to the appropriate blockchain factory based on the network ID.
 *
 * @param networkId - The network identifier (e.g., 'solana-mainnet', 'bitcoin-testnet')
 * @param mnemonic - BIP39 mnemonic phrase
 * @param index - Account derivation index
 * @returns Promise resolving to the blockchain account, or null if network not found
 */
export async function createBlockchainAccountForNetwork(
  networkId: string,
  mnemonic: string,
  index: number
): Promise<BlockchainAccount | null> {
  const blockchainType = getBlockchainFromNetworkId(networkId);

  switch (blockchainType) {
    case 'bitcoin': {
      const network = BITCOIN_NETWORKS[networkId];
      if (!network) {
        console.warn(`Unknown Bitcoin network: ${networkId}`);
        return null;
      }
      return createBitcoinAccount({ network, mnemonic, index, apiFunctions: bitcoinApiFunctions });
    }

    case 'ethereum': {
      const network = ETHEREUM_NETWORKS[networkId];
      if (!network) {
        console.warn(`Unknown Ethereum network: ${networkId}`);
        return null;
      }
      return createEthereumAccount({ network, mnemonic, index });
    }

    case 'solana':
    default: {
      const network = SOLANA_NETWORKS[networkId];
      if (!network) {
        console.warn(`Unknown Solana network: ${networkId}`);
        return null;
      }
      return createSolanaAccount({ network, mnemonic, index });
    }
  }
}

// ============================================================================
// Derivation Path Utilities
// ============================================================================

/**
 * Extracts the account index from a BIP44 derivation path.
 *
 * BIP44 paths follow the format: m / purpose' / coin_type' / account' / change / address_index
 * For Solana (coin type 501): m/44'/501'/account'/0'
 *
 * @param path - The BIP44 derivation path string (e.g., "m/44'/501'/0'/0'")
 * @returns The account index as a number, or undefined if the path is invalid
 *
 * @example
 * // Returns 0
 * getPathIndex("m/44'/501'/0'/0'")
 *
 * @example
 * // Returns 5
 * getPathIndex("m/44'/501'/5'/0'")
 *
 * @example
 * // Returns undefined for invalid paths
 * getPathIndex("invalid-path")
 */
export function getPathIndex(path: string): number | undefined {
  const index = Number(path?.split('/')?.[3]?.replace("'", ''));
  return !isNaN(index) ? index : undefined;
}

// ============================================================================
// Private Key Reveal Utilities
// ============================================================================

/**
 * Builds a network list from an account's networksAccounts, filtering out
 * networks that have no loaded accounts.
 *
 * Shared between mobile and extension private key reveal screens.
 */
export function buildNetworkListFromAccount(
  activeAccount: Account | null | undefined,
): Array<{ id: string; name: string; blockchain: string }> {
  if (!activeAccount?.networksAccounts) return [];

  return Object.keys(activeAccount.networksAccounts)
    .filter((id) => {
      const accounts = activeAccount.networksAccounts[id];
      return accounts && accounts.some((a) => a !== null);
    })
    .map((id) => {
      const blockchain = getBlockchainFromNetworkId(id);
      const name = id
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      return { id, name, blockchain };
    });
}

/**
 * Extracts AccountKeyInfo (path, address, privateKey) for every non-null
 * account in a specific network.
 *
 * Shared between mobile and extension private key reveal screens.
 */
export function getAccountKeysForNetwork(
  activeAccount: Account | null | undefined,
  networkId: string | null,
): AccountKeyInfo[] {
  if (!networkId || !activeAccount?.networksAccounts) return [];
  const networkAccounts = activeAccount.networksAccounts[networkId];
  if (!networkAccounts) return [];

  return networkAccounts
    .filter((account): account is NonNullable<typeof account> => account !== null)
    .map((account) => ({
      path: account.path,
      address: account.getReceiveAddress(),
      privateKey: account.retrieveSecurePrivateKey(),
    }));
}
