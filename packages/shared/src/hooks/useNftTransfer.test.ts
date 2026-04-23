/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNftTransfer } from './useNftTransfer';

const SOLANA_NFT = {
  blockchain: 'solana',
  mint: 'mint-1',
  name: 'Test NFT',
} as any;

const BITCOIN_NFT = {
  blockchain: 'bitcoin',
  mint: 'inscription-1',
  name: 'Ordinal',
} as any;

describe('useNftTransfer', () => {
  const account = {
    transfer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    account.transfer.mockResolvedValue({ txId: 'nft-tx-1' });
  });

  it('transfers a Solana nft via account.transfer and exposes success state', async () => {
    const { result } = renderHook(() =>
      useNftTransfer({
        account: account as any,
      })
    );

    let transferResult;
    await act(async () => {
      transferResult = await result.current.sendNft(SOLANA_NFT, 'recipient-address');
    });

    expect(account.transfer).toHaveBeenCalledWith('recipient-address', 'mint-1', 1);
    expect(transferResult).toEqual({ txId: 'nft-tx-1' });
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('throws immediately when no account is available', async () => {
    const { result } = renderHook(() =>
      useNftTransfer({
        account: undefined,
      })
    );

    await expect(result.current.sendNft(SOLANA_NFT, 'recipient-address')).rejects.toThrow(
      'No account available'
    );
  });

  it('rejects unsupported ordinal transfers without calling account.transfer', async () => {
    const { result } = renderHook(() =>
      useNftTransfer({
        account: account as any,
      })
    );

    await act(async () => {
      await expect(
        result.current.sendNft(BITCOIN_NFT, 'recipient-address')
      ).rejects.toThrow('Ordinal transfers are not yet supported');
    });

    expect(account.transfer).not.toHaveBeenCalled();
    expect(result.current.status).toBe('failed');
  });

  it('surfaces transfer failures and allows reset', async () => {
    account.transfer.mockRejectedValueOnce(new Error('ata creation failed'));

    const { result } = renderHook(() =>
      useNftTransfer({
        account: account as any,
      })
    );

    await act(async () => {
      await expect(
        result.current.sendNft(SOLANA_NFT, 'recipient-address')
      ).rejects.toThrow('ata creation failed');
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('ata creation failed');
    expect(result.current.isError).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
