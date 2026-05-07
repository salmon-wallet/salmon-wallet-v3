/**
 * useSolanaNftDetail
 *
 * React Query hook wrapping `getSolanaNftByAddress` for single NFT detail
 * lookups. No prior consumers exist; introduced now so future NFT detail
 * screens can adopt the shared cache.
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query/keys';
import { getSolanaNftByAddress } from '../api/services';
import type { Nft } from '../types/nft';
import type { SolanaNetworkId } from '../types/blockchain';

export interface UseSolanaNftDetailParams {
  mintAddress: string | undefined;
  networkId: SolanaNetworkId | undefined;
  enabled?: boolean;
}

export interface UseSolanaNftDetailResult {
  nft: Nft | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSolanaNftDetail(
  params: UseSolanaNftDetailParams,
): UseSolanaNftDetailResult {
  const { mintAddress, networkId, enabled = true } = params;
  const isEnabled = !!mintAddress && !!networkId && enabled;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey:
      mintAddress && networkId
        ? queryKeys.solanaNftDetail({ mintAddress, networkId })
        : ['solana-nft-detail', 'disabled'],
    queryFn: () => getSolanaNftByAddress(networkId as string, mintAddress as string),
    enabled: isEnabled,
    staleTime: 60_000,
  });

  const refresh = useCallback(async () => {
    if (!mintAddress || !networkId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.solanaNftDetail({ mintAddress, networkId }),
    });
  }, [queryClient, mintAddress, networkId]);

  const error = query.error
    ? query.error instanceof Error
      ? query.error.message
      : String(query.error)
    : null;

  return {
    nft: query.data ?? null,
    loading: isEnabled && query.isPending,
    error,
    refresh,
  };
}
