import * as bitcoin from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import { get } from '../../api/client';
import { getPricesByPlatform, type TokenPrice } from '../../api/services/price';
import { decorateBalancePrices } from '../../api/services/balance';

/**
 * Bitcoin network environment types
 */
export type BitcoinEnvironment = 'mainnet' | 'testnet' | 'regtest';

/**
 * Network configuration for Bitcoin connections
 */
export interface BitcoinNetworkConfig {
  /** API endpoint URL for balance and transaction queries */
  apiUrl?: string;
  /** bitcoinjs-lib network configuration */
  network: bitcoin.Network;
}

/**
 * Network definition with ID and configuration
 */
export interface BitcoinNetwork {
  /** Network identifier (e.g., 'bitcoin', 'testnet') */
  id: string;
  /** Human-readable network name */
  name: string;
  /** Network environment type */
  environment: BitcoinEnvironment;
  /** Network configuration */
  config: BitcoinNetworkConfig;
}

/**
 * Bitcoin keypair containing public address and private key (WIF format)
 */
export interface BitcoinKeyPair {
  /** P2PKH address (legacy format starting with 1 or m/n) */
  address: string;
  /** Private key in Wallet Import Format (WIF) */
  privateKeyWIF: string;
  /** Raw public key (33 bytes compressed) */
  publicKey: Uint8Array;
}

/**
 * Options for creating a BitcoinAccount instance
 */
export interface BitcoinAccountOptions {
  /** Network configuration */
  network: BitcoinNetwork;
  /** Account derivation index */
  index: number;
  /** BIP44 derivation path */
  path: string;
  /** Bitcoin keypair for signing transactions */
  keyPair: BitcoinKeyPair;
  /** Original BIP32 node (for advanced operations) */
  node?: BIP32Interface;
}

/**
 * Simple balance information for a Bitcoin account (satoshis and BTC).
 * This is distinct from BitcoinBalance in the API service which has
 * confirmed/unconfirmed breakdown.
 */
export interface BitcoinAccountBalance {
  /** Balance in satoshis */
  satoshis: bigint;
  /** Balance in BTC */
  btc: number;
}

/**
 * Result of destination address validation
 */
export interface AddressValidationResult {
  /** Validation result type */
  type: 'SUCCESS' | 'ERROR';
  /** Validation code */
  code: string;
  /** Address type if valid */
  addressType?: string;
}

/**
 * Raw balance item from the API
 */
export interface BitcoinBalanceItem {
  /** Token/coin identifier */
  mint?: string;
  /** Balance amount in smallest unit */
  amount: number;
  /** Decimal places */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Logo URL */
  logo?: string;
  /** UI-formatted amount */
  uiAmount?: number;
  /** CoinGecko ID for price lookup */
  coingeckoId?: string;
  /** Current price in USD */
  price?: number;
  /** USD balance value */
  usdBalance?: number;
  /** 24h price change percentage */
  priceChange24h?: number;
}

/**
 * Wallet balance response with totals
 */
export interface BitcoinWalletBalance {
  /** Total USD value */
  usdTotal?: number;
  /** 24h change in USD */
  last24HoursChange?: number;
  /** Balance items */
  items: BitcoinBalanceItem[];
}

/**
 * Pagination parameters for transaction queries
 */
export interface TransactionPaging {
  /** Token for fetching next page */
  nextPageToken?: string;
  /** Number of items per page */
  pageSize?: number;
}

/**
 * Paginated transaction list response for account queries
 */
export interface AccountTransactionListResponse {
  /** List of transactions */
  items: AccountTransaction[];
  /** Token for next page (if more results exist) */
  nextPageToken?: string;
}

/**
 * Transaction details for display in account context.
 * This is a simplified view used by the UI layer.
 */
export interface AccountTransaction {
  /** Transaction ID (txid) */
  id: string;
  /** Transaction hash */
  hash?: string;
  /** Block height */
  blockHeight?: number;
  /** Confirmation count */
  confirmations?: number;
  /** Transaction timestamp */
  timestamp?: number;
  /** Transaction fee in satoshis */
  fee?: number;
  /** Transaction inputs */
  inputs?: AccountTransactionInput[];
  /** Transaction outputs */
  outputs?: AccountTransactionOutput[];
  /** Transaction amount (relative to account) */
  amount?: number;
  /** Transaction type (send/receive) */
  type?: 'send' | 'receive';
}

/**
 * Transaction input for account display
 */
export interface AccountTransactionInput {
  /** Previous transaction output address */
  address?: string;
  /** Amount in satoshis */
  value?: number;
  /** Previous transaction ID */
  txid?: string;
  /** Previous output index */
  vout?: number;
}

/**
 * Transaction output for account display
 */
export interface AccountTransactionOutput {
  /** Recipient address */
  address?: string;
  /** Amount in satoshis */
  value?: number;
  /** Output index */
  n?: number;
}

/**
 * Satoshis per Bitcoin constant
 */
export const SATOSHIS_PER_BTC = 100_000_000;

/**
 * BitcoinAccount provides core functionality for interacting with the Bitcoin blockchain.
 * It manages a keypair and provides methods for address retrieval and validation.
 *
 * Features:
 * - P2PKH (Pay-to-Public-Key-Hash) address support
 * - Address validation for multiple formats
 * - Secure private key access (WIF format)
 * - Network-aware address generation
 *
 * Note: Balance and transaction methods are designed to work with external API services
 * (like the Salmon API) since Bitcoin doesn't have a native RPC for balance queries.
 */
export class BitcoinAccount {
  /** Network configuration */
  readonly network: BitcoinNetwork;

  /** Account derivation index */
  readonly index: number;

  /** BIP44 derivation path used for key derivation */
  readonly path: string;

  /** Bitcoin keypair for signing */
  readonly keyPair: BitcoinKeyPair;

  /** P2PKH address derived from public key */
  readonly address: string;

  /** Original BIP32 node for advanced operations (optional) */
  private readonly node?: BIP32Interface;

  /**
   * Creates a new BitcoinAccount instance
   *
   * @param options - Account configuration options
   */
  constructor(options: BitcoinAccountOptions) {
    this.network = options.network;
    this.index = options.index;
    this.path = options.path;
    this.keyPair = options.keyPair;
    this.address = options.keyPair.address;
    this.node = options.node;
  }

  /**
   * Retrieves the private key in WIF (Wallet Import Format).
   * WARNING: Handle with care - this exposes sensitive key material.
   *
   * @returns WIF-encoded private key
   */
  retrieveSecurePrivateKey(): string {
    return this.keyPair.privateKeyWIF;
  }

  /**
   * Gets the public key for this account.
   *
   * @returns The account's public key as Uint8Array (33 bytes compressed)
   */
  getPublicKey(): Uint8Array {
    return this.keyPair.publicKey;
  }

  /**
   * Gets the receive address (P2PKH format).
   *
   * @returns P2PKH address string suitable for receiving funds
   */
  getReceiveAddress(): string {
    return this.address;
  }

  /**
   * Formats a Bitcoin address for display (shortened version).
   *
   * @param address - Full Bitcoin address
   * @param startChars - Number of characters to show at start (default: 8)
   * @param endChars - Number of characters to show at end (default: 8)
   * @returns Formatted address like "1A1zP1eP...b4Vr9HG"
   */
  static formatAddress(
    address: string,
    startChars: number = 8,
    endChars: number = 8
  ): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Validates whether a given address is a valid Bitcoin address.
   * Supports P2PKH (legacy), P2SH, and Bech32 (native SegWit) formats.
   *
   * @param address - Address string to validate
   * @param network - Optional network to validate against (defaults to mainnet)
   * @returns True if the address is valid, false otherwise
   */
  static isValidAddress(
    address: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ): boolean {
    try {
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates whether an address is valid for the account's network.
   *
   * @param address - Address string to validate
   * @returns True if the address is valid for this network, false otherwise
   */
  isValidAddressForNetwork(address: string): boolean {
    return BitcoinAccount.isValidAddress(address, this.network.config.network);
  }

  /**
   * Gets the address type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR).
   *
   * @param address - Address string to analyze
   * @param network - Optional network (defaults to mainnet)
   * @returns Address type string or null if invalid
   */
  static getAddressType(
    address: string,
    _network: bitcoin.Network = bitcoin.networks.bitcoin
  ): 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | null {
    try {
      // Legacy P2PKH addresses start with 1 (mainnet) or m/n (testnet)
      if (address.match(/^[1mn]/)) {
        bitcoin.address.fromBase58Check(address);
        return 'p2pkh';
      }

      // P2SH addresses start with 3 (mainnet) or 2 (testnet)
      if (address.match(/^[32]/)) {
        bitcoin.address.fromBase58Check(address);
        return 'p2sh';
      }

      // Bech32 addresses
      if (address.toLowerCase().startsWith('bc1') || address.toLowerCase().startsWith('tb1')) {
        const decoded = bitcoin.address.fromBech32(address);
        if (decoded.version === 0) {
          return decoded.data.length === 20 ? 'p2wpkh' : 'p2wsh';
        }
        if (decoded.version === 1 && decoded.data.length === 32) {
          return 'p2tr';
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Converts satoshis to BTC.
   *
   * @param satoshis - Amount in satoshis
   * @returns Amount in BTC
   */
  static satoshisToBtc(satoshis: number | bigint): number {
    return Number(satoshis) / SATOSHIS_PER_BTC;
  }

  /**
   * Converts BTC to satoshis.
   *
   * @param btc - Amount in BTC
   * @returns Amount in satoshis
   */
  static btcToSatoshis(btc: number): bigint {
    return BigInt(Math.floor(btc * SATOSHIS_PER_BTC));
  }

  // ============================================================================
  // Balance Methods
  // ============================================================================

  /**
   * Fetches the raw Bitcoin balance from the API.
   *
   * @returns Promise resolving to balance items array
   */
  private async fetchBitcoinBalance(): Promise<BitcoinBalanceItem[]> {
    const url = `/v1/${this.network.id}/account/${this.address}/balance`;

    const data = await get<BitcoinBalanceItem[]>(url, {
      params: { include: 'logo' },
    });

    return data.map((token) => ({
      ...token,
      uiAmount: token.amount / Math.pow(10, token.decimals),
      coingeckoId: 'bitcoin',
    }));
  }

  /**
   * Gets Bitcoin prices from the price service.
   *
   * @returns Token prices or null if unavailable
   */
  private async getPrices(): Promise<TokenPrice[] | null> {
    try {
      return await getPricesByPlatform('bitcoin');
    } catch (e) {
      console.log('Could not get Bitcoin prices', (e as Error).message);
      return null;
    }
  }

  /**
   * Helper to calculate 24h change from balances.
   *
   * @param balances - Balances with price info
   * @param usdTotal - Current total USD value
   * @returns 24h change amount
   */
  private calculateLast24HoursChange(
    balances: BitcoinBalanceItem[],
    usdTotal: number
  ): number {
    if (!usdTotal || usdTotal === 0) {
      return 0;
    }

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

    if (previousTotal === 0) {
      return 0;
    }

    return usdTotal - previousTotal;
  }

  /**
   * Gets the primary balance amount (in satoshis).
   *
   * @returns Promise resolving to balance in satoshis
   */
  async getCredit(): Promise<number> {
    const bitcoinBalance = await this.fetchBitcoinBalance();
    return bitcoinBalance[0]?.amount ?? 0;
  }

  /**
   * Gets the complete wallet balance with USD values and price info.
   *
   * @returns Promise resolving to wallet balance object
   */
  async getBalance(): Promise<BitcoinWalletBalance> {
    const bitcoinBalance = await this.fetchBitcoinBalance();
    const prices = await this.getPrices();

    // Use the shared decorator to add price info
    const balances = decorateBalancePrices(
      bitcoinBalance.map((b) => ({
        mint: b.mint || 'bitcoin',
        owner: this.address,
        amount: b.amount,
        decimals: b.decimals,
        uiAmount: b.uiAmount || b.amount / Math.pow(10, b.decimals),
        symbol: b.symbol,
        name: b.name,
        logo: b.logo || null,
        address: b.mint || 'bitcoin',
        coingeckoId: b.coingeckoId,
      })),
      prices
    ) as BitcoinBalanceItem[];

    if (prices) {
      const usdTotal = balances.reduce(
        (currentValue, next) => (next.usdBalance || 0) + currentValue,
        0
      );
      const last24HoursChange = this.calculateLast24HoursChange(balances, usdTotal);
      return { usdTotal, last24HoursChange, items: balances };
    }

    return { items: balances };
  }

  // ============================================================================
  // Address Validation Methods
  // ============================================================================

  /**
   * Validates a destination address for transfers.
   *
   * @param address - The destination address to validate
   * @returns Validation result object
   */
  async validateDestinationAccount(address: string): Promise<AddressValidationResult> {
    if (!address || address.trim() === '') {
      return {
        type: 'ERROR',
        code: 'INVALID_ADDRESS',
      };
    }

    const isValid = this.isValidAddressForNetwork(address);

    if (!isValid) {
      return {
        type: 'ERROR',
        code: 'INVALID_ADDRESS',
      };
    }

    const addressType = BitcoinAccount.getAddressType(address, this.network.config.network);

    return {
      type: 'SUCCESS',
      code: 'VALID_ACCOUNT',
      addressType: addressType?.toUpperCase() || 'PUBLIC_KEY',
    };
  }

  /**
   * Checks if transfers to a destination require a memo.
   * Bitcoin does not use memos.
   *
   * @param _destination - Destination address (unused)
   * @param _token - Token identifier (unused)
   * @returns Always returns false for Bitcoin
   */
  async requiresMemo(_destination?: string, _token?: string): Promise<boolean> {
    return false;
  }

  // ============================================================================
  // Transaction Methods
  // ============================================================================

  /**
   * Gets a single transaction by ID.
   *
   * @param id - Transaction ID (txid)
   * @returns Promise resolving to transaction details
   */
  async getTransaction(id: string): Promise<AccountTransaction> {
    const url = `/v1/${this.network.id}/account/${this.address}/transactions/${id}`;
    return get<AccountTransaction>(url);
  }

  /**
   * Gets recent transactions with pagination support.
   *
   * @param paging - Pagination parameters
   * @returns Promise resolving to paginated transaction list
   */
  async getRecentTransactions(
    paging?: TransactionPaging
  ): Promise<AccountTransactionListResponse> {
    const { nextPageToken, pageSize } = paging || {};

    const url = `/v1/${this.network.id}/account/${this.address}/transactions`;

    const params: Record<string, string | number> = {};
    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }
    if (pageSize) {
      params.pageSize = pageSize;
    }

    return get<AccountTransactionListResponse>(url, { params });
  }

  // ============================================================================
  // Unsupported Methods (throw 'method_not_supported')
  // ============================================================================

  /**
   * Gets domain for this account.
   * Not supported for Bitcoin.
   *
   * @throws 'method_not_supported'
   */
  async getDomain(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets domain from a public key.
   * Not supported for Bitcoin.
   *
   * @param _publicKey - Public key (unused)
   * @throws 'method_not_supported'
   */
  async getDomainFromPublicKey(_publicKey: string): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets public key from a domain.
   * Not supported for Bitcoin.
   *
   * @param _domain - Domain name (unused)
   * @throws 'method_not_supported'
   */
  async getPublicKeyFromDomain(_domain: string): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets all NFTs for this account.
   * Not supported for Bitcoin.
   *
   * @returns null (Bitcoin doesn't support NFTs in this context)
   */
  async getAllNfts(): Promise<null> {
    return null;
  }

  /**
   * Gets available tokens.
   * Not supported for Bitcoin.
   *
   * @throws 'method_not_supported'
   */
  async getAvailableTokens(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets featured tokens.
   * Not supported for Bitcoin.
   *
   * @throws 'method_not_supported'
   */
  async getFeaturedTokens(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets best swap quote.
   * Not supported for Bitcoin.
   *
   * @param _tokenInId - Input token ID (unused)
   * @param _tokenOutId - Output token ID (unused)
   * @param _amount - Amount to swap (unused)
   * @param _slippage - Slippage tolerance (unused)
   * @throws 'method_not_supported'
   */
  async getBestSwapQuote(
    _tokenInId: string,
    _tokenOutId: string,
    _amount: number,
    _slippage?: number
  ): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Expires a swap quote.
   * Not supported for Bitcoin.
   *
   * @param _quote - Quote to expire (unused)
   * @throws 'method_not_supported'
   */
  async expireSwapQuote(_quote: unknown): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Creates a swap transaction.
   * Not supported for Bitcoin.
   *
   * @param _quote - Swap quote (unused)
   * @param _tokenInId - Input token ID (unused)
   * @param _tokenOutId - Output token ID (unused)
   * @param _amount - Amount to swap (unused)
   * @throws 'method_not_supported'
   */
  async createSwapTransaction(
    _quote: unknown,
    _tokenInId: string,
    _tokenOutId: string,
    _amount: number
  ): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Calculates transfer fee.
   * Returns null for Bitcoin (fee is calculated at transaction creation time).
   *
   * @param _mint - Token mint (unused)
   * @param _amount - Transfer amount (unused)
   * @returns null
   */
  async calculateTransferFee(_mint?: string, _amount?: number): Promise<null> {
    return null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Creates a BitcoinAccountBalance object from satoshis.
   * Utility method for services that fetch balance data.
   *
   * @param satoshis - Balance in satoshis
   * @returns BitcoinAccountBalance object with satoshis and btc values
   */
  static createBalance(satoshis: number | bigint): BitcoinAccountBalance {
    const satoshisBigInt = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis);
    return {
      satoshis: satoshisBigInt,
      btc: BitcoinAccount.satoshisToBtc(satoshisBigInt),
    };
  }

  /**
   * Gets the BIP32 node if available.
   * Used for advanced operations like signing.
   *
   * @returns BIP32Interface node or undefined
   */
  getBip32Node(): BIP32Interface | undefined {
    return this.node;
  }
}
