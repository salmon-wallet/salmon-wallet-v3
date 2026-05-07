/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useInvalidateAfterTx } from './invalidation';
import { queryKeys } from './keys';

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(client: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestQueryWrapper';
  return Wrapper;
}

const ACCOUNT_A = 'acct-a';
const ACCOUNT_B = 'acct-b';
const NETWORK_SOL = 'solana-mainnet' as never;
const NETWORK_BTC = 'bitcoin-mainnet' as never;

function seed(client: QueryClient) {
  const keys = [
    queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
    queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_BTC }),
    queryKeys.balance({ accountId: ACCOUNT_B, networkId: NETWORK_SOL }),
    queryKeys.solanaNfts({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
    queryKeys.solanaNfts({ accountId: ACCOUNT_B, networkId: NETWORK_SOL }),
    queryKeys.avatarNfts({ accountId: ACCOUNT_A }),
    queryKeys.avatarNfts({ accountId: ACCOUNT_B }),
    queryKeys.transactions({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
    queryKeys.transactions({ accountId: ACCOUNT_B, networkId: NETWORK_SOL }),
  ];
  for (const key of keys) {
    client.setQueryData(key, { value: 'seed' });
  }
  return keys;
}

function isInvalidated(client: QueryClient, key: readonly unknown[]): boolean {
  return client.getQueryState(key as never)?.isInvalidated ?? false;
}

describe('useInvalidateAfterTx', () => {
  it('invalidates only matching kinds', async () => {
    const client = makeClient();
    seed(client);
    const { result } = renderHook(() => useInvalidateAfterTx(), {
      wrapper: makeWrapper(client),
    });
    await result.current({ accountId: ACCOUNT_A, kinds: ['balance'] });

    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_SOL })),
    ).toBe(true);
    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_BTC })),
    ).toBe(true);
    // nfts not requested -> not invalidated
    expect(
      isInvalidated(
        client,
        queryKeys.solanaNfts({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
      ),
    ).toBe(false);
    expect(isInvalidated(client, queryKeys.avatarNfts({ accountId: ACCOUNT_A }))).toBe(false);
    expect(
      isInvalidated(
        client,
        queryKeys.transactions({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
      ),
    ).toBe(false);
  });

  it('filters by accountId', async () => {
    const client = makeClient();
    seed(client);
    const { result } = renderHook(() => useInvalidateAfterTx(), {
      wrapper: makeWrapper(client),
    });
    await result.current({ accountId: ACCOUNT_A, kinds: ['balance', 'avatar-nfts'] });

    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_SOL })),
    ).toBe(true);
    expect(isInvalidated(client, queryKeys.avatarNfts({ accountId: ACCOUNT_A }))).toBe(true);
    // account B untouched
    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_B, networkId: NETWORK_SOL })),
    ).toBe(false);
    expect(isInvalidated(client, queryKeys.avatarNfts({ accountId: ACCOUNT_B }))).toBe(false);
  });

  it('filters by networkId when provided', async () => {
    const client = makeClient();
    seed(client);
    const { result } = renderHook(() => useInvalidateAfterTx(), {
      wrapper: makeWrapper(client),
    });
    await result.current({
      accountId: ACCOUNT_A,
      networkId: NETWORK_SOL,
      kinds: ['balance'],
    });

    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_SOL })),
    ).toBe(true);
    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_BTC })),
    ).toBe(false);
  });

  it("forces refetch of inactive queries via refetchType: 'all'", async () => {
    // Regression: tab navigators preserve home screen instances, so refetch
    // on mount alone never fires after a swap success modal closes. Without
    // refetchType: 'all', invalidated-but-inactive balance queries stay
    // stale until full page reload.
    const client = makeClient();
    seed(client);
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useInvalidateAfterTx(), {
      wrapper: makeWrapper(client),
    });

    await result.current({ accountId: ACCOUNT_A, kinds: ['balance'] });

    expect(spy).toHaveBeenCalledTimes(1);
    const callArgs = spy.mock.calls[0]?.[0] as { refetchType?: unknown } | undefined;
    expect(callArgs?.refetchType).toBe('all');
  });

  it('invalidates multiple kinds in parallel', async () => {
    const client = makeClient();
    seed(client);
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useInvalidateAfterTx(), {
      wrapper: makeWrapper(client),
    });

    await result.current({
      accountId: ACCOUNT_A,
      kinds: ['balance', 'transactions', 'nfts', 'avatar-nfts'],
    });

    expect(spy).toHaveBeenCalledTimes(4);
    expect(
      isInvalidated(client, queryKeys.balance({ accountId: ACCOUNT_A, networkId: NETWORK_SOL })),
    ).toBe(true);
    expect(
      isInvalidated(
        client,
        queryKeys.transactions({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
      ),
    ).toBe(true);
    expect(
      isInvalidated(
        client,
        queryKeys.solanaNfts({ accountId: ACCOUNT_A, networkId: NETWORK_SOL }),
      ),
    ).toBe(true);
    expect(isInvalidated(client, queryKeys.avatarNfts({ accountId: ACCOUNT_A }))).toBe(true);
  });
});
