/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/account', () => ({
  getChainDisplayName: vi.fn((chain?: string | null) => {
    if (chain === 'solana') return 'Solana';
    if (chain === 'bitcoin') return 'Bitcoin';
    if (chain === 'ethereum') return 'Ethereum';
    return 'Unknown';
  }),
}));

import { useSwapScreenLogic } from './useSwapScreenLogic';

const SOL = {
  address: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  balance: 2,
  usdPrice: 150,
  chain: 'solana',
  networkId: 'solana-mainnet',
  logo: 'https://example.com/sol.png',
};

const USDC = {
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: 10,
  usdPrice: 1,
  chain: 'solana',
  networkId: 'solana-mainnet',
  logo: 'https://example.com/usdc.png',
};

const QUOTE = {
  output: {
    amount: '2500000',
    decimals: 6,
  },
  custom: {
    priceImpact: 0.5,
  },
} as any;

function createProps(overrides: Record<string, unknown> = {}) {
  return {
    tokens: [SOL, USDC],
    featuredTokens: [SOL, USDC],
    jupiterTokens: [SOL, USDC],
    loading: false,
    onGetQuote: vi.fn().mockResolvedValue(QUOTE),
    onSwap: vi.fn().mockResolvedValue({ txId: 'swap-tx-1' }),
    onSuccess: vi.fn(),
    onError: vi.fn(),
    onRefreshBalances: vi.fn(),
    onNavigateHome: vi.fn(),
    ...overrides,
  } as any;
}

describe('useSwapScreenLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces Solana quotes and enables review when quote arrives', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      initialOutToken: USDC,
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.setInAmount('1');
    });

    expect(result.current.isLoadingQuote).toBe(true);
    expect(props.onGetQuote).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(props.onGetQuote).toHaveBeenCalledWith(SOL, USDC, '1');
    expect(result.current.quote).toBe(QUOTE);
    expect(result.current.outAmount).toBe('2.5');
    expect(result.current.swapMode).toBe('jupiter');
    expect(result.current.canReview).toBe(true);
    expect(result.current.reviewWarning).toBeNull();
  });

  it('surfaces minimum USD guardrails before review', () => {
    const lowPriceSol = { ...SOL, usdPrice: 0.5 };
    const props = createProps({
      initialInToken: lowPriceSol,
      initialOutToken: USDC,
      tokens: [lowPriceSol, USDC],
      featuredTokens: [lowPriceSol, USDC],
      jupiterTokens: [lowPriceSol, USDC],
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.setInAmount('1');
    });

    expect(result.current.canReview).toBe(false);
    expect(result.current.reviewWarning).toBe('Minimum swap amount is $1.00 USD');
  });

  it('refreshes in-token balance when tokens prop changes', async () => {
    const props = createProps({
      initialInToken: SOL,
      initialOutToken: USDC,
    });

    const { result, rerender } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    expect(result.current.inToken?.balance).toBe(2);

    await act(async () => {
      rerender({
        ...props,
        tokens: [{ ...SOL, balance: 5 }, USDC],
        featuredTokens: [{ ...SOL, balance: 5 }, USDC],
        jupiterTokens: [{ ...SOL, balance: 5 }, USDC],
      });
    });

    expect(result.current.inToken?.balance).toBe(5);
  });

  it('confirms a Solana swap and triggers balance refresh callbacks', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      initialOutToken: USDC,
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    act(() => {
      result.current.handleReview();
    });
    expect(result.current.step).toBe('review');

    await act(async () => {
      await result.current.handleConfirmSwap();
    });

    expect(props.onSwap).toHaveBeenCalledWith(QUOTE);
    expect(props.onRefreshBalances).toHaveBeenCalledTimes(1);
    expect(props.onSuccess).toHaveBeenCalledWith('swap-tx-1');
    expect(result.current.step).toBe('success');
    expect(result.current.successTxId).toBe('swap-tx-1');
  });

  it('resets state after success and refreshes balances again on continue', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      initialOutToken: USDC,
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    act(() => {
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    act(() => {
      result.current.handleReview();
    });

    await act(async () => {
      await result.current.handleConfirmSwap();
    });

    act(() => {
      result.current.handleSuccessContinue();
    });

    expect(props.onRefreshBalances).toHaveBeenCalledTimes(2);
    expect(props.onNavigateHome).toHaveBeenCalledTimes(1);
    expect(result.current.step).toBe('input');
    expect(result.current.inAmount).toBe('');
    expect(result.current.outAmount).toBe('');
    expect(result.current.quote).toBeNull();
    expect(result.current.successTxId).toBeNull();
  });
});
