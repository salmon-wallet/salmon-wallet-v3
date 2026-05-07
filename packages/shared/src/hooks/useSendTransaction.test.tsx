/**
 * @vitest-environment jsdom
 * Tests for useSendTransaction hook
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { useSendTransaction } from './useSendTransaction';
import { createTestQueryClient, QueryWrapper } from '../test-utils/query-wrapper';

function makeWrapper() {
  const client = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryWrapper client={client}>{children}</QueryWrapper>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

// ============================================================================
// Test Data
// ============================================================================

const RAW_RECIPIENT = 'nachomileo.sol';
const RESOLVED_RECIPIENT = '9xQeWvG816bUx9EPjHmaT23yvVMc2KLS8i4Qb9pQ6M7';
const TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const AMOUNT = 0.5;
const FEE_RESULT = { fee: '0.000005' };
const TX_RESULT = { txId: 'test-signature' };

const mockAccount = {
  estimateTransferFee: vi.fn(),
  transfer: vi.fn(),
  getReceiveAddress: () => 'mock-address',
  getNetworkId: () => 'solana-mainnet',
  network: { networkId: 'solana-mainnet' },
};

// ============================================================================
// Tests
// ============================================================================

describe('useSendTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccount.estimateTransferFee.mockResolvedValue(FEE_RESULT);
    mockAccount.transfer.mockResolvedValue(TX_RESULT);
  });

  it('uses the resolved recipient address for fee estimation when provided', async () => {
    const { result } = renderHook(() =>
      useSendTransaction({
        account: mockAccount as any,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    let feeResult = null;

    await act(async () => {
      feeResult = await result.current.estimateFee({
        token: {
          address: TOKEN_ADDRESS,
          decimals: 6,
          symbol: 'USDC',
        },
        recipientAddress: RAW_RECIPIENT,
        resolvedRecipientAddress: RESOLVED_RECIPIENT,
        amount: AMOUNT,
      });
    });

    expect(feeResult).toEqual(FEE_RESULT);
    expect(mockAccount.estimateTransferFee).toHaveBeenCalledWith(
      RESOLVED_RECIPIENT,
      TOKEN_ADDRESS,
      AMOUNT
    );
  });

  it('uses the resolved recipient address for transfer execution when provided', async () => {
    const { result } = renderHook(() =>
      useSendTransaction({
        account: mockAccount as any,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    let txResult = null;

    await act(async () => {
      txResult = await result.current.sendTransaction({
        token: {
          address: TOKEN_ADDRESS,
          decimals: 6,
          symbol: 'USDC',
        },
        recipientAddress: RAW_RECIPIENT,
        resolvedRecipientAddress: RESOLVED_RECIPIENT,
        amount: AMOUNT,
      });
    });

    expect(txResult).toEqual(TX_RESULT);
    expect(mockAccount.transfer).toHaveBeenCalledWith(
      RESOLVED_RECIPIENT,
      TOKEN_ADDRESS,
      AMOUNT,
      { decimals: 6, symbol: 'USDC' }
    );
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('returns null for fee estimation when account is missing', async () => {
    const { result } = renderHook(() =>
      useSendTransaction({
        account: undefined,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    let feeResult = null;

    await act(async () => {
      feeResult = await result.current.estimateFee({
        token: {
          address: TOKEN_ADDRESS,
          decimals: 6,
          symbol: 'USDC',
        },
        recipientAddress: RAW_RECIPIENT,
        amount: AMOUNT,
      });
    });

    expect(feeResult).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('throws when sending without an account', async () => {
    const { result } = renderHook(() =>
      useSendTransaction({
        account: undefined,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    await expect(
      result.current.sendTransaction({
        token: {
          address: TOKEN_ADDRESS,
          decimals: 6,
          symbol: 'USDC',
        },
        recipientAddress: RAW_RECIPIENT,
        amount: AMOUNT,
      })
    ).rejects.toThrow('No account available');
  });

  it('sets failed state and preserves error message when transfer fails', async () => {
    mockAccount.transfer.mockRejectedValueOnce(new Error('insufficient funds'));

    const { result } = renderHook(() =>
      useSendTransaction({
        account: mockAccount as any,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    await act(async () => {
      await expect(
        result.current.sendTransaction({
          token: {
            address: TOKEN_ADDRESS,
            decimals: 6,
            symbol: 'USDC',
          },
          recipientAddress: RAW_RECIPIENT,
          amount: AMOUNT,
        })
      ).rejects.toThrow('insufficient funds');
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('insufficient funds');
    expect(result.current.isError).toBe(true);
  });

  it('resets state after an error', async () => {
    mockAccount.transfer.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() =>
      useSendTransaction({
        account: mockAccount as any,
        blockchain: 'solana',
      }),
      { wrapper: makeWrapper() }
    );

    await act(async () => {
      await expect(
        result.current.sendTransaction({
          token: {
            address: TOKEN_ADDRESS,
            decimals: 6,
            symbol: 'USDC',
          },
          recipientAddress: RAW_RECIPIENT,
          amount: AMOUNT,
        })
      ).rejects.toThrow('boom');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
