/**
 * useToken Hook (React Query backed)
 *
 * Provides token information and balance for a specific token address.
 * Looks up balance items first; if not present (and metadata fetch is not
 * skipped) queries the backend via React Query. Public return shape preserved
 * from the previous useState/useEffect implementation.
 *
 * @example
 * ```tsx
 * const { token, loading, error } = useToken({
 *   tokenId: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   networkId: 'solana-mainnet',
 * });
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query/keys';
import { getTokenByAddress } from '../api/services/tokens';
import type { TokenMetadata } from '../types/token';
import type { SolanaNetworkId } from '../types/blockchain';
import { TokenBalanceWithPrice } from '../utils/balance';

// ============================================================================
// Types
// ============================================================================

export interface TokenData extends Partial<TokenMetadata> {
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logo?: string;
  coingeckoId?: string;
  tags?: string[];
  uiAmount?: number;
  amount?: string | number;
  price?: number;
  usdBalance?: number;
  priceChange24h?: number;
}

export interface UseTokenParams {
  tokenId: string;
  networkId?: SolanaNetworkId;
  balanceItems?: TokenBalanceWithPrice[];
  skipMetadataFetch?: boolean;
}

export interface UseTokenResult {
  token: TokenData;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  isError: boolean;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

function findInBalanceItems(
  tokenId: string,
  balanceItems?: TokenBalanceWithPrice[],
): TokenData | null {
  if (!balanceItems || balanceItems.length === 0) return null;
  const lowered = tokenId.toLowerCase();
  const match = balanceItems.find(
    (item) =>
      item.address?.toLowerCase() === lowered || item.mint?.toLowerCase() === lowered,
  );
  if (!match) return null;
  return {
    address: match.address || match.mint,
    symbol: match.symbol,
    name: match.name,
    decimals: match.decimals,
    logo: match.logo,
    coingeckoId: match.coingeckoId,
    tags: match.tags,
    uiAmount: match.uiAmount,
    amount: match.amount,
    price: match.price,
    usdBalance: match.usdBalance,
    priceChange24h: match.priceChange24h,
  };
}

export function useToken({
  tokenId,
  networkId = 'solana-mainnet',
  balanceItems,
  skipMetadataFetch = false,
}: UseTokenParams): UseTokenResult {
  const queryClient = useQueryClient();

  const balanceMatch = useMemo(
    () => (tokenId ? findInBalanceItems(tokenId, balanceItems) : null),
    [tokenId, balanceItems],
  );

  // Only fetch metadata if no tokenId-empty, no balance match, and not skipped
  const shouldFetch = !!tokenId && !balanceMatch && !skipMetadataFetch;

  const query = useQuery({
    queryKey: tokenId
      ? queryKeys.token({ tokenId, networkId })
      : ['token', 'disabled'],
    queryFn: () => getTokenByAddress(tokenId, networkId),
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  const token: TokenData = useMemo(() => {
    if (!tokenId) return { address: '' };
    if (balanceMatch) return balanceMatch;
    if (query.data) {
      return {
        address: query.data.address,
        symbol: query.data.symbol,
        name: query.data.name,
        decimals: query.data.decimals,
        logo: query.data.logo,
        coingeckoId: query.data.coingeckoId,
        tags: query.data.tags,
      };
    }
    // No data yet, or skipped, or null result
    return { address: tokenId };
  }, [tokenId, balanceMatch, query.data]);

  const error = query.error
    ? query.error instanceof Error
      ? query.error.message
      : 'Failed to fetch token'
    : null;

  // 'loaded' = something definitive (no tokenId, balance match, query settled, or fetch skipped).
  const loaded =
    !tokenId ||
    !!balanceMatch ||
    skipMetadataFetch ||
    query.isSuccess ||
    query.isError;

  const refetch = useCallback(async () => {
    if (!tokenId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.token({ tokenId, networkId }),
    });
    await query.refetch();
  }, [queryClient, tokenId, networkId, query]);

  return {
    token,
    loaded,
    loading: shouldFetch && query.isFetching,
    error,
    isError: error !== null,
    refetch,
  };
}
