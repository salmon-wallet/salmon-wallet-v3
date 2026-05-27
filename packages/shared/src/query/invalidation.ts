import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NetworkId } from '../types/blockchain';
import type { Nft } from '../types/nft';

export type InvalidationKind = 'balance' | 'nfts' | 'avatar-nfts' | 'transactions';

export interface InvalidationOptions {
  /** The account whose data should be invalidated. Pass undefined to invalidate all accounts (rare). */
  accountId?: string;
  /** Optional network filter. If omitted, invalidates across networks for the account. */
  networkId?: NetworkId;
  /** Which query kinds to invalidate. */
  kinds: InvalidationKind[];
  /**
   * NFT mint addresses (`nft.mint.address`) that the just-confirmed
   * transaction has moved out of the user's wallet — typically the burned
   * or transferred NFT. They are filtered out of every cached
   * `solana-nfts` / `avatar-nfts` list and their `solana-nft-detail`
   * entries are dropped before invalidation runs, so the UI hides them
   * instantly even when the DAS provider (Helius/Triton) is still 30–60s
   * behind.
   */
  removedNftMintAddresses?: string[];
}

const KIND_TO_PREFIX: Record<InvalidationKind, string> = {
  balance: 'balance',
  nfts: 'solana-nfts',
  'avatar-nfts': 'avatar-nfts',
  transactions: 'transactions',
};

export function useInvalidateAfterTx(): (opts: InvalidationOptions) => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(
    async (opts) => {
      // 1. Optimistic NFT removal — runs before invalidation so the UI
      // updates immediately while the DAS provider catches up.
      if (opts.removedNftMintAddresses?.length) {
        const removed = new Set(opts.removedNftMintAddresses);
        queryClient.setQueriesData<Nft[]>(
          {
            predicate: (query) => {
              const [head, params] = query.queryKey as [
                string,
                Record<string, unknown> | undefined,
              ];
              if (head !== 'solana-nfts' && head !== 'avatar-nfts') return false;
              if (opts.accountId && params?.accountId !== opts.accountId) return false;
              return true;
            },
          },
          (oldData) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.filter((nft) => !removed.has(nft?.mint?.address));
          },
        );
        queryClient.removeQueries({
          predicate: (query) => {
            const [head, params] = query.queryKey as [
              string,
              Record<string, unknown> | undefined,
            ];
            if (head !== 'solana-nft-detail') return false;
            return removed.has(params?.mintAddress as string);
          },
        });
      }

      const tasks: Promise<void>[] = [];
      for (const kind of opts.kinds) {
        const prefix = KIND_TO_PREFIX[kind];
        tasks.push(
          queryClient
            .invalidateQueries({
              predicate: (query) => {
                const [head, params] = query.queryKey as [
                  string,
                  Record<string, unknown> | undefined,
                ];
                // 'nfts' kind also invalidates single-NFT detail caches
                const matchesHead =
                  head === prefix || (kind === 'nfts' && head === 'solana-nft-detail');
                if (!matchesHead) return false;
                if (opts.accountId && params?.accountId !== opts.accountId) return false;
                if (opts.networkId && params?.networkId && params.networkId !== opts.networkId)
                  return false;
                return true;
              },
              // Force refetch of inactive queries (e.g. TokenList on a tab
              // that's not currently focused). Without this, RQ marks the
              // cache stale but only refetches on next mount — and tab
              // navigators preserve instances, so the home screen never
              // remounts when the user returns from the swap success
              // modal. Result: stale balances until full page reload.
              refetchType: 'all',
            })
            .then(() => undefined),
        );
      }
      await Promise.all(tasks);
    },
    [queryClient],
  );
}

