/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/account', () => ({
  isSolanaAccount: vi.fn(),
  getBlockchainFromNetworkId: vi.fn(),
}));

vi.mock('../utils/transactions', () => ({
  transformSolanaTransaction: vi.fn(),
  transformMultichainTransaction: vi.fn(),
}));

import { useTransactions } from './useTransactions';
import { isSolanaAccount, getBlockchainFromNetworkId } from '../utils/account';
import { transformSolanaTransaction, transformMultichainTransaction } from '../utils/transactions';

const mockIsSolanaAccount = vi.mocked(isSolanaAccount);
const mockGetBlockchainFromNetworkId = vi.mocked(getBlockchainFromNetworkId);
const mockTransformSolanaTransaction = vi.mocked(transformSolanaTransaction);
const mockTransformMultichainTransaction = vi.mocked(transformMultichainTransaction);

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSolanaAccount.mockReturnValue(true);
    mockGetBlockchainFromNetworkId.mockReturnValue('solana');
    mockTransformSolanaTransaction.mockImplementation((tx: any) => ({
      id: tx.id,
      timestamp: 1,
      status: 'completed',
      type: 'send',
      inputs: [],
      outputs: [],
    }));
    mockTransformMultichainTransaction.mockImplementation((tx: any) => ({
      id: tx.id,
      timestamp: 1,
      status: 'completed',
      type: 'send',
      inputs: [],
      outputs: [],
    }));
  });

  it('fetches Solana transactions on mount and exposes pagination state', async () => {
    const account = {
      getRecentTransactions: vi.fn().mockResolvedValue({
        data: [{ id: 'tx-1' }],
        pageToken: 'next-page',
      }),
    };

    const { result } = renderHook(() =>
      useTransactions({
        address: 'wallet-1',
        networkId: 'solana-mainnet',
        account: account as any,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.transactions).toHaveLength(1);
    });

    expect(account.getRecentTransactions).toHaveBeenCalledWith({
      nextPageToken: undefined,
      pageSize: 20,
    });
    expect(result.current.transactions[0]?.id).toBe('tx-1');
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBe(1);
  });

  it('loads more Solana transactions and deduplicates existing ids', async () => {
    const account = {
      getRecentTransactions: vi
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: 'tx-1' }],
          pageToken: 'cursor-1',
        })
        .mockResolvedValueOnce({
          data: [{ id: 'tx-1' }, { id: 'tx-2' }],
          pageToken: undefined,
        }),
    };

    const { result } = renderHook(() =>
      useTransactions({
        address: 'wallet-1',
        networkId: 'solana-mainnet',
        account: account as any,
      })
    );

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(1);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(account.getRecentTransactions).toHaveBeenLastCalledWith({
      nextPageToken: 'cursor-1',
      pageSize: 20,
    });
    expect(result.current.transactions.map((tx) => tx.id)).toEqual(['tx-1', 'tx-2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('refreshes using a fresh request even inside the cache ttl', async () => {
    const account = {
      getRecentTransactions: vi
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: 'tx-1' }],
          pageToken: 'cursor-1',
        })
        .mockResolvedValueOnce({
          data: [{ id: 'tx-3' }],
          pageToken: undefined,
        }),
    };

    const { result } = renderHook(() =>
      useTransactions({
        address: 'wallet-1',
        networkId: 'solana-mainnet',
        account: account as any,
      })
    );

    await waitFor(() => {
      expect(result.current.transactions.map((tx) => tx.id)).toEqual(['tx-1']);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(account.getRecentTransactions).toHaveBeenCalledTimes(2);
    expect(result.current.transactions.map((tx) => tx.id)).toEqual(['tx-3']);
  });

  it('captures fetch errors without crashing the hook', async () => {
    const account = {
      getRecentTransactions: vi.fn().mockRejectedValue(new Error('solana tx fetch failed')),
    };

    const { result } = renderHook(() =>
      useTransactions({
        address: 'wallet-1',
        networkId: 'solana-mainnet',
        account: account as any,
      })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('solana tx fetch failed');
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.transactions).toEqual([]);
  });
});
