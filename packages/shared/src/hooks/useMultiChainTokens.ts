/**
 * useMultiChainTokens Hook
 *
 * Combines tokens from all blockchain accounts (Solana, Bitcoin, Ethereum)
 * into a unified array for multi-chain swap/bridge operations.
 *
 * Features:
 * - Fetches balances from all chains the user has accounts for
 * - Normalizes token data into a unified format
 * - Identifies chain type for each token
 * - Supports automatic swap vs bridge detection
 *
 * @module hooks/useMultiChainTokens
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Account } from '../types/account';
import type { BlockchainAccount, BlockchainType, NetworkId } from '../types/blockchain';
import type { UnifiedToken } from '../types/token';
import { useBalance } from './useBalance';
import { MAINNET_NETWORK_ID } from '../utils/network';

/**
 * Chain identifier for unified tokens.
 * Alias of the canonical BlockchainType.
 */
export type ChainType = BlockchainType;

/**
 * Balance data for a single chain
 */
interface ChainBalance {
  chain: ChainType;
  networkId: string;
  tokens: UnifiedToken[];
  loading: boolean;
  error: string | null;
}

/**
 * Parameters for the useMultiChainTokens hook
 */
export interface UseMultiChainTokensParams {
  /** The active account containing all network accounts */
  activeAccount: Account | undefined;
  /** Whether to skip fetching */
  skip?: boolean;
}

/**
 * Return type for the useMultiChainTokens hook
 */
export interface UseMultiChainTokensResult {
  /** All tokens from all chains combined */
  tokens: UnifiedToken[];
  /** Tokens grouped by chain */
  tokensByChain: Record<ChainType, UnifiedToken[]>;
  /** Whether any chain is still loading */
  loading: boolean;
  /** Whether all chains have loaded */
  ready: boolean;
  /** Errors from any chain */
  errors: Record<ChainType, string | null>;
  /** Whether any chain has errors */
  hasErrors: boolean;
  /** Refresh all balances */
  refresh: () => Promise<void>;
  /** Get tokens for a specific chain */
  getTokensForChain: (chain: ChainType) => UnifiedToken[];
  /** Featured tokens (top 5 by USD value across all chains) */
  featuredTokens: UnifiedToken[];
}

// ============================================================================
// Constants
// ============================================================================

/** Network IDs for each chain (uses canonical source) */
const NETWORK_IDS = MAINNET_NETWORK_ID;

// ============================================================================
// Helper Functions
// ============================================================================


// ============================================================================
// Single Chain Balance Hook
// ============================================================================

/**
 * Hook to fetch balance for a single chain
 */
function useChainBalance(
  account: BlockchainAccount | undefined,
  networkId: string,
  chain: ChainType,
  skip: boolean,
  refreshKey: number
): ChainBalance {
  const { tokens, loading, error, refresh } = useBalance({
    account,
    networkId: networkId as NetworkId,
    skip: skip || !account,
  });

  useEffect(() => {
    if (refreshKey <= 0 || skip || !account) {
      return;
    }

    void refresh();
  }, [account, refresh, refreshKey, skip]);

  const unifiedTokens: UnifiedToken[] = useMemo(() => {
    return tokens.map((token) => ({
      symbol: token.symbol || '',
      name: token.name || token.symbol || '',
      address: token.address || token.mint || '',
      decimals: token.decimals || 9,
      logo: token.logo || undefined,
      balance: token.uiAmount || 0,
      usdPrice: token.price,
      usdBalance: token.usdBalance,
      chain,
      networkId,
    }));
  }, [tokens, chain, networkId]);

  return {
    chain,
    networkId,
    tokens: unifiedTokens,
    loading,
    error,
  };
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for fetching and combining tokens from all blockchain accounts.
 *
 * This hook:
 * - Gets blockchain accounts for Solana, Bitcoin, and Ethereum
 * - Fetches balances for each chain with accounts
 * - Combines all tokens into a unified format
 * - Provides helpers for chain filtering and swap type detection
 *
 * @param params - Hook configuration parameters
 * @returns Combined tokens and utilities
 *
 * @example
 * ```tsx
 * const { tokens, loading, getSwapType } = useMultiChainTokens({
 *   activeAccount,
 * });
 *
 * // tokens contains all tokens from SOL, BTC, ETH
 * // Each token has a 'chain' property to identify its origin
 * ```
 */
export function useMultiChainTokens(
  params: UseMultiChainTokensParams
): UseMultiChainTokensResult {
  const { activeAccount, skip = false } = params;

  // State for refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get blockchain accounts for each chain
  const solanaAccount = useMemo(() => {
    if (!activeAccount?.networksAccounts) return undefined;
    const accounts = activeAccount.networksAccounts[NETWORK_IDS.solana];
    return accounts?.find((a) => a !== null) as BlockchainAccount | undefined;
  }, [activeAccount]);

  const bitcoinAccount = useMemo(() => {
    if (!activeAccount?.networksAccounts) return undefined;
    const accounts = activeAccount.networksAccounts[NETWORK_IDS.bitcoin];
    return accounts?.find((a) => a !== null) as BlockchainAccount | undefined;
  }, [activeAccount]);

  const ethereumAccount = useMemo(() => {
    if (!activeAccount?.networksAccounts) return undefined;
    const accounts = activeAccount.networksAccounts[NETWORK_IDS.ethereum];
    return accounts?.find((a) => a !== null) as BlockchainAccount | undefined;
  }, [activeAccount]);

  // Fetch balances for each chain
  const solanaBalance = useChainBalance(
    solanaAccount,
    NETWORK_IDS.solana,
    'solana',
    skip,
    refreshTrigger
  );

  const bitcoinBalance = useChainBalance(
    bitcoinAccount,
    NETWORK_IDS.bitcoin,
    'bitcoin',
    skip,
    refreshTrigger
  );

  const ethereumBalance = useChainBalance(
    ethereumAccount,
    NETWORK_IDS.ethereum,
    'ethereum',
    skip,
    refreshTrigger
  );

  // Combine all tokens
  const tokens = useMemo(() => {
    const allTokens: UnifiedToken[] = [
      ...solanaBalance.tokens,
      ...bitcoinBalance.tokens,
      ...ethereumBalance.tokens,
    ].filter((token) => {
      const hasName = !!token.name && token.name !== 'Unknown Token';
      const hasSymbol = !!token.symbol && token.symbol !== 'UNKNOWN';
      return hasName || hasSymbol;
    });

    // Sort by USD balance descending
    return allTokens.sort((a, b) => (b.usdBalance || 0) - (a.usdBalance || 0));
  }, [solanaBalance.tokens, bitcoinBalance.tokens, ethereumBalance.tokens]);

  // Tokens grouped by chain
  const tokensByChain = useMemo(() => {
    return {
      solana: solanaBalance.tokens,
      bitcoin: bitcoinBalance.tokens,
      ethereum: ethereumBalance.tokens,
    };
  }, [solanaBalance.tokens, bitcoinBalance.tokens, ethereumBalance.tokens]);

  // Loading state
  const loading = solanaBalance.loading || bitcoinBalance.loading || ethereumBalance.loading;
  const ready = !loading && tokens.length > 0;

  // Errors
  const errors = useMemo(() => ({
    solana: solanaBalance.error,
    bitcoin: bitcoinBalance.error,
    ethereum: ethereumBalance.error,
  }), [solanaBalance.error, bitcoinBalance.error, ethereumBalance.error]);

  // Featured tokens (top 5 by USD value)
  const featuredTokens = useMemo(() => {
    return tokens.slice(0, 5);
  }, [tokens]);

  // Get tokens for a specific chain
  const getTokensForChain = useCallback((chain: ChainType) => {
    return tokensByChain[chain] || [];
  }, [tokensByChain]);

  // Refresh all balances
  const refresh = useCallback(async () => {
    setRefreshTrigger((prev) => prev + 1);
    // The useBalance hooks will refresh on next render cycle
  }, []);

  return {
    tokens,
    tokensByChain,
    loading,
    ready,
    errors,
    hasErrors: Object.values(errors).some(e => e !== null),
    refresh,
    getTokensForChain,
    featuredTokens,
  };
}

