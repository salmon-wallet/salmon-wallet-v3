/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwapToken } from '../types/swap';

vi.mock('../utils/account', () => ({
  getChainDisplayName: vi.fn((chain?: string | null) => {
    if (chain === 'solana') return 'Solana';
    if (chain === 'bitcoin') return 'Bitcoin';
    if (chain === 'ethereum') return 'Ethereum';
    return 'Unknown';
  }),
}));

vi.mock('../api/services/network', () => ({
  getEnabledNetworkIds: vi.fn().mockResolvedValue([]),
}));

import { useSwapScreenLogic } from './useSwapScreenLogic';

const SOL: SwapToken = {
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

const USDC: SwapToken = {
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

const BTC: SwapToken = {
  address: 'BTC',
  symbol: 'BTC',
  name: 'Bitcoin',
  decimals: 8,
  balance: 0.25,
  usdPrice: 70_000,
  chain: 'bitcoin',
  networkId: 'bitcoin',
  logo: 'https://example.com/btc.png',
};

const BRIDGE_ESTIMATE = {
  estimatedAmount: 0.000021,
  minAmount: 0.00001,
  symbolIn: 'SOL',
  symbolOut: 'BTC',
} as any;

const BRIDGE_AVAILABLE_TOKENS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: null,
    logo: 'https://example.com/btc.png',
  },
] as any;

const BRIDGE_EXCHANGE = {
  id: 'bridge-1',
  depositAddress: 'bridge-deposit-address',
  amountIn: 1,
  amountOut: 0.000021,
  symbolIn: 'SOL',
  symbolOut: 'BTC',
  addressTo: 'btc-recipient',
  status: 'waiting',
} as any;

const BRIDGE_TRANSACTION = {
  status: 'confirming',
  payoutTxId: 'btc-payout-hash',
} as any;

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
    onGetAvailableTokens: undefined,
    onGetBridgeEstimate: vi.fn().mockResolvedValue(BRIDGE_ESTIMATE),
    onCreateBridgeExchange: vi.fn().mockResolvedValue(BRIDGE_EXCHANGE),
    onGetBridgeTransactionStatus: vi.fn().mockResolvedValue(BRIDGE_TRANSACTION),
    onBridgeSuccess: vi.fn(),
    onBridgeError: vi.fn(),
    onSendDeposit: vi.fn().mockResolvedValue({ txId: 'deposit-tx-1' }),
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

  it('requires a valid recipient address before moving from bridge recipient to review', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      tokens: [SOL],
      featuredTokens: [SOL],
      jupiterTokens: [SOL, USDC],
      onGetAvailableTokens: vi.fn().mockResolvedValue(BRIDGE_AVAILABLE_TOKENS),
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleOutTokenSelect(BTC);
    });

    act(() => {
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(props.onGetBridgeEstimate).toHaveBeenCalledTimes(1);
    expect(result.current.bridgeEstimate).toBe(BRIDGE_ESTIMATE);
    expect(result.current.swapMode).toBe('stealthex');
    expect(result.current.canReview).toBe(true);

    act(() => {
      result.current.handleReview();
    });

    expect(result.current.step).toBe('recipient');

    act(() => {
      result.current.setRecipientAddress('bad');
    });

    act(() => {
      result.current.handleContinueToReview();
    });

    expect(result.current.step).toBe('recipient');
    expect(result.current.addressError).toBe('Invalid Bitcoin address');
  });

  it('tracks bridge transaction status after exchange creation', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      tokens: [SOL],
      featuredTokens: [SOL],
      jupiterTokens: [SOL, USDC],
      onGetAvailableTokens: vi.fn().mockResolvedValue(BRIDGE_AVAILABLE_TOKENS),
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleOutTokenSelect(BTC);
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      result.current.handleReview();
      result.current.setRecipientAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    });

    act(() => {
      result.current.handleContinueToReview();
    });

    await act(async () => {
      await result.current.handleConfirmBridge();
    });

    expect(props.onCreateBridgeExchange).toHaveBeenCalledTimes(1);
    expect(props.onSendDeposit).toHaveBeenCalledTimes(1);
    expect(props.onGetBridgeTransactionStatus).toHaveBeenCalledWith('bridge-1');
    expect(result.current.bridgeTransaction).toEqual(BRIDGE_TRANSACTION);
    expect(result.current.successExchange).toEqual(BRIDGE_EXCHANGE);
    expect(result.current.depositTxId).toBe('deposit-tx-1');
    expect(result.current.step).toBe('success');
  });

  it('confirms a bridge, sends the deposit transaction, and stores success state', async () => {
    vi.useFakeTimers();

    const props = createProps({
      initialInToken: SOL,
      tokens: [SOL],
      featuredTokens: [SOL],
      jupiterTokens: [SOL, USDC],
      onGetAvailableTokens: vi.fn().mockResolvedValue(BRIDGE_AVAILABLE_TOKENS),
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleOutTokenSelect(BTC);
    });

    act(() => {
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(props.onGetBridgeEstimate).toHaveBeenCalledTimes(1);
    expect(result.current.bridgeEstimate).toBe(BRIDGE_ESTIMATE);

    act(() => {
      result.current.handleReview();
    });

    act(() => {
      result.current.setRecipientAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    });

    act(() => {
      result.current.handleContinueToReview();
    });

    expect(result.current.step).toBe('review');

    await act(async () => {
      await result.current.handleConfirmBridge();
    });

    expect(props.onCreateBridgeExchange).toHaveBeenCalledWith(
      'SOL',
      'BTC',
      1,
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      'sol',
      'btc'
    );
    expect(props.onSendDeposit).toHaveBeenCalledWith('bridge-deposit-address', SOL.address, 1);
    expect(props.onRefreshBalances).toHaveBeenCalledTimes(1);
    expect(props.onBridgeSuccess).toHaveBeenCalledWith(BRIDGE_EXCHANGE);
    expect(result.current.step).toBe('success');
    expect(result.current.depositTxId).toBe('deposit-tx-1');
    expect(result.current.successExchange).toBe(BRIDGE_EXCHANGE);
  });

  it('returns to input after a bridge failure and reports the error callback', async () => {
    vi.useFakeTimers();

    const error = new Error('bridge unavailable');
    const props = createProps({
      initialInToken: SOL,
      tokens: [SOL],
      featuredTokens: [SOL],
      jupiterTokens: [SOL, USDC],
      onGetAvailableTokens: vi.fn().mockResolvedValue(BRIDGE_AVAILABLE_TOKENS),
      onCreateBridgeExchange: vi.fn().mockRejectedValue(error),
    });

    const { result } = renderHook((hookProps) => useSwapScreenLogic(hookProps), {
      initialProps: props,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleOutTokenSelect(BTC);
    });

    act(() => {
      result.current.setInAmount('1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(props.onGetBridgeEstimate).toHaveBeenCalledTimes(1);
    expect(result.current.bridgeEstimate).toBe(BRIDGE_ESTIMATE);

    act(() => {
      result.current.handleReview();
    });

    act(() => {
      result.current.setRecipientAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    });

    act(() => {
      result.current.handleContinueToReview();
    });

    await act(async () => {
      await result.current.handleConfirmBridge();
    });

    expect(result.current.step).toBe('error');
    expect(props.onBridgeError).toHaveBeenCalledWith(error);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.step).toBe('input');
  });
});
