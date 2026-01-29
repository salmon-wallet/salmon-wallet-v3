import {
  Connection,
  Keypair,
  PublicKey,
  Commitment,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

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
  /** Network identifier (e.g., 'mainnet-beta', 'devnet', 'testnet') */
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
 * Balance information for a Solana account
 */
export interface SolanaBalance {
  /** Balance in lamports */
  lamports: bigint;
  /** Balance in SOL */
  sol: number;
}

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
   *
   * @returns Promise resolving to Connection instance
   */
  async getConnection(): Promise<Connection> {
    if (!this.connection) {
      const { nodeUrl, commitment = 'confirmed' } = this.network.config;
      this.connection = new Connection(nodeUrl, commitment);
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
}
