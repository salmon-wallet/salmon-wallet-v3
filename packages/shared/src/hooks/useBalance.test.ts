/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/account', () => ({
  isSolanaAccount: vi.fn(),
  isBitcoinAccount: vi.fn(),
  isEthereumAccount: vi.fn(),
}));

vi.mock('../storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  STORAGE_KEYS: {
    HIDDEN_BALANCE: 'hidden_balance',
  },
}));

import { useBalance } from './useBalance';
import { getStorageItem, setStorageItem } from '../storage';
import { isSolanaAccount, isBitcoinAccount, isEthereumAccount } from '../utils/account';

const mockGetStorageItem = vi.mocked(getStorageItem);
const mockSetStorageItem = vi.mocked(setStorageItem);
const mockIsSolanaAccount = vi.mocked(isSolanaAccount);
const mockIsBitcoinAccount = vi.mocked(isBitcoinAccount);
const mockIsEthereumAccount = vi.mocked(isEthereumAccount);

describe('useBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStorageItem.mockResolvedValue(null as never);
    mockSetStorageItem.mockResolvedValue(undefined as never);
    mockIsSolanaAccount.mockReturnValue(true);
    mockIsBitcoinAccount.mockReturnValue(false);
    mockIsEthereumAccount.mockReturnValue(false);
  });

  it('loads and transforms Solana balances into wallet balance state', async () => {
    const account = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-1'),
      getBalance: vi.fn().mockResolvedValue({
        usdTotal: 301,
        last24HoursChange: 1,
        items: [
          {
            mint: 'So11111111111111111111111111111111111111112',
            amount: 2_000_000_000,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
            uiAmount: 2,
            logo: 'https://example.com/sol.png',
            coingeckoId: 'solana',
            tags: ['verified'],
            price: 150.5,
            usdBalance: 301,
            priceChange24h: 10,
          },
        ],
      }),
    };

    const { result } = renderHook(() =>
      useBalance({ account: account as any, networkId: 'solana-mainnet' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.tokens).toHaveLength(1);
    });

    expect(account.getBalance).toHaveBeenCalledTimes(1);
    expect(result.current.usdTotal).toBe(301);
    expect(result.current.changeAmount).toBe(1);
    expect(result.current.changePercent).toBeCloseTo((1 / 300) * 100);
    expect(result.current.tokens[0]).toMatchObject({
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      owner: 'wallet-1',
      uiAmount: 2,
      usdBalance: 301,
    });
  });

  it('uses cached data until refresh is requested', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const account = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-1'),
      getBalance: vi
        .fn()
        .mockResolvedValueOnce({
          usdTotal: 100,
          last24HoursChange: 0,
          items: [],
        })
        .mockResolvedValueOnce({
          usdTotal: 200,
          last24HoursChange: 0,
          items: [],
        }),
    };

    const { result, rerender } = renderHook(
      ({ networkId }) => useBalance({ account: account as any, networkId }),
      { initialProps: { networkId: 'solana-mainnet' as const } }
    );

    await waitFor(() => {
      expect(result.current.usdTotal).toBe(100);
    });

    rerender({ networkId: 'solana-mainnet' as const });
    expect(account.getBalance).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(account.getBalance).toHaveBeenCalledTimes(2);
    expect(result.current.usdTotal).toBe(200);

    nowSpy.mockRestore();
  });

  it('clears stale balance when account changes and refetches for the new key', async () => {
    const accountA = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-a'),
      getBalance: vi.fn().mockResolvedValue({
        usdTotal: 50,
        last24HoursChange: 0,
        items: [],
      }),
    };
    const accountB = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-b'),
      getBalance: vi.fn().mockResolvedValue({
        usdTotal: 75,
        last24HoursChange: 0,
        items: [],
      }),
    };

    const { result, rerender } = renderHook(
      ({ account }) => useBalance({ account, networkId: 'solana-mainnet' }),
      { initialProps: { account: accountA as any } }
    );

    await waitFor(() => {
      expect(result.current.usdTotal).toBe(50);
    });

    rerender({ account: accountB as any });

    expect(result.current.balance).toBeNull();
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.usdTotal).toBe(75);
    });

    expect(accountA.getBalance).toHaveBeenCalledTimes(1);
    expect(accountB.getBalance).toHaveBeenCalledTimes(1);
  });

  it('loads and persists hidden balance preference', async () => {
    mockGetStorageItem.mockResolvedValueOnce(true as never);
    const account = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-1'),
      getBalance: vi.fn().mockResolvedValue({
        usdTotal: 0,
        last24HoursChange: 0,
        items: [],
      }),
    };

    const { result } = renderHook(() =>
      useBalance({ account: account as any, networkId: 'solana-mainnet' })
    );

    await waitFor(() => {
      expect(result.current.hiddenBalance).toBe(true);
    });

    await act(async () => {
      await result.current.toggleHidden();
    });

    expect(result.current.hiddenBalance).toBe(false);
    expect(mockSetStorageItem).toHaveBeenCalledWith('hidden_balance', false);
  });

  it('returns a safe empty balance when Solana balance fetch fails inside the hook fetcher', async () => {
    const account = {
      getReceiveAddress: vi.fn().mockReturnValue('wallet-1'),
      getBalance: vi.fn().mockRejectedValue(new Error('rpc down')),
    };

    const { result } = renderHook(() =>
      useBalance({ account: account as any, networkId: 'solana-mainnet' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.tokens).toEqual([]);
    });

    expect(result.current.usdTotal).toBe(0);
    expect(result.current.changeAmount).toBe(0);
    expect(result.current.changePercent).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
