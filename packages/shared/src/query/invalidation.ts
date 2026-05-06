import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NetworkId } from '../types/blockchain';

export type InvalidationKind = 'balance' | 'nfts' | 'avatar-nfts' | 'transactions';

export interface InvalidationOptions {
  /** The account whose data should be invalidated. Pass undefined to invalidate all accounts (rare). */
  accountId?: string;
  /** Optional network filter. If omitted, invalidates across networks for the account. */
  networkId?: NetworkId;
  /** Which query kinds to invalidate. */
  kinds: InvalidationKind[];
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
                if (head !== prefix) return false;
                if (opts.accountId && params?.accountId !== opts.accountId) return false;
                if (opts.networkId && params?.networkId && params.networkId !== opts.networkId)
                  return false;
                return true;
              },
            })
            .then(() => undefined),
        );
      }
      await Promise.all(tasks);
    },
    [queryClient],
  );
}
