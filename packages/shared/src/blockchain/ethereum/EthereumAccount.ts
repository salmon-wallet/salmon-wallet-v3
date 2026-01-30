import { JsonRpcProvider, Wallet, isAddress, getAddress } from 'ethers';

/**
 * Ethereum network environment types
 */
export type EthereumEnvironment = 'mainnet' | 'goerli' | 'sepolia';

/**
 * Network configuration for Ethereum connections
 */
export interface EthereumNetworkConfig {
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Chain ID */
  chainId: number;
}

/**
 * Network definition with ID and configuration
 */
export interface EthereumNetwork {
  /** Network identifier (e.g., 'ethereum', 'goerli', 'sepolia') */
  id: string;
  /** Human-readable network name */
  name: string;
  /** Network environment type */
  environment: EthereumEnvironment;
  /** Network configuration */
  config: EthereumNetworkConfig;
}

/**
 * Options for creating an EthereumAccount instance
 */
export interface EthereumAccountOptions {
  /** Network configuration */
  network: EthereumNetwork;
  /** Account derivation index */
  index: number;
  /** BIP44 derivation path */
  path: string;
  /** ethers.js Wallet instance for signing transactions */
  wallet: Wallet;
}

/**
 * Balance information for an Ethereum account
 */
export interface EthereumBalance {
  /** Balance in wei */
  wei: bigint;
  /** Balance in ETH */
  eth: number;
}

/**
 * Result of destination address validation for Ethereum
 */
export interface EthereumAddressValidationResult {
  /** Validation result type */
  type: 'SUCCESS' | 'ERROR';
  /** Validation code */
  code: string;
  /** Address type if valid (EOA or CONTRACT) */
  addressType?: string;
}

/**
 * Wei per ETH constant
 */
export const WEI_PER_ETH = BigInt('1000000000000000000');

/**
 * EthereumAccount provides core functionality for interacting with the Ethereum blockchain.
 * It manages a wallet (keypair) and provides methods for address retrieval and validation.
 *
 * Features:
 * - Lazy connection initialization for efficient resource usage
 * - Address validation using ethers.js
 * - Secure private key access
 * - Network-aware provider connections
 *
 * Note: Balance and transaction methods are designed to work with external API services
 * or will be implemented in separate service modules.
 */
export class EthereumAccount {
  /** Network configuration */
  readonly network: EthereumNetwork;

  /** Account derivation index */
  readonly index: number;

  /** BIP44 derivation path used for key derivation */
  readonly path: string;

  /** ethers.js Wallet instance for signing */
  readonly wallet: Wallet;

  /** Public key derived from wallet */
  readonly publicKey: string;

  /** Cached provider instance (lazy initialized) */
  private provider: JsonRpcProvider | null = null;

  /** Cached connected wallet instance */
  private connectedWallet: Wallet | null = null;

  /**
   * Creates a new EthereumAccount instance
   *
   * @param options - Account configuration options
   */
  constructor(options: EthereumAccountOptions) {
    this.network = options.network;
    this.index = options.index;
    this.path = options.path;
    this.wallet = options.wallet;
    this.publicKey = options.wallet.signingKey.publicKey;
  }

  /**
   * Retrieves the private key as a hex string.
   * WARNING: Handle with care - this exposes sensitive key material.
   *
   * @returns Hex-encoded private key (with 0x prefix)
   */
  retrieveSecurePrivateKey(): string {
    return this.wallet.privateKey;
  }

  /**
   * Gets the public key for this account.
   *
   * @returns The account's public key (hex string with 0x prefix)
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Gets or creates a connection to the Ethereum network.
   * Uses lazy initialization to avoid creating connections until needed.
   *
   * @returns Promise resolving to a connected Wallet instance
   */
  async getConnection(): Promise<Wallet> {
    if (!this.connectedWallet) {
      const { rpcUrl, chainId } = this.network.config;
      this.provider = new JsonRpcProvider(rpcUrl, chainId);
      this.connectedWallet = this.wallet.connect(this.provider);
    }
    return this.connectedWallet;
  }

  /**
   * Gets the JsonRpcProvider for direct provider access.
   *
   * @returns Promise resolving to JsonRpcProvider instance
   */
  async getProvider(): Promise<JsonRpcProvider> {
    if (!this.provider) {
      await this.getConnection();
    }
    return this.provider!;
  }

  /**
   * Gets the receive address (checksummed Ethereum address).
   *
   * @returns Checksummed Ethereum address string suitable for receiving funds
   */
  getReceiveAddress(): string {
    return this.wallet.address;
  }

  /**
   * Gets the account balance in wei (raw value from chain).
   * This is a placeholder - actual balance fetching will be in a balance service.
   *
   * @returns Promise resolving to balance in wei
   */
  async getCredit(): Promise<bigint> {
    const connection = await this.getConnection();
    const balance = await connection.provider!.getBalance(this.wallet.address);
    return balance;
  }

  /**
   * Gets the account balance with both wei and ETH values.
   * This is a placeholder - actual balance fetching will be in a balance service.
   *
   * @returns Promise resolving to balance object with wei and ETH
   */
  async getBalance(): Promise<EthereumBalance> {
    const wei = await this.getCredit();
    return {
      wei,
      eth: EthereumAccount.weiToEth(wei),
    };
  }

  /**
   * Validates whether a given address is a valid Ethereum address.
   *
   * @param address - Address string to validate
   * @returns True if the address is valid, false otherwise
   */
  static isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Formats an Ethereum address for display (shortened version).
   *
   * @param address - Full Ethereum address
   * @param startChars - Number of characters to show at start (default: 6)
   * @param endChars - Number of characters to show at end (default: 4)
   * @returns Formatted address like "0x1234...5678"
   */
  static formatAddress(
    address: string,
    startChars: number = 6,
    endChars: number = 4
  ): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Converts an address to checksummed format.
   *
   * @param address - Address string to convert
   * @returns Checksummed address
   * @throws Error if the address is invalid
   */
  static toChecksumAddress(address: string): string {
    return getAddress(address);
  }

  /**
   * Validates whether an address is valid for the account's network.
   *
   * @param address - Address string to validate
   * @returns True if the address is valid, false otherwise
   */
  isValidAddressForNetwork(address: string): boolean {
    return EthereumAccount.isValidAddress(address);
  }

  /**
   * Converts wei to ETH.
   *
   * @param wei - Amount in wei
   * @returns Amount in ETH
   */
  static weiToEth(wei: bigint): number {
    return Number(wei) / Number(WEI_PER_ETH);
  }

  /**
   * Converts ETH to wei.
   *
   * @param eth - Amount in ETH
   * @returns Amount in wei
   */
  static ethToWei(eth: number): bigint {
    return BigInt(Math.floor(eth * Number(WEI_PER_ETH)));
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
  async validateDestinationAccount(address: string): Promise<EthereumAddressValidationResult> {
    if (!address || address.trim() === '') {
      return {
        type: 'ERROR',
        code: 'INVALID_ADDRESS',
      };
    }

    const isValid = EthereumAccount.isValidAddress(address);

    if (!isValid) {
      return {
        type: 'ERROR',
        code: 'INVALID_ADDRESS',
      };
    }

    // Check if it's a contract address
    const provider = await this.getProvider();
    const code = await provider.getCode(address);
    const isContract = code !== '0x';

    return {
      type: 'SUCCESS',
      code: 'VALID_ACCOUNT',
      addressType: isContract ? 'CONTRACT' : 'EOA',
    };
  }

  /**
   * Checks if transfers to a destination require a memo.
   * Ethereum does not use memos in the same way as other chains.
   *
   * @param _destination - Destination address (unused)
   * @param _token - Token identifier (unused)
   * @returns Always returns false for Ethereum
   */
  async requiresMemo(_destination?: string, _token?: string): Promise<boolean> {
    return false;
  }

  /**
   * Closes the connection and releases resources.
   * Call this when the account is no longer needed.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
    }
    this.provider = null;
    this.connectedWallet = null;
  }

  // ============================================================================
  // Unsupported Methods (throw 'method_not_supported')
  // ============================================================================

  /**
   * Gets domain for this account (ENS).
   * Will be implemented in a separate service.
   *
   * @throws 'method_not_supported'
   */
  async getDomain(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets domain from an address (ENS reverse lookup).
   * Will be implemented in a separate service.
   *
   * @param _address - Address (unused)
   * @throws 'method_not_supported'
   */
  async getDomainFromPublicKey(_address: string): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets address from a domain (ENS lookup).
   * Will be implemented in a separate service.
   *
   * @param _domain - Domain name (unused)
   * @throws 'method_not_supported'
   */
  async getPublicKeyFromDomain(_domain: string): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets all NFTs for this account.
   * Will be implemented in a separate service.
   *
   * @returns null
   */
  async getAllNfts(): Promise<null> {
    return null;
  }

  /**
   * Gets available tokens.
   * Will be implemented in a separate service.
   *
   * @throws 'method_not_supported'
   */
  async getAvailableTokens(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets featured tokens.
   * Will be implemented in a separate service.
   *
   * @throws 'method_not_supported'
   */
  async getFeaturedTokens(): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Gets best swap quote.
   * Will be implemented in a separate service.
   *
   * @param _tokenInAddress - Input token address (unused)
   * @param _tokenOutAddress - Output token address (unused)
   * @param _amount - Amount to swap (unused)
   * @param _slippage - Slippage tolerance (unused)
   * @throws 'method_not_supported'
   */
  async getBestSwapQuote(
    _tokenInAddress: string,
    _tokenOutAddress: string,
    _amount: number,
    _slippage?: number
  ): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Expires a swap quote.
   * Will be implemented in a separate service.
   *
   * @param _quote - Quote to expire (unused)
   * @throws 'method_not_supported'
   */
  async expireSwapQuote(_quote: unknown): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Creates a swap transaction.
   * Will be implemented in a separate service.
   *
   * @param _quote - Swap quote (unused)
   * @throws 'method_not_supported'
   */
  async createSwapTransaction(_quote: unknown): Promise<never> {
    throw 'method_not_supported';
  }

  /**
   * Calculates transfer fee.
   * Returns null for Ethereum (gas is calculated at transaction creation time).
   *
   * @param _tokenAddress - Token address (unused)
   * @param _amount - Transfer amount (unused)
   * @returns null
   */
  async calculateTransferFee(_tokenAddress?: string, _amount?: number): Promise<null> {
    return null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Creates an EthereumBalance object from wei.
   * Utility method for services that fetch balance data.
   *
   * @param wei - Balance in wei
   * @returns EthereumBalance object with wei and eth values
   */
  static createBalance(wei: bigint): EthereumBalance {
    return {
      wei,
      eth: EthereumAccount.weiToEth(wei),
    };
  }
}
