/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/services/bridge', () => ({
  getBridgeEstimatedAmount: vi.fn(),
  getBridgeMinimalAmount: vi.fn(),
  getBridgeSupportedTokens: vi.fn(),
  getBridgeAvailableTokens: vi.fn(),
  getBridgeFeaturedTokens: vi.fn(),
  createBridgeExchange: vi.fn(),
  getBridgeTransaction: vi.fn(),
}));

import { useBridge } from './useBridge';
import {
  getBridgeEstimatedAmount,
  getBridgeMinimalAmount,
  getBridgeSupportedTokens,
  createBridgeExchange,
  getBridgeTransaction,
} from '../api/services/bridge';

const mockGetBridgeEstimatedAmount = vi.mocked(getBridgeEstimatedAmount);
const mockGetBridgeMinimalAmount = vi.mocked(getBridgeMinimalAmount);
const mockGetBridgeSupportedTokens = vi.mocked(getBridgeSupportedTokens);
const mockCreateBridgeExchange = vi.mocked(createBridgeExchange);
const mockGetBridgeTransaction = vi.mocked(getBridgeTransaction);

describe('useBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads supported tokens and stores them in hook state', async () => {
    mockGetBridgeSupportedTokens.mockResolvedValueOnce([{ symbol: 'SOL', name: 'Solana' }] as any);
    const { result } = renderHook(() => useBridge());

    await act(async () => {
      await result.current.getSupportedTokens('solana-mainnet');
    });

    expect(result.current.supportedTokens).toEqual([{ symbol: 'SOL', name: 'Solana' }]);
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('maps estimate failures to a user friendly minimum amount message', async () => {
    mockGetBridgeEstimatedAmount.mockRejectedValueOnce(
      new Error('Bridge fetch estimated amount failed: amount less than minimal')
    );
    mockGetBridgeMinimalAmount.mockResolvedValueOnce(0.75 as any);

    const { result } = renderHook(() => useBridge());

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await result.current.getEstimate('sol', 'eth', 0.5);
      } catch (error) {
        caughtError = error as Error;
      }
    });

    expect(caughtError?.message).toBe('Minimum bridge amount is 0.75 SOL');

    await waitFor(() => {
      expect(result.current.status).toBe('failed');
      expect(result.current.error).toBe('Minimum bridge amount is 0.75 SOL');
    });
  });

  it('stores a successful estimate even if minimum amount lookup fails', async () => {
    mockGetBridgeEstimatedAmount.mockResolvedValueOnce(1.23 as any);
    mockGetBridgeMinimalAmount.mockRejectedValueOnce(new Error('min unavailable'));

    const { result } = renderHook(() => useBridge());

    let estimate;
    await act(async () => {
      estimate = await result.current.getEstimate('sol', 'eth', 1);
    });

    expect(estimate).toEqual({
      estimatedAmount: 1.23,
      minAmount: 0,
      symbolIn: 'sol',
      symbolOut: 'eth',
    });
    expect(result.current.estimate).toEqual(estimate);
    expect(result.current.status).toBe('idle');
  });

  it('creates exchanges and exposes exchange-created state', async () => {
    mockCreateBridgeExchange.mockResolvedValueOnce({
      id: 'bridge-1',
      currencyFrom: 'sol',
      currencyTo: 'eth',
      amountExpectedFrom: 1,
      amountExpectedTo: 0.01,
      payinAddress: 'deposit-address',
      payoutAddress: '0xrecipient',
      status: 'waiting',
    } as any);

    const { result } = renderHook(() => useBridge());

    await act(async () => {
      await result.current.createExchange('sol', 'eth', 1, '0xrecipient');
    });

    expect(result.current.exchange?.id).toBe('bridge-1');
    expect(result.current.status).toBe('exchange-created');
  });

  it('tracks bridge transaction success and reset clears state', async () => {
    mockGetBridgeTransaction.mockResolvedValueOnce({
      id: 'bridge-1',
      currencyFrom: 'sol',
      currencyTo: 'eth',
      payinAddress: 'deposit',
      payoutAddress: '0xrecipient',
      status: 'finished',
    } as any);

    const { result } = renderHook(() => useBridge());

    await act(async () => {
      await result.current.getTransactionStatus('bridge-1');
    });

    expect(result.current.transaction?.status).toBe('finished');
    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.transaction).toBeNull();
    expect(result.current.exchange).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
