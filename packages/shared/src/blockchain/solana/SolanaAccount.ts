import {
  Connection,
  Keypair,
  PublicKey,
  Commitment,
  LAMPORTS_PER_SOL,
  Message,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { SOLANA_NETWORKS } from './factory';
import {
  requiresMemo as checkRequiresMemo,
  calculateTransferFee as calcTransferFee,
} from './transfer';
import {
  getDomain as getDomainFromService,
  getDomainFromPublicKey as getDomainFromPublicKeyService,
  getPublicKeyFromDomain as getPublicKeyFromDomainService,
} from './domains';
import {
  validateDestinationAccount as validateDestination,
  type ValidationResult,
} from './validation';
import {
  getSolanaTransaction,
  getSolanaTransactions,
} from '../../api/services/solana';
import type { SolanaNetworkId } from '../../types/blockchain';
import type { SolanaAccountBalance } from '../../types/balance';
import {
  getRecentTransactions as getRecentTransactionsService,
  type SolanaTransaction,
  type SolanaTransactionPaging,
  type SolanaTransactionListResponse,
} from './transactions';

/**
 * Network configuration for Solana connections
 */
export interface SolanaNetworkConfig {
  /** RPC endpoint URL */
  nodeUrl: string;
  /** WebSocket endpoint URL (optional) */
  wsUrl?: string;
  /** Network commitment level */
  commitment?: Commitment;
}

/**
 * Network definition with ID and configuration
 */
export interface SolanaNetwork {
  /** Network identifier (e.g., 'solana-mainnet', 'solana-devnet') */
  id: string;
  /** Human-readable network name */
  name: string;
  /** Network configuration */
  config: SolanaNetworkConfig;
}

/**
 * Options for creating a SolanaAccount instance
 */
export interface SolanaAccountOptions {
  /** Network configuration */
  network: SolanaNetwork;
  /** Account derivation index */
  index: number;
  /** BIP44 derivation path */
  path: string;
  /** Solana keypair for signing transactions */
  keyPair: Keypair;
}

/**
 * @deprecated Use `SolanaAccountBalance` from `types/balance` instead.
 */
export type SolanaBalance = SolanaAccountBalance;

// Re-export types from services for convenience
export type { SolanaTransactionPaging, SolanaTransactionListResponse, SolanaTransaction } from './transactions';

export type { ValidationResult };

/**
 * SolanaAccount provides core functionality for interacting with the Solana blockchain.
 * It manages a keypair and provides methods for querying balances and account information.
 *
 * Features:
 * - Lazy connection initialization for efficient resource usage
 * - Balance queries in both lamports and SOL
 * - Public key and address retrieval
 * - Secure private key access
 */
export class SolanaAccount {
  /** Network configuration */
  readonly network: SolanaNetwork;

  /** Account derivation index */
  readonly index: number;

  /** BIP44 derivation path used for key derivation */
  readonly path: string;

  /** Solana keypair for signing */
  readonly keyPair: Keypair;

  /** Public key derived from keypair */
  readonly publicKey: PublicKey;

  /** Cached connection instance (lazy initialized) */
  private connection: Connection | null = null;
  /** The nodeUrl used to create the current connection (for comparison) */
  private connectionNodeUrl: string | null = null;

  /**
   * Creates a new SolanaAccount instance
   *
   * @param options - Account configuration options
   */
  constructor(options: SolanaAccountOptions) {
    this.network = options.network;
    this.index = options.index;
    this.path = options.path;
    this.keyPair = options.keyPair;
    this.publicKey = options.keyPair.publicKey;
  }

  /**
   * Retrieves the private key encoded as base58 string.
   * WARNING: Handle with care - this exposes sensitive key material.
   *
   * @returns Base58-encoded secret key
   */
  retrieveSecurePrivateKey(): string {
    return bs58.encode(this.keyPair.secretKey);
  }

  /**
   * Gets or creates a connection to the Solana network.
   * Uses lazy initialization to avoid creating connections until needed.
   * Always uses the latest network configuration from SOLANA_NETWORKS to ensure
   * the RPC URL is up-to-date (may have been updated by fetchAndMergeNetworkConfigs).
   *
   * @returns Promise resolving to Connection instance
   */
  async getConnection(): Promise<Connection> {
    // Always get the latest network config from SOLANA_NETWORKS in case it was updated
    const latestNetwork = SOLANA_NETWORKS[this.network.id];
    const nodeUrl = latestNetwork?.config?.nodeUrl || this.network.config.nodeUrl;
    const commitment = latestNetwork?.config?.commitment || this.network.config.commitment || 'confirmed';
    
    // Recreate connection if nodeUrl changed or if connection doesn't exist
    if (!this.connection || this.connectionNodeUrl !== nodeUrl) {
      this.connection = new Connection(nodeUrl, commitment);
      this.connectionNodeUrl = nodeUrl;
    }
    return this.connection;
  }

  /**
   * Gets the account balance in lamports (raw value from chain).
   *
   * @returns Promise resolving to balance in lamports
   */
  async getCredit(): Promise<number> {
    const connection = await this.getConnection();
    return connection.getBalance(this.publicKey);
  }

  /**
   * Gets the account balance with both lamports and SOL values.
   *
   * @returns Promise resolving to balance object with lamports and SOL
   */
  async getBalance(): Promise<SolanaBalance> {
    const connection = await this.getConnection();
    const lamports = await connection.getBalance(this.publicKey);
    return {
      lamports: BigInt(lamports),
      sol: lamports / LAMPORTS_PER_SOL,
    };
  }

  /**
   * Gets the public key for this account.
   *
   * @returns The account's public key
   */
  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  /**
   * Gets the receive address (base58-encoded public key).
   *
   * @returns Base58-encoded public key string suitable for receiving funds
   */
  getReceiveAddress(): string {
    return this.publicKey.toBase58();
  }

  /**
   * Validates whether a given address is a valid Solana address.
   *
   * @param address - Address string to validate
   * @returns True if the address is valid, false otherwise
   */
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a PublicKey instance from an address string.
   *
   * @param address - Base58-encoded address string
   * @returns PublicKey instance
   * @throws Error if the address is invalid
   */
  static toPublicKey(address: string): PublicKey {
    return new PublicKey(address);
  }

  /**
   * Closes the connection and releases resources.
   * Call this when the account is no longer needed.
   */
  async disconnect(): Promise<void> {
    this.connection = null;
  }

  // ==========================================================================
  // Address Validation
  // ==========================================================================

  /**
   * Validates a destination address for transfers.
   * Checks if address is a valid public key or domain name.
   * Delegates to the validation service.
   *
   * @param address - Address or domain to validate
   * @returns Validation result with type, code, and address type
   */
  async validateDestinationAccount(address: string): Promise<ValidationResult> {
    const connection = await this.getConnection();
    return validateDestination(connection, address);
  }

  // ==========================================================================
  // Domain Name Services
  // ==========================================================================

  /**
   * Gets the domain name associated with this account.
   * Tries AllDomains first, then falls back to .sol domains.
   *
   * @returns Domain name or null if not found
   */
  async getDomain(): Promise<string | null> {
    const connection = await this.getConnection();
    return getDomainFromService(connection, this.publicKey);
  }

  /**
   * Gets the domain name for a given public key.
   * Tries AllDomains first, then falls back to .sol domains.
   *
   * @param publicKey - Public key to look up
   * @returns Domain name or null if not found
   */
  async getDomainFromPublicKey(publicKey: PublicKey | string): Promise<string | null> {
    const connection = await this.getConnection();
    const pk = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
    return getDomainFromPublicKeyService(connection, pk);
  }

  /**
   * Resolves a domain name to a public key.
   *
   * @param domain - Domain name to resolve (e.g., 'example.sol', 'example.abc')
   * @returns Base58-encoded public key or null if not found
   */
  async getPublicKeyFromDomain(domain: string): Promise<string | null> {
    const connection = await this.getConnection();
    return getPublicKeyFromDomainService(connection, domain);
  }

  // ==========================================================================
  // Transaction History
  // ==========================================================================

  /**
   * Gets a single transaction by ID.
   *
   * @param txId - Transaction ID (signature)
   * @returns Transaction data or null if not found
   */
  async getTransaction(txId: string): Promise<SolanaTransaction | null> {
    const address = this.publicKey.toBase58();
    return getSolanaTransaction(this.network.id as SolanaNetworkId, address, txId);
  }

  /**
   * Gets recent transactions for this account.
   *
   * @param paging - Optional paging parameters
   * @returns Transaction list with pagination
   */
  async getRecentTransactions(
    paging?: SolanaTransactionPaging
  ): Promise<SolanaTransactionListResponse> {
    const address = this.publicKey.toBase58();
    return getRecentTransactionsService(this.network.id, address, paging, getSolanaTransactions);
  }

  // ==========================================================================
  // Transfer Utilities
  // ==========================================================================

  /**
   * Checks if a destination token account requires a memo for transfers.
   * This is a Token-2022 feature.
   *
   * @param destination - Recipient's public key address
   * @param tokenAddress - Token mint address
   * @returns True if memo is required
   */
  async requiresMemo(
    destination: string,
    tokenAddress: string | null | undefined
  ): Promise<boolean> {
    const connection = await this.getConnection();
    return checkRequiresMemo(connection, new PublicKey(destination), tokenAddress);
  }

  /**
   * Calculates the transfer fee for Token-2022 tokens with transfer fee extension.
   *
   * @param mint - Token mint address
   * @param amount - Transfer amount (human-readable)
   * @returns Fee amount in token's smallest unit, or null if no fee
   */
  async calculateTransferFee(mint: string, amount: number): Promise<bigint | null> {
    const connection = await this.getConnection();
    return calcTransferFee(connection, mint, amount);
  }

  /**
   * Estimates the total fee for an array of transaction messages.
   *
   * @param messages - Array of transaction messages to estimate
   * @param commitment - Commitment level for fee estimation
   * @returns Total estimated fee in lamports
   */
  async estimateTransactionsFee(
    messages: Message[],
    commitment: Commitment = 'confirmed'
  ): Promise<number> {
    const connection = await this.getConnection();
    const feePromises = messages.map((message) =>
      connection.getFeeForMessage(message, commitment)
    );
    const results = await Promise.all(feePromises);
    return results
      .map(({ value }) => value ?? 0)
      .reduce((sum, fee) => sum + fee, 0);
  }

  // ==========================================================================
  // Not Supported Methods (delegated to separate services in v3)
  // ==========================================================================

  /**
   * Gets available tokens for the network.
   * @deprecated Use token list service directly
   * @throws Error indicating method is not supported
   */
  async getAvailableTokens(): Promise<never> {
    throw new Error('method_not_supported: Use token list service directly');
  }

  /**
   * Gets featured tokens for the network.
   * @deprecated Use token list service directly
   * @throws Error indicating method is not supported
   */
  async getFeaturedTokens(): Promise<never> {
    throw new Error('method_not_supported: Use token list service directly');
  }

  /**
   * Gets the best swap quote for a token pair.
   * @deprecated Use swap service directly
   * @throws Error indicating method is not supported
   */
  async getBestSwapQuote(): Promise<never> {
    throw new Error('method_not_supported: Use swap service directly');
  }

  /**
   * Creates a swap transaction.
   * @deprecated Use swap service directly
   * @throws Error indicating method is not supported
   */
  async createSwapTransaction(): Promise<never> {
    throw new Error('method_not_supported: Use swap service directly');
  }

  /**
   * Gets all NFTs for this account.
   * @deprecated Use getAllNfts from nft.ts directly
   * @throws Error indicating method is not supported
   */
  async getAllNfts(): Promise<never> {
    throw new Error('method_not_supported: Use getAllNfts from nft.ts directly');
  }
}
