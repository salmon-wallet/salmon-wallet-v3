/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { BridgeSettlementProvider, useBridgeSettlement } from './BridgeSettlementContext';
import { queryKeys } from '../query/keys';
import type { BridgeTransaction } from '../types/bridge';

const SRC_NET = 'solana-mainnet' as never;
const SRC_ACCT = 'sol-address';
const DEST_NET = 'bitcoin-mainnet' as never;
const DEST_ACCT = 'btc-address';

const destKey = queryKeys.balance({ accountId: DEST_ACCT, networkId: DEST_NET });
const srcKey = queryKeys.balance({ accountId: SRC_ACCT, networkId: SRC_NET });

function makeClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  client.setQueryData(destKey, { items: [] });
  client.setQueryData(srcKey, { items: [] });
  return client;
}

function setup(getStatus: (id: string) => Promise<BridgeTransaction | null>, pollIntervalMs = 1_000) {
  const client = makeClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <BridgeSettlementProvider getStatus={getStatus} pollIntervalMs={pollIntervalMs}>
        {children}
      </BridgeSettlementProvider>
    </QueryClientProvider>
  );
  Wrapper.displayName = 'BridgeSettlementTestWrapper';
  const view = renderHook(() => useBridgeSettlement(), { wrapper: Wrapper });
  return { client, ...view };
}

const isInvalidated = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryState(key as never)?.isInvalidated ?? false;

describe('BridgeSettlementProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls until success, then settles the destination balance and stops tracking', async () => {
    const getStatus = vi
      .fn<(id: string) => Promise<BridgeTransaction | null>>()
      .mockResolvedValueOnce({ status: 'inProgress' } as BridgeTransaction)
      .mockResolvedValueOnce({ status: 'success' } as BridgeTransaction);

    const { client, result } = setup(getStatus);

    vi.useFakeTimers();

    act(() => {
      result.current.trackBridgeExchange({
        id: 'ex-1',
        sourceNetworkId: SRC_NET,
        sourceAccountId: SRC_ACCT,
        destNetworkId: DEST_NET,
        destAccountId: DEST_ACCT,
      });
    });
    expect(result.current.pendingExchanges).toHaveLength(1);

    // First poll: still in progress -> keep tracking, nothing settled.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(result.current.pendingExchanges).toHaveLength(1);
    expect(isInvalidated(client, destKey)).toBe(false);

    // Second poll: success -> settle destination + source, drop from pending.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(isInvalidated(client, destKey)).toBe(true);
    expect(isInvalidated(client, srcKey)).toBe(true);
    expect(result.current.pendingExchanges).toHaveLength(0);
  });

  it('settles the source balance on refund and stops tracking', async () => {
    const getStatus = vi
      .fn<(id: string) => Promise<BridgeTransaction | null>>()
      .mockResolvedValue({ status: 'refunded' } as BridgeTransaction);

    const { client, result } = setup(getStatus);

    vi.useFakeTimers();

    act(() => {
      result.current.trackBridgeExchange({
        id: 'ex-2',
        sourceNetworkId: SRC_NET,
        sourceAccountId: SRC_ACCT,
        destNetworkId: DEST_NET,
        destAccountId: DEST_ACCT,
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Refund returns funds on the source side; destination is untouched.
    expect(isInvalidated(client, srcKey)).toBe(true);
    expect(isInvalidated(client, destKey)).toBe(false);
    expect(result.current.pendingExchanges).toHaveLength(0);
  });

  it('keeps tracking while the exchange stays in progress', async () => {
    const getStatus = vi
      .fn<(id: string) => Promise<BridgeTransaction | null>>()
      .mockResolvedValue({ status: 'inProgress' } as BridgeTransaction);

    const { client, result } = setup(getStatus);

    vi.useFakeTimers();

    act(() => {
      result.current.trackBridgeExchange({ id: 'ex-3', destNetworkId: DEST_NET, destAccountId: DEST_ACCT });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(getStatus.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.current.pendingExchanges).toHaveLength(1);
    expect(isInvalidated(client, destKey)).toBe(false);
  });
});
