/**
 * @vitest-environment jsdom
 * Tests for useSendTransaction hook
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSendTransaction } from './useSendTransaction';

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
      })
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
      })
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
});
