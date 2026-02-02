/**
 * Account Factory - Creates accounts with blockchain accounts
 *
 * This factory consolidates account creation logic, similar to V2's
 * account-factory.js but adapted for V3's TypeScript architecture.
 *
 * @module factories/account-factory
 */

import { getRandomAvatar } from '../utils/avatar';
import {
  createSolanaAccount,
  SOLANA_NETWORKS,
  type SolanaAccount,
} from '../blockchain/solana';
import type {
  Account,
  NetworksAccounts,
  NetworkPathIndexes,
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
  /** Network IDs to create accounts for (defaults to ['mainnet-beta']) */
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
 * Creates an Account with derived blockchain accounts.
 *
 * This function:
 * - Generates a unique ID if not provided
 * - Creates blockchain accounts for specified networks
 * - Derives accounts from the mnemonic using BIP44 paths
 * - Returns a complete Account object ready for use
 *
 * @param options - Account creation options
 * @returns Promise resolving to account and blockchain accounts
 *
 * @example
 * ```typescript
 * const result = await createAccount({
 *   name: 'My Wallet',
 *   mnemonic: 'abandon abandon abandon...',
 *   networkIds: ['mainnet-beta', 'devnet'],
 * });
 *
 * console.log(result.account.id); // 'uuid-here'
 * console.log(result.account.name); // 'My Wallet'
 * console.log(result.blockchainAccounts['mainnet-beta'][0]); // SolanaAccount instance
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
    networkIds = ['mainnet-beta'],
    startIndex = 0,
  } = options;

  const networksAccounts: NetworksAccounts = {};
  const pathIndexes: NetworkPathIndexes = {};

  // Create Solana accounts for each requested network
  for (const networkId of networkIds) {
    const network = SOLANA_NETWORKS[networkId];
    if (!network) {
      console.warn(`Unknown network: ${networkId}, skipping`);
      continue;
    }

    try {
      const solanaAccount = await createSolanaAccount({
        network,
        mnemonic,
        index: startIndex,
      });

      networksAccounts[networkId] = [solanaAccount];
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
 * @param mnemonic - BIP39 mnemonic phrase
 * @param networkId - Network to derive account for
 * @param index - Derivation index
 * @returns Promise resolving to SolanaAccount instance
 *
 * @example
 * ```typescript
 * const account = await deriveBlockchainAccount(
 *   mnemonic,
 *   'mainnet-beta',
 *   1 // Second account (index 1)
 * );
 * ```
 */
export async function deriveBlockchainAccount(
  mnemonic: string,
  networkId: string,
  index: number
): Promise<SolanaAccount> {
  const network = SOLANA_NETWORKS[networkId];
  if (!network) {
    throw new Error(`Unknown network: ${networkId}`);
  }

  return createSolanaAccount({
    network,
    mnemonic,
    index,
  });
}
