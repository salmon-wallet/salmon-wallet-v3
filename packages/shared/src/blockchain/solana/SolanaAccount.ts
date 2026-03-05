import {
  Connection,
  Keypair,
  PublicKey,
  Commitment,
  Message,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { SOLANA_NETWORKS } from './networks';
import {
  requiresMemo as checkRequiresMemo,
  calculateTransferFee as calcTransferFee,
  createTransfer,
  estimateFee as estimateSolanaFee,
  type TransferOptions as SolanaTransferOptions,
  type EstimateFeeOptions,
} from './transfer';
import { removeDecimals } from '../../utils/decimals';
import type { FeeEstimateResult } from '../../types/send';
import {
  getDomain as getDomainFromService,
  getDomainFromPublicKey as getDomainFromPublicKeyService,
  getPublicKeyFromDomain as getPublicKeyFromDomainService,
} from './domains';
import {
  validateDestinationAccount as validateDestination,
  type ValidationResult,
} from './validation';
import type { JupiterApiPriceData } from '../../types/price';
import { decorateBalancePrices, SOL_CONSTANTS } from '../../utils/balance';
import type { SolanaNetwork } from '../../types/blockchain';
import type { SolanaWalletBalance } from '../../types/balance';
import type { SolanaBalanceItem } from '../../types/transfer';
import type {
  FetchSolanaBalanceFn,
  FetchSolanaPricesFn,
  FetchSolanaTransactionFn,
  FetchSolanaTransactionsFn,
} from '../../types/transfer';
import type { FetchNftsFromBackendFn, Nft } from '../../types/nft';
import { getAll as getAllNftsFromService } from './nft';
import {
  getRecentTransactions as getRecentTransactionsService,
  type SolanaTransaction,
  type SolanaTransactionPaging,
  type SolanaTransactionListResponse,
} from './transactions';

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
  /** Function to fetch token balances (DI) */
  fetchBalance: FetchSolanaBalanceFn;
  /** Function to fetch token prices (DI) */
  fetchPrices: FetchSolanaPricesFn;
  /** Function to fetch a single transaction (DI) */
  fetchTransaction: FetchSolanaTransactionFn;
  /** Function to fetch transactions list (DI) */
  fetchTransactions: FetchSolanaTransactionsFn;
  /** Function to fetch NFTs from backend (DI) */
  fetchNfts: FetchNftsFromBackendFn;
}

/**
 * @deprecated Use `SolanaWalletBalance` from `types/balance` instead.
 */
export type SolanaBalance = SolanaWalletBalance;

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
  /** Injected function to fetch token balances */
  private fetchBalanceFn: FetchSolanaBalanceFn;
  /** Injected function to fetch token prices */
  private fetchPricesFn: FetchSolanaPricesFn;
  /** Injected function to fetch a single transaction */
  private fetchTransactionFn: FetchSolanaTransactionFn;
  /** Injected function to fetch transactions list */
  private fetchTransactionsFn: FetchSolanaTransactionsFn;
  /** Injected function to fetch NFTs from backend */
  private fetchNftsFn: FetchNftsFromBackendFn;

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
    this.fetchBalanceFn = options.fetchBalance;
    this.fetchPricesFn = options.fetchPrices;
    this.fetchTransactionFn = options.fetchTransaction;
    this.fetchTransactionsFn = options.fetchTransactions;
    this.fetchNftsFn = options.fetchNfts;
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

  // ==========================================================================
  // Balance Methods (DI-backed, mirrors BitcoinAccount)
  // ==========================================================================

  /**
   * Fetches the raw Solana balance items from the backend API.
   */
  private async fetchSolanaBalance(): Promise<SolanaBalanceItem[]> {
    return this.fetchBalanceFn(this.network.id, this.publicKey.toBase58());
  }

  /**
   * Gets Solana prices from Jupiter via the DI function.
   *
   * @param addresses - Token mint addresses to fetch prices for
   * @param hints - Optional map of address -> { coingeckoId } for CoinGecko fallback
   * @returns Map of address -> Jupiter price data
   */
  private async getPrices(
    addresses: string[],
    hints?: Map<string, { coingeckoId?: string }>
  ): Promise<Map<string, JupiterApiPriceData>> {
    try {
      return await this.fetchPricesFn(this.network.id, addresses, hints);
    } catch (e) {
      console.warn('Could not get Solana prices', (e as Error).message);
      return new Map();
    }
  }

  /**
   * Helper to calculate 24h change from balances.
   */
  private calculateLast24HoursChange(
    balances: SolanaBalanceItem[],
    usdTotal: number
  ): number {
    if (!usdTotal || usdTotal === 0) return 0;

    let previousTotal = 0;
    balances.forEach((balance) => {
      if (balance.usdBalance && balance.priceChange24h !== undefined) {
        const priceChangeFactor = 1 + balance.priceChange24h / 100;
        const previousBalance = balance.usdBalance / priceChangeFactor;
        previousTotal += previousBalance;
      } else if (balance.usdBalance) {
        previousTotal += balance.usdBalance;
      }
    });

    return previousTotal === 0 ? 0 : usdTotal - previousTotal;
  }

  /**
   * Gets the complete wallet balance with USD values and price info.
   * Uses injected DI functions to fetch balance and prices from the backend.
   *
   * @returns Promise resolving to wallet balance object
   */
  async getBalance(): Promise<SolanaWalletBalance> {
    const solanaBalance = await this.fetchSolanaBalance();

    // Extract all addresses for Jupiter price fetching
    const addresses = solanaBalance.map((b) => b.mint || SOL_CONSTANTS.ADDRESS);

    // Build hints map so CoinGecko fallback can use coingeckoId
    const hints = new Map<string, { coingeckoId?: string }>();
    solanaBalance.forEach((b) => {
      if (b.coingeckoId) {
        const addr = (b.mint || SOL_CONSTANTS.ADDRESS).toLowerCase();
        hints.set(addr, { coingeckoId: b.coingeckoId });
      }
    });

    const jupiterPrices = await this.getPrices(addresses, hints);

    const balances = decorateBalancePrices(
      solanaBalance.map((b) => ({
        mint: b.mint || SOL_CONSTANTS.ADDRESS,
        owner: this.publicKey.toBase58(),
        amount: b.amount,
        decimals: b.decimals,
        uiAmount: b.uiAmount || b.amount / Math.pow(10, b.decimals),
        symbol: b.symbol,
        name: b.name,
        logo: b.logo || undefined,
        address: b.mint || SOL_CONSTANTS.ADDRESS,
        coingeckoId: b.coingeckoId,
        tags: b.tags,
      })),
      null,
      jupiterPrices
    ) as SolanaBalanceItem[];

    // Sort: SOL first, then by usdBalance descending
    balances.sort((a, b) => {
      if (a.mint === SOL_CONSTANTS.ADDRESS) return -1;
      if (b.mint === SOL_CONSTANTS.ADDRESS) return 1;
      return (b.usdBalance || 0) - (a.usdBalance || 0);
    });

    if (jupiterPrices && jupiterPrices.size > 0) {
      const usdTotal = balances.reduce(
        (currentValue, next) => (next.usdBalance || 0) + currentValue,
        0
      );
      const last24HoursChange = this.calculateLast24HoursChange(balances, usdTotal);
      return { usdTotal, last24HoursChange, items: balances };
    }

    return { usdTotal: 0, last24HoursChange: 0, items: balances };
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
    return this.fetchTransactionFn(this.network.id, address, txId);
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
    return getRecentTransactionsService(this.network.id, address, paging, this.fetchTransactionsFn);
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
  // Transfer Methods
  // ==========================================================================

  /**
   * Creates and executes a transfer transaction for SOL or SPL tokens.
   *
   * @param to - Recipient address (base58)
   * @param token - Token mint address (SOL_ADDRESS for native SOL)
   * @param amount - Amount to transfer (human-readable)
   * @param opts - Transfer options (simulate, memo, decimals)
   * @returns Object containing the transaction ID
   */
  async transfer(
    to: string,
    token: string,
    amount: number,
    opts?: SolanaTransferOptions,
  ): Promise<{ txId: string }> {
    const connection = await this.getConnection();
    const result = await createTransfer(
      connection,
      this.keyPair,
      new PublicKey(to),
      token,
      amount,
      opts,
    );
    return { txId: result.txId as string };
  }

  /**
   * Estimates the fee for a transfer transaction.
   *
   * @param to - Recipient address (base58)
   * @param token - Token mint address
   * @param amount - Amount to transfer (human-readable)
   * @param opts - Estimation options
   * @returns Fee estimate result or null if estimation fails
   */
  async estimateTransferFee(
    to: string,
    token: string,
    amount: number,
    opts?: EstimateFeeOptions,
  ): Promise<FeeEstimateResult | null> {
    const connection = await this.getConnection();
    const fee = await estimateSolanaFee(
      connection,
      this.keyPair,
      new PublicKey(to),
      token,
      amount,
      opts,
    );
    if (fee === null) return null;
    const feeInSol = removeDecimals(fee, 9);
    return {
      fee: feeInSol.toFixed(9).replace(/0+$/, '').replace(/\.$/, ''),
    };
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
   * Uses Helius DAS API with backend fallback via injected fetchNfts.
   *
   * @returns Array of NFTs
   */
  async getAllNfts(): Promise<Nft[]> {
    return getAllNftsFromService(
      this.network,
      this.publicKey.toBase58(),
      false,
      this.fetchNftsFn,
    );
  }
}
