/**
 * Transaction transform utilities.
 *
 * Normalizes backend transaction data for UI display.
 * Handles both enriched (Helius/Moralis) and minimal (RPC fallback) responses.
 *
 * @module utils/transactions
 */

import type {
  Transaction,
  TransactionDisplayStatus,
  TransactionType,
  TransactionTokenAmount,
  TransactionItem,
  SolanaTransaction,
} from '../types/transaction';
import type { BlockchainType } from '../types/blockchain';
import { SOL_CONSTANTS } from './balance';
import { ETH_CONSTANTS, ETH_ADDRESS } from './tokens';

// ============================================================================
// Native token constants per chain
// ============================================================================

const BTC_CONSTANTS = {
  DECIMALS: 8,
  SYMBOL: 'BTC',
  NAME: 'Bitcoin',
  ADDRESS: '',
  LOGO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
} as const;

const NATIVE_CONSTANTS: Record<BlockchainType, {
  DECIMALS: number; SYMBOL: string; NAME: string; ADDRESS: string; LOGO: string;
}> = {
  solana: { DECIMALS: SOL_CONSTANTS.DECIMALS, SYMBOL: SOL_CONSTANTS.SYMBOL, NAME: SOL_CONSTANTS.NAME, ADDRESS: SOL_CONSTANTS.ADDRESS, LOGO: SOL_CONSTANTS.LOGO },
  bitcoin: { DECIMALS: BTC_CONSTANTS.DECIMALS, SYMBOL: BTC_CONSTANTS.SYMBOL, NAME: BTC_CONSTANTS.NAME, ADDRESS: BTC_CONSTANTS.ADDRESS, LOGO: BTC_CONSTANTS.LOGO },
  ethereum: { DECIMALS: ETH_CONSTANTS.DECIMALS, SYMBOL: ETH_CONSTANTS.SYMBOL, NAME: ETH_CONSTANTS.NAME, ADDRESS: ETH_ADDRESS, LOGO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
};

/**
 * Truncate a contract/mint address for display: "EPjF...EGGk"
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 8) return address || '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Check if a token looks like the native token for its chain.
 * Used to decide whether native defaults are appropriate.
 */
function isLikelyNativeToken(token: TransactionTokenAmount, blockchain: BlockchainType): boolean {
  const native = NATIVE_CONSTANTS[blockchain];
  // Explicit native contract match
  if (token.contract && token.contract === native.ADDRESS) return true;
  // Symbol match (case-insensitive)
  if (token.symbol && token.symbol.toUpperCase() === native.SYMBOL) return true;
  // No contract and no symbol — on single-token chains (BTC) assume native
  if (!token.contract && !token.symbol && blockchain === 'bitcoin') return true;
  return false;
}

// ============================================================================
// Normalization helpers
// ============================================================================

/**
 * Normalize a token amount entry, filling in missing fields.
 *
 * For tokens that look like the chain's native token (by contract or symbol),
 * fills in full native metadata (logo, name, etc.).
 *
 * For non-native tokens with missing metadata, uses the contract address as
 * a symbol fallback so the UI never shows "undefined".
 *
 * Also coerces `amount` to string and `decimals` to number (backend RPC fallback
 * can send these as number/undefined respectively).
 */
function normalizeTokenAmount(
  token: TransactionTokenAmount,
  blockchain: BlockchainType,
): TransactionTokenAmount {
  const native = NATIVE_CONSTANTS[blockchain];
  const nativeToken = isLikelyNativeToken(token, blockchain);

  return {
    ...token,
    amount: String(token.amount ?? '0'),
    decimals: token.decimals ?? (nativeToken ? native.DECIMALS : 0),
    symbol: token.symbol || (nativeToken ? native.SYMBOL : truncateAddress(token.contract)),
    name: token.name || (nativeToken ? native.NAME : undefined),
    logo: token.logo ?? (nativeToken ? native.LOGO : undefined),
    contract: token.contract || (nativeToken ? native.ADDRESS : ''),
  };
}

/**
 * Infer transaction type from inputs/outputs when the backend returns 'unknown'.
 */
function inferTransactionType(
  inputs: TransactionTokenAmount[],
  outputs: TransactionTokenAmount[],
): TransactionType {
  if (inputs.length > 0 && outputs.length === 0) return 'receive';
  if (outputs.length > 0 && inputs.length === 0) return 'send';

  if (inputs.length > 0 && outputs.length > 0) {
    const inputContracts = new Set(inputs.map(t => t.contract));
    const outputContracts = new Set(outputs.map(t => t.contract));
    const hasDistinctContracts = [...outputContracts].some(c => !inputContracts.has(c));
    if (hasDistinctContracts) return 'swap';
  }

  return 'unknown';
}

// ============================================================================
// Transform functions
// ============================================================================

/**
 * Transform a Solana backend transaction to the UI Transaction format.
 * Normalizes token amounts and infers type when missing.
 */
export function transformSolanaTransaction(tx: SolanaTransaction): Transaction {
  const inputs = tx.inputs.map(t => normalizeTokenAmount(t, 'solana'));
  const outputs = tx.outputs.map(t => normalizeTokenAmount(t, 'solana'));
  const type: TransactionType = tx.type === 'unknown'
    ? inferTransactionType(inputs, outputs)
    : tx.type as TransactionType;

  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type,
    fee: tx.fee ?? undefined,
    inputs,
    outputs,
    description: tx.description,
    source: tx.source,
    heliusType: tx.heliusType,
  };
}

/**
 * Transform a multi-chain (Bitcoin/Ethereum) transaction to the UI Transaction format.
 * Normalizes token amounts and infers type when missing.
 */
export function transformMultichainTransaction(
  tx: TransactionItem,
  blockchain: BlockchainType = 'bitcoin',
): Transaction {
  const inputs = tx.inputs.map(t => normalizeTokenAmount(t, blockchain));
  const outputs = tx.outputs.map(t => normalizeTokenAmount(t, blockchain));
  const type: TransactionType = tx.type === 'unknown'
    ? inferTransactionType(inputs, outputs)
    : tx.type as TransactionType;

  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type,
    fee: tx.fee
      ? {
          amount: Number(tx.fee.amount),
          decimals: tx.fee.decimals,
          symbol: tx.fee.symbol,
        }
      : undefined,
    inputs,
    outputs,
    description: tx.description,
    source: tx.source,
  };
}
