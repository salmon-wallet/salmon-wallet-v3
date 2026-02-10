import { Keypair } from '@solana/web3.js';
import HDKey from 'micro-key-producer/slip10.js';
import { SolanaAccount, SolanaNetwork } from './SolanaAccount';
import {
  mnemonicToSeed,
  COIN_TYPES,
  SOLANA_PATH,
} from '../../crypto/mnemonic';

/**
 * SLIP-0044 coin type for Solana
 * Re-exported from crypto/mnemonic for convenience
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export const SOLANA_COIN_TYPE = COIN_TYPES.SOL;

/**
 * Options for creating a Solana account from mnemonic
 */
export interface CreateSolanaAccountOptions {
  /** Network configuration */
  network: SolanaNetwork;
  /** BIP39 mnemonic phrase */
  mnemonic: string;
  /** Account derivation index (defaults to 0) */
  index?: number;
}

/**
 * Options for deriving multiple accounts from a single mnemonic
 */
export interface DeriveAccountsOptions {
  /** Network configuration */
  network: SolanaNetwork;
  /** BIP39 mnemonic phrase */
  mnemonic: string;
  /** Starting index for derivation (defaults to 0) */
  startIndex?: number;
  /** Number of accounts to derive (defaults to 1) */
  count?: number;
}

/**
 * Generates the BIP44 derivation path for Solana accounts.
 *
 * Uses the standard Solana derivation path format:
 * m/44'/501'/{index}'/0'
 *
 * @param index - Account index
 * @returns BIP44 derivation path string
 */
export function getSolanaDerivationPath(index: number): string {
  return SOLANA_PATH(index);
}

/**
 * Generates a Solana keypair from mnemonic and derivation path.
 *
 * Uses micro-key-producer's SLIP-0010 implementation which is:
 * - Browser/React Native compatible (no Node.js Buffer dependency)
 * - Uses audited @noble/ed25519 under the hood
 * - Based on audited code from scure-bip32
 *
 * @param mnemonic - BIP39 mnemonic phrase
 * @param path - BIP44 derivation path
 * @returns Promise resolving to Solana Keypair
 */
export async function generateKeyPair(
  mnemonic: string,
  path: string
): Promise<Keypair> {
  const seed = await mnemonicToSeed(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(path);

  return Keypair.fromSeed(derived.privateKey);
}

/**
 * Creates a SolanaAccount instance from a mnemonic phrase.
 *
 * This is the primary factory function for creating Solana accounts.
 * It derives the keypair from the mnemonic using the standard BIP44 path
 * for Solana (m/44'/501'/{index}'/0').
 *
 * @param options - Account creation options
 * @returns Promise resolving to SolanaAccount instance
 *
 * @example
 * ```typescript
 * const account = await createSolanaAccount({
 *   network: mainnetNetwork,
 *   mnemonic: 'your twelve word mnemonic phrase here...',
 *   index: 0
 * });
 *
 * const balance = await account.getBalance();
 * console.log(`Balance: ${balance.sol} SOL`);
 * ```
 */
export async function createSolanaAccount(
  options: CreateSolanaAccountOptions
): Promise<SolanaAccount> {
  const { network, mnemonic, index = 0 } = options;

  const path = getSolanaDerivationPath(index);
  const keyPair = await generateKeyPair(mnemonic, path);

  return new SolanaAccount({
    network,
    index,
    path,
    keyPair,
  });
}

/**
 * Derives multiple Solana accounts from a single mnemonic.
 *
 * Useful for implementing account discovery or allowing users
 * to manage multiple accounts from the same seed.
 *
 * @param options - Derivation options
 * @returns Promise resolving to array of SolanaAccount instances
 *
 * @example
 * ```typescript
 * // Derive 5 accounts starting from index 0
 * const accounts = await deriveSolanaAccounts({
 *   network: mainnetNetwork,
 *   mnemonic: 'your mnemonic...',
 *   startIndex: 0,
 *   count: 5
 * });
 * ```
 */
export async function deriveSolanaAccounts(
  options: DeriveAccountsOptions
): Promise<SolanaAccount[]> {
  const { network, mnemonic, startIndex = 0, count = 1 } = options;

  const accounts: SolanaAccount[] = [];

  for (let i = 0; i < count; i++) {
    const account = await createSolanaAccount({
      network,
      mnemonic,
      index: startIndex + i,
    });
    accounts.push(account);
  }

  return accounts;
}

/**
 * Creates a SolanaAccount from an existing keypair.
 *
 * Use this when you already have a keypair (e.g., imported from a file
 * or generated elsewhere) and want to wrap it in a SolanaAccount.
 *
 * @param network - Network configuration
 * @param keyPair - Existing Solana Keypair
 * @param index - Optional account index (defaults to 0)
 * @returns SolanaAccount instance
 */
export function createSolanaAccountFromKeyPair(
  network: SolanaNetwork,
  keyPair: Keypair,
  index: number = 0
): SolanaAccount {
  return new SolanaAccount({
    network,
    index,
    path: getSolanaDerivationPath(index),
    keyPair,
  });
}

/**
 * Creates a SolanaAccount from a base58-encoded secret key.
 *
 * @param network - Network configuration
 * @param secretKey - Base58-encoded secret key string
 * @param index - Optional account index (defaults to 0)
 * @returns SolanaAccount instance
 */
export function createSolanaAccountFromSecretKey(
  network: SolanaNetwork,
  secretKey: Uint8Array,
  index: number = 0
): SolanaAccount {
  const keyPair = Keypair.fromSecretKey(secretKey);
  return createSolanaAccountFromKeyPair(network, keyPair, index);
}

/**
 * Pre-defined network configurations for common Solana networks
 */
export const SOLANA_NETWORKS: Record<string, SolanaNetwork> = {
  'mainnet-beta': {
    id: 'mainnet-beta',
    name: 'Mainnet Beta',
    config: {
      nodeUrl: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
    },
  },
  devnet: {
    id: 'devnet',
    name: 'Devnet',
    config: {
      nodeUrl: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
    },
  },
};
