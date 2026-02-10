import EventEmitter from 'eventemitter3';
import bs58 from 'bs58';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * JSON-RPC request message sent to the content script
 */
export interface RequestMessage {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

/**
 * JSON-RPC response message received from the content script
 */
export interface ResponseMessage {
  jsonrpc: '2.0';
  id: number;
  method?: string;
  result?: unknown;
  params?: Record<string, unknown>;
  error?: string;
}

/**
 * Result returned from a successful connect call
 */
export interface ConnectResult {
  publicKey: PublicKey;
}

/**
 * Options for the connect method
 */
export interface ConnectOptions {
  onlyIfTrusted?: boolean;
}

/**
 * Result from signing a transaction
 */
export interface SignTransactionResult {
  signature: string;
  publicKey: string;
}

/**
 * Result from signing multiple transactions
 */
export interface SignAllTransactionsResult {
  signatures: string[];
  publicKey: string;
}

/**
 * Result from signing and sending a transaction
 */
export interface SignAndSendTransactionResult {
  signature: string;
}

/**
 * Options for signing and sending a transaction
 */
export interface SendOptions {
  skipPreflight?: boolean;
  preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  minContextSlot?: number;
}

/**
 * Result from signing a message
 */
export interface SignMessageResult {
  signature: Uint8Array;
}

/**
 * Network type for transaction operations
 */
export type Network = 'mainnet-beta' | 'devnet' | string;

/**
 * Transaction type that can be either legacy or versioned
 */
export type SolanaTransaction = Transaction | VersionedTransaction;

/**
 * Events emitted by the provider
 */
export interface SolanaProviderEvents {
  connect: (publicKey: PublicKey) => void;
  disconnect: () => void;
  accountChanged: (publicKey: PublicKey | null) => void;
}

// ============================================================================
// Custom Event Types for Window Communication
// ============================================================================

interface ContentScriptMessageDetail extends ResponseMessage {}

interface ContentScriptMessageEvent extends CustomEvent<ContentScriptMessageDetail> {}

// ============================================================================
// SolanaProvider Class
// ============================================================================

/**
 * Solana wallet provider that implements the wallet-standard interface.
 * This provider is injected into web pages and communicates with the
 * extension's content script via custom events.
 */
export class SolanaProvider extends EventEmitter<SolanaProviderEvents> {
  #publicKey: PublicKey | null = null;
  #nextRequestId = 1;

  constructor() {
    super();
    this.#publicKey = null;
    this.#nextRequestId = 1;
  }

  /**
   * The public key of the connected wallet, or null if not connected
   */
  get publicKey(): PublicKey | null {
    return this.#publicKey;
  }

  /**
   * Whether the wallet is currently connected
   */
  get isConnected(): boolean {
    return this.#publicKey !== null;
  }

  /**
   * Encodes a transaction message to base58 for transmission
   */
  #encodeTransaction = (transaction: SolanaTransaction): string => {
    let serialized: Uint8Array;

    // Handle legacy Transaction with serializeMessage method
    if ('serializeMessage' in transaction && typeof transaction.serializeMessage === 'function') {
      serialized = transaction.serializeMessage();
    }
    // Handle VersionedTransaction with message.serialize method
    else if ('message' in transaction && transaction.message && typeof transaction.message.serialize === 'function') {
      serialized = transaction.message.serialize();
    } else {
      throw new Error('Unable to serialize transaction');
    }

    return bs58.encode(serialized);
  };

  /**
   * Sends a message to the content script and waits for a response
   */
  sendMessage = async (message: RequestMessage): Promise<ResponseMessage> => {
    return new Promise((resolve, reject) => {
      const listener = (event: Event) => {
        const customEvent = event as ContentScriptMessageEvent;
        if (customEvent.detail.id === message.id) {
          window.removeEventListener('salmon_contentscript_message', listener);

          if (customEvent.detail.error) {
            reject(customEvent.detail);
          } else {
            resolve(customEvent.detail);
          }
        }
      };

      window.addEventListener('salmon_contentscript_message', listener);

      window.dispatchEvent(
        new CustomEvent('salmon_injected_script_message', { detail: message })
      );
    });
  };

  /**
   * Sends a JSON-RPC request to the content script
   */
  sendRequest = async (
    method: string,
    params: Record<string, unknown>
  ): Promise<ResponseMessage> => {
    try {
      return await this.sendMessage({
        jsonrpc: '2.0',
        id: this.#nextRequestId++,
        method,
        params,
      });
    } catch (response) {
      const errorResponse = response as ResponseMessage;
      throw new Error(errorResponse.error || 'Unknown error');
    }
  };

  /**
   * Connects to the wallet
   * @param options - Connection options
   * @returns The public key of the connected wallet
   */
  connect = async (options?: ConnectOptions): Promise<ConnectResult> => {
    const response = await this.sendRequest('connect', { options });

    if (response.method === 'connected' && response.params) {
      const publicKeyString = response.params.publicKey as string;
      this.#publicKey = new PublicKey(publicKeyString);
      this.emit('connect', this.#publicKey);
      return { publicKey: this.#publicKey };
    }

    throw new Error('Not connected');
  };

  /**
   * Disconnects from the wallet
   */
  disconnect = async (): Promise<void> => {
    const response = await this.sendRequest('disconnect', {});

    if (response.method === 'disconnected') {
      this.#publicKey = null;
      this.emit('disconnect');
    } else {
      throw new Error('Not disconnected');
    }
  };

  /**
   * Signs and sends a transaction to the network
   * @param transaction - The transaction to sign and send
   * @param network - The network to send the transaction to
   * @param options - Send options
   * @returns The transaction signature
   */
  signAndSendTransaction = async (
    transaction: SolanaTransaction,
    network?: Network,
    options?: SendOptions
  ): Promise<SignAndSendTransactionResult> => {
    const response = await this.sendRequest('signAndSendTransaction', {
      message: this.#encodeTransaction(transaction),
      network,
      options,
    });

    return response.result as SignAndSendTransactionResult;
  };

  /**
   * Signs a transaction without sending it
   * @param transaction - The transaction to sign
   * @param network - The network context for the transaction
   * @returns The signed transaction
   */
  signTransaction = async <T extends SolanaTransaction>(
    transaction: T,
    network?: Network
  ): Promise<T> => {
    const response = await this.sendRequest('signTransaction', {
      message: this.#encodeTransaction(transaction),
      network,
    });

    const result = response.result as SignTransactionResult;
    const signature = bs58.decode(result.signature);
    const publicKey = new PublicKey(result.publicKey);

    // Add signature to the transaction
    if ('addSignature' in transaction && typeof transaction.addSignature === 'function') {
      transaction.addSignature(publicKey, Buffer.from(signature));
    } else {
      throw new Error('Transaction does not support addSignature');
    }

    return transaction;
  };

  /**
   * Signs multiple transactions without sending them
   * @param transactions - The transactions to sign
   * @param network - The network context for the transactions
   * @returns The signed transactions
   */
  signAllTransactions = async <T extends SolanaTransaction>(
    transactions: T[],
    network?: Network
  ): Promise<T[]> => {
    const response = await this.sendRequest('signAllTransactions', {
      messages: transactions.map(this.#encodeTransaction),
      network,
    });

    const result = response.result as SignAllTransactionsResult;
    const signatures = result.signatures.map(s => bs58.decode(s));
    const publicKey = new PublicKey(result.publicKey);

    return transactions.map((tx, idx) => {
      if ('addSignature' in tx && typeof tx.addSignature === 'function') {
        tx.addSignature(publicKey, Buffer.from(signatures[idx]));
      } else {
        throw new Error('Transaction does not support addSignature');
      }
      return tx;
    });
  };

  /**
   * Signs an arbitrary message
   * @param message - The message to sign (must be Uint8Array)
   * @returns The signature
   */
  signMessage = async (message: Uint8Array): Promise<SignMessageResult> => {
    if (!(message instanceof Uint8Array)) {
      throw new Error('Data must be an instance of Uint8Array');
    }

    const response = await this.sendRequest('sign', { data: Array.from(message) });
    const result = response.result as { signature: string };
    const signature = bs58.decode(result.signature);

    return { signature: new Uint8Array(signature) };
  };

  /**
   * Posts a message and forwards the response via window.postMessage
   * Used for legacy compatibility
   */
  postMessage = async (message: RequestMessage): Promise<void> => {
    try {
      const detail = await this.sendMessage(message);
      window.postMessage(detail, '*');
    } catch (error) {
      window.postMessage(error, '*');
    }
  };
}
