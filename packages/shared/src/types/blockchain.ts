/**
 * Canonical blockchain types shared across the wallet.
 *
 * This file is the single source of truth for blockchain-level type
 * definitions (chain identifiers, account unions, network unions).
 * All hook and service files should import from here rather than
 * defining their own copies.
 *
 * @module types/blockchain
 */

import type { SolanaAccount, SolanaNetwork } from '../blockchain/solana';
import type { BitcoinAccount, BitcoinNetwork } from '../blockchain/bitcoin';
import type { EthereumAccount, EthereumNetwork } from '../blockchain/ethereum';

/**
 * Supported blockchain identifiers.
 *
 * Previously duplicated as `BlockchainType` (useAddressValidation, useAddressbook,
 * useBalance, useTransactions), `ChainType` (useMultiChainTokens),
 * `SendBlockchainType` (useSendTransaction), and `SwapChainType` (types/swap).
 */
export type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Unified blockchain account type that can represent accounts from any
 * supported blockchain.
 *
 * Previously duplicated in useAccounts and useBalance.
 */
export type BlockchainAccount = SolanaAccount | BitcoinAccount | EthereumAccount;

/**
 * Union type for all supported network configurations.
 *
 * Previously duplicated in useAccounts (local) and useAvailableNetworks.
 */
export type AnyNetwork = SolanaNetwork | BitcoinNetwork | EthereumNetwork;

/**
 * Networks grouped by blockchain.
 *
 * Previously defined in useAvailableNetworks.
 */
export interface NetworksByBlockchain {
  /** Available Solana networks */
  solana: SolanaNetwork[];
  /** Available Bitcoin networks */
  bitcoin: BitcoinNetwork[];
  /** Available Ethereum networks */
  ethereum: EthereumNetwork[];
}

// ============================================================================
// Per-chain network IDs
// ============================================================================

/**
 * Solana network identifier.
 *
 * Previously defined in api/services/solana.ts and duplicated as local
 * `NetworkId` in api/services/tokens.ts, marketplace.ts, and price.ts.
 */
export type SolanaNetworkId = 'solana-mainnet' | 'solana-devnet';

/**
 * Bitcoin network identifier.
 *
 * Previously defined in api/services/bitcoin.ts.
 */
export type BitcoinNetworkId = 'bitcoin-mainnet' | 'bitcoin-testnet';

/**
 * Ethereum network identifier.
 *
 * Previously defined inline in api/services/ethereum-nft.ts as
 * `EthereumNftNetworkId`.
 */
export type EthereumNetworkId = 'ethereum-mainnet' | 'ethereum-sepolia';

// ============================================================================
// Unified network ID
// ============================================================================

/**
 * Network ID for balance / transaction queries.
 *
 * Previously defined in useBalance as `NetworkId`.
 */
export type NetworkId = SolanaNetworkId | BitcoinNetworkId | EthereumNetworkId;

// ============================================================================
// API network data
// ============================================================================

/**
 * Network information from the backend API (/v1/networks).
 *
 * Previously defined in api/client.ts.
 */
export interface Network {
  id: string;
  name: string;
  blockchain: string;
  environment: string;
  icon?: string;
  currency?: {
    symbol: string;
    decimals: number;
  };
  config: Record<string, unknown>;
  [key: string]: unknown;
}
