import { useCallback } from 'react';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import type { NetworkId } from '../types/blockchain';

export type InvalidationKind = 'balance' | 'nfts' | 'avatar-nfts' | 'transactions';

export interface InvalidationOptions {
  /** The account whose data should be invalidated. Pass undefined to invalidate all accounts (rare). */
  accountId?: string;
  /** Parent wallet account id for avatar-nfts caches, whose keys use Account.id rather than receive address. */
  avatarAccountId?: string;
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

export interface SettlementOptions extends InvalidationOptions {
  /**
   * Follow-up refetches compensate for provider/indexer read-after-write lag.
   * The immediate invalidation still runs first; each delay schedules one
   * additional scoped invalidation/refetch.
   */
  settlementDelaysMs?: number[];
}

const KIND_TO_PREFIX: Record<InvalidationKind, string> = {
  balance: 'balance',
  nfts: 'solana-nfts',
  'avatar-nfts': 'avatar-nfts',
  transactions: 'transactions',
};

const DEFAULT_SETTLEMENT_DELAYS_MS = [10_000];

function getRemovedMintAddress(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const mint = (item as { mint?: unknown }).mint;
  if (typeof mint === 'string') return mint;
  if (mint && typeof mint === 'object') {
    return (mint as { address?: string }).address;
  }
  return undefined;
}

function matchesInvalidation(opts: InvalidationOptions, kind: InvalidationKind) {
  const prefix = KIND_TO_PREFIX[kind];
  return (query: { queryKey: readonly unknown[] }): boolean => {
    const [head, params] = query.queryKey as [
      string,
      Record<string, unknown> | undefined,
    ];
    // 'nfts' kind also invalidates single-NFT detail caches
    const matchesHead =
      head === prefix || (kind === 'nfts' && head === 'solana-nft-detail');
    if (!matchesHead) return false;
    const accountId =
      kind === 'avatar-nfts' ? opts.avatarAccountId ?? opts.accountId : opts.accountId;
    if (accountId && params?.accountId !== accountId) return false;
    if (opts.networkId && params?.networkId && params.networkId !== opts.networkId)
      return false;
    return true;
  };
}

function removeOptimisticNfts(queryClient: QueryClient, opts: InvalidationOptions): void {
  if (!opts.removedNftMintAddresses?.length) return;

  const removed = new Set(opts.removedNftMintAddresses);
  queryClient.setQueriesData<unknown[]>(
    {
      predicate: (query) => {
        const [head, params] = query.queryKey as [
          string,
          Record<string, unknown> | undefined,
        ];
        if (head !== 'solana-nfts' && head !== 'avatar-nfts') return false;
        const accountId =
          head === 'avatar-nfts' ? opts.avatarAccountId ?? opts.accountId : opts.accountId;
        if (accountId && params?.accountId !== accountId) return false;
        if (
          head === 'solana-nfts' &&
          opts.networkId &&
          params?.networkId &&
          params.networkId !== opts.networkId
        ) {
          return false;
        }
        return true;
      },
    },
    (oldData) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((nft) => {
        const mintAddress = getRemovedMintAddress(nft);
        return !mintAddress || !removed.has(mintAddress);
      });
    },
  );
  queryClient.removeQueries({
    predicate: (query) => {
      const [head, params] = query.queryKey as [
        string,
        Record<string, unknown> | undefined,
      ];
      if (head !== 'solana-nft-detail') return false;
      if (opts.networkId && params?.networkId && params.networkId !== opts.networkId) {
        return false;
      }
      return removed.has(params?.mintAddress as string);
    },
  });
}

async function invalidateAfterTx(queryClient: QueryClient, opts: InvalidationOptions): Promise<void> {
  // Optimistic NFT removal runs before invalidation so the UI updates
  // immediately while DAS providers catch up.
  removeOptimisticNfts(queryClient, opts);

  const tasks: Promise<void>[] = [];
  for (const kind of opts.kinds) {
    tasks.push(
      queryClient
        .invalidateQueries({
          predicate: matchesInvalidation(opts, kind),
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
  removeOptimisticNfts(queryClient, opts);
}

async function refetchAfterTx(queryClient: QueryClient, opts: InvalidationOptions): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const kind of opts.kinds) {
    tasks.push(
      queryClient
        .refetchQueries({
          predicate: matchesInvalidation(opts, kind),
          type: 'all',
        })
        .then(() => undefined),
    );
  }
  await Promise.all(tasks);
}

export function useInvalidateAfterTx(): (opts: InvalidationOptions) => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(
    async (opts) => {
      await invalidateAfterTx(queryClient, opts);
    },
    [queryClient],
  );
}

export function useSettleAfterTx(): (opts: SettlementOptions) => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(
    async (opts) => {
      const { settlementDelaysMs = DEFAULT_SETTLEMENT_DELAYS_MS, ...invalidationOpts } = opts;

      await invalidateAfterTx(queryClient, invalidationOpts);

      for (const delay of settlementDelaysMs) {
        setTimeout(async () => {
          try {
            await refetchAfterTx(queryClient, invalidationOpts);
            removeOptimisticNfts(queryClient, invalidationOpts);
          } catch (err) {
            console.warn('[useSettleAfterTx] delayed invalidation failed:', err);
          }
        }, delay);
      }
    },
    [queryClient],
  );
}
