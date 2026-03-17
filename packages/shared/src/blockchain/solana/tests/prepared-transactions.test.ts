import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');

  class MockPublicKey {
    constructor(readonly value: string) {}

    toBase58() {
      return this.value;
    }
  }

  return {
    ...actual,
    PublicKey: MockPublicKey,
    VersionedTransaction: {
      deserialize: vi.fn(),
    },
  };
});

import { VersionedTransaction } from '@solana/web3.js';
import {
  getPreparedSolanaTransactions,
  signAndSendPreparedSolanaTransactions,
} from '../prepared-transactions';
import type { MarketplaceTransactionResponse } from '../../../types/nft';

describe('prepared-transactions', () => {
  const deserializeMock = vi.mocked(VersionedTransaction.deserialize);
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: TimerHandler) => {
      if (typeof callback === 'function') {
        callback();
      }

      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.setTimeout = originalSetTimeout;
  });

  it('returns prepared transactions from multi-step and single-step responses', () => {
    const multiStep: MarketplaceTransactionResponse = {
      transactions: [
        { transaction: 'step-1', step: 'lookup_table_create' },
        { transaction: 'step-2', step: 'burn' },
      ],
    };
    const singleStep: MarketplaceTransactionResponse = {
      transaction: 'single-step',
    };

    expect(getPreparedSolanaTransactions(multiStep)).toEqual(multiStep.transactions);
    expect(getPreparedSolanaTransactions(singleStep)).toEqual([
      { transaction: 'single-step', step: 'transaction' },
    ]);
  });

  it('refreshes the blockhash before signing and confirming a transaction', async () => {
    const mockTransaction = {
      message: { recentBlockhash: 'stale-blockhash' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('signed-tx')),
    };
    deserializeMock.mockReturnValue(mockTransaction as never);

    const connection = {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'fresh-blockhash',
        lastValidBlockHeight: 321,
      }),
      sendRawTransaction: vi.fn().mockResolvedValue('signature-1'),
      confirmTransaction: vi.fn().mockResolvedValue(undefined),
      getAddressLookupTable: vi.fn(),
      getSlot: vi.fn(),
    };
    const account = {
      keyPair: { publicKey: 'owner-key' },
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    const signatures = await signAndSendPreparedSolanaTransactions(
      account as never,
      { transaction: Buffer.from('tx-1').toString('base64') }
    );

    expect(signatures).toEqual(['signature-1']);
    expect(mockTransaction.message.recentBlockhash).toBe('fresh-blockhash');
    expect(mockTransaction.sign).toHaveBeenCalledWith([account.keyPair]);
    expect(connection.sendRawTransaction).toHaveBeenCalledWith(Buffer.from('signed-tx'), {
      preflightCommitment: 'confirmed',
    });
    expect(connection.confirmTransaction).toHaveBeenCalledWith(
      {
        signature: 'signature-1',
        blockhash: 'fresh-blockhash',
        lastValidBlockHeight: 321,
      },
      'confirmed'
    );
  });

  it('prefers signature subscriptions over confirmTransaction when available', async () => {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;

    global.setTimeout = vi.fn(() => 0 as unknown as ReturnType<typeof setTimeout>) as unknown as typeof setTimeout;
    global.clearTimeout = vi.fn() as typeof clearTimeout;

    const mockTransaction = {
      message: { recentBlockhash: 'stale-blockhash' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('signed-tx')),
    };
    deserializeMock.mockReturnValue(mockTransaction as never);

    const connection = {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'fresh-blockhash',
        lastValidBlockHeight: 321,
      }),
      sendRawTransaction: vi.fn().mockResolvedValue('signature-1'),
      confirmTransaction: vi.fn().mockResolvedValue(undefined),
      getAddressLookupTable: vi.fn(),
      getSlot: vi.fn(),
      onSignature: vi.fn().mockImplementation((_signature, callback) => {
        queueMicrotask(() => {
          callback({ err: null });
        });
        return 91;
      }),
      removeSignatureListener: vi.fn().mockResolvedValue(undefined),
    };
    const account = {
      keyPair: { publicKey: 'owner-key' },
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    const signatures = await signAndSendPreparedSolanaTransactions(
      account as never,
      { transaction: Buffer.from('tx-1').toString('base64') }
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(signatures).toEqual(['signature-1']);
    expect(connection.onSignature).toHaveBeenCalledWith(
      'signature-1',
      expect.any(Function),
      'confirmed'
    );
    expect(connection.removeSignatureListener).toHaveBeenCalledWith(91);
    expect(connection.confirmTransaction).not.toHaveBeenCalled();

    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it('waits for lookup table addresses to warm up before moving to the burn step', async () => {
    const extendTransaction = {
      message: { recentBlockhash: 'stale-extend' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('extend-signed')),
    };
    const burnTransaction = {
      message: { recentBlockhash: 'stale-burn' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('burn-signed')),
    };
    deserializeMock
      .mockReturnValueOnce(extendTransaction as never)
      .mockReturnValueOnce(burnTransaction as never);

    const lookupTable = {
      state: {
        addresses: new Array(20).fill('address'),
        lastExtendedSlot: 80,
      },
    };

    const connection = {
      getLatestBlockhash: vi
        .fn()
        .mockResolvedValueOnce({ blockhash: 'extend-blockhash', lastValidBlockHeight: 100 })
        .mockResolvedValueOnce({ blockhash: 'burn-blockhash', lastValidBlockHeight: 101 }),
      sendRawTransaction: vi
        .fn()
        .mockResolvedValueOnce('signature-extend')
        .mockResolvedValueOnce('signature-burn'),
      confirmTransaction: vi.fn().mockResolvedValue(undefined),
      getAddressLookupTable: vi
        .fn()
        .mockResolvedValueOnce({ value: lookupTable })
        .mockResolvedValueOnce({ value: lookupTable }),
      getSlot: vi
        .fn()
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(81),
    };
    const account = {
      keyPair: { publicKey: 'owner-key' },
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    const response: MarketplaceTransactionResponse = {
      transactions: [
        {
          transaction: Buffer.from('lookup-extend').toString('base64'),
          step: 'lookup_table_extend',
          lookupTableAddress: 'lookup-table-address',
          expectedLookupTableAddressCount: 20,
        },
        {
          transaction: Buffer.from('burn-tx').toString('base64'),
          step: 'burn',
        },
      ],
    };

    const signatures = await signAndSendPreparedSolanaTransactions(account as never, response, {
      commitment: 'confirmed',
    });

    expect(signatures).toEqual(['signature-extend', 'signature-burn']);
    expect(connection.getAddressLookupTable).toHaveBeenCalledTimes(2);
    expect(connection.getSlot).toHaveBeenCalledTimes(2);
    expect(connection.sendRawTransaction).toHaveBeenNthCalledWith(2, Buffer.from('burn-signed'), {
      preflightCommitment: 'confirmed',
    });
  });

  it('prefers websocket subscriptions for LUT warmup when the connection supports them', async () => {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;

    global.setTimeout = vi.fn(() => 0 as unknown as ReturnType<typeof setTimeout>) as unknown as typeof setTimeout;
    global.clearTimeout = vi.fn() as typeof clearTimeout;

    const extendTransaction = {
      message: { recentBlockhash: 'stale-extend' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('extend-signed')),
    };
    const burnTransaction = {
      message: { recentBlockhash: 'stale-burn' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('burn-signed')),
    };
    deserializeMock
      .mockReturnValueOnce(extendTransaction as never)
      .mockReturnValueOnce(burnTransaction as never);

    const lookupTable = {
      state: {
        addresses: new Array(20).fill('address'),
        lastExtendedSlot: 80,
      },
    };

    const connection = {
      getLatestBlockhash: vi
        .fn()
        .mockResolvedValueOnce({ blockhash: 'extend-blockhash', lastValidBlockHeight: 100 })
        .mockResolvedValueOnce({ blockhash: 'burn-blockhash', lastValidBlockHeight: 101 }),
      sendRawTransaction: vi
        .fn()
        .mockResolvedValueOnce('signature-extend')
        .mockResolvedValueOnce('signature-burn'),
      confirmTransaction: vi.fn().mockResolvedValue(undefined),
      getAddressLookupTable: vi.fn().mockResolvedValue({ value: lookupTable }),
      getSlot: vi.fn().mockResolvedValue(80),
      onAccountChange: vi.fn().mockReturnValue(1),
      removeAccountChangeListener: vi.fn().mockResolvedValue(undefined),
      onSlotChange: vi.fn().mockImplementation((callback) => {
        queueMicrotask(() => {
          callback({ slot: 81 });
        });
        return 2;
      }),
      removeSlotChangeListener: vi.fn().mockResolvedValue(undefined),
    };
    const account = {
      keyPair: { publicKey: 'owner-key' },
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    const response: MarketplaceTransactionResponse = {
      transactions: [
        {
          transaction: Buffer.from('lookup-extend').toString('base64'),
          step: 'lookup_table_extend',
          lookupTableAddress: 'lookup-table-address',
          expectedLookupTableAddressCount: 20,
        },
        {
          transaction: Buffer.from('burn-tx').toString('base64'),
          step: 'burn',
        },
      ],
    };

    const signatures = await signAndSendPreparedSolanaTransactions(account as never, response, {
      commitment: 'confirmed',
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(signatures).toEqual(['signature-extend', 'signature-burn']);
    expect(connection.onAccountChange).toHaveBeenCalledTimes(1);
    expect(connection.onSlotChange).toHaveBeenCalledTimes(1);
    expect(connection.getAddressLookupTable).toHaveBeenCalledTimes(1);
    expect(connection.getSlot).toHaveBeenCalledTimes(1);
    expect(connection.removeAccountChangeListener).toHaveBeenCalledWith(1);
    expect(connection.removeSlotChangeListener).toHaveBeenCalledWith(2);

    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it('surfaces the failing step in the thrown error message', async () => {
    const mockTransaction = {
      message: { recentBlockhash: 'stale-blockhash' },
      sign: vi.fn(),
      serialize: vi.fn(() => Buffer.from('signed-tx')),
    };
    deserializeMock.mockReturnValue(mockTransaction as never);

    const connection = {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'fresh-blockhash',
        lastValidBlockHeight: 321,
      }),
      sendRawTransaction: vi.fn().mockRejectedValue(new Error('rpc boom')),
      confirmTransaction: vi.fn(),
      getAddressLookupTable: vi.fn(),
      getSlot: vi.fn(),
    };
    const account = {
      keyPair: { publicKey: 'owner-key' },
      getConnection: vi.fn().mockResolvedValue(connection),
    };

    await expect(
      signAndSendPreparedSolanaTransactions(account as never, {
        transactions: [
          {
            transaction: Buffer.from('burn-step').toString('base64'),
            step: 'burn',
          },
        ],
      })
    ).rejects.toThrow('Failed during burn: rpc boom');
  });
});
