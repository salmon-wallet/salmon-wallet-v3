import { Buffer } from 'buffer';
import {
  Keypair,
  MessageV0,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it, vi } from 'vitest';

import { ActionSimulationError, simulateActionTx } from '../simulate-action-tx';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const FAKE_BLOCKHASH = '11111111111111111111111111111112';

function buildTokenAccountData(mint: PublicKey, owner: PublicKey, amount: bigint): Buffer {
  const buf = Buffer.alloc(165);
  mint.toBuffer().copy(buf, 0);
  owner.toBuffer().copy(buf, 32);
  // u64 LE at offset 64
  for (let i = 0; i < 8; i++) {
    buf[64 + i] = Number((amount >> BigInt(8 * i)) & 0xffn);
  }
  return buf;
}

function buildMintData(decimals: number): Buffer {
  const buf = Buffer.alloc(82);
  buf[44] = decimals;
  return buf;
}

function makeVersionedTx(
  payer: Keypair,
  instructions: TransactionInstruction[] = [],
): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: FAKE_BLOCKHASH,
    instructions:
      instructions.length > 0
        ? instructions
        : [
            SystemProgram.transfer({
              fromPubkey: payer.publicKey,
              toPubkey: Keypair.generate().publicKey,
              lamports: 1_000,
            }),
          ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

function makeLegacyTx(payer: Keypair): Transaction {
  const tx = new Transaction({
    feePayer: payer.publicKey,
    recentBlockhash: FAKE_BLOCKHASH,
  });
  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1_000,
    }),
  );
  return tx;
}

function serialize(tx: VersionedTransaction | Transaction): string {
  if (tx instanceof VersionedTransaction) {
    return Buffer.from(tx.serialize()).toString('base64');
  }
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
}

interface SimSpec {
  err?: unknown;
  unitsConsumed?: number;
  logs?: string[];
  // overrides for post-state by base58 key
  postAccountsByKey?: Record<
    string,
    { lamports?: number; data?: [string, string]; owner?: string } | null
  >;
}

interface PreSpec {
  // Map of base58 key → AccountInfo-like object
  accounts: Record<
    string,
    | { lamports: number; owner: PublicKey; data: Buffer | Uint8Array }
    | null
  >;
}

function makeMockConnection(opts: {
  pre: PreSpec;
  sim: SimSpec;
  mintDecimals?: Record<string, number>;
}) {
  const { pre, sim, mintDecimals = {} } = opts;
  const getMultipleAccountsInfo = vi.fn(async (keys: PublicKey[]) => {
    return keys.map((k) => {
      const b58 = k.toBase58();
      if (b58 in pre.accounts) {
        const v = pre.accounts[b58];
        return v ?? null;
      }
      if (b58 in mintDecimals) {
        return {
          lamports: 1,
          owner: TOKEN_PROGRAM_ID,
          data: buildMintData(mintDecimals[b58]!),
        };
      }
      return null;
    });
  });

  const simulateTransaction = vi.fn(async (_tx: any, _opts?: any, _includeAccounts?: any) => {
    // Reconstruct response.value.accounts in order of staticAccountKeys.
    // Caller passes `addresses` for versioned, or `_includeAccounts` for legacy.
    let addresses: string[] = [];
    if (Array.isArray(_includeAccounts)) addresses = _includeAccounts;
    else if (_opts?.accounts?.addresses) addresses = _opts.accounts.addresses;
    const accounts = addresses.map((a) => {
      if (sim.postAccountsByKey && a in sim.postAccountsByKey) {
        const v = sim.postAccountsByKey[a];
        if (!v) return null;
        return {
          lamports: v.lamports ?? 0,
          owner: v.owner ?? TOKEN_PROGRAM_ID.toBase58(),
          data: v.data ?? null,
          executable: false,
          rentEpoch: 0,
        };
      }
      return null;
    });
    return {
      context: { slot: 1 },
      value: {
        err: sim.err ?? null,
        logs: sim.logs ?? [],
        accounts,
        unitsConsumed: sim.unitsConsumed,
      },
    };
  });

  return {
    getMultipleAccountsInfo,
    simulateTransaction,
  } as any;
}

describe('simulateActionTx — input validation', () => {
  it('rejects invalid base64 / undecodable bytes as invalid_transaction', async () => {
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    await expect(
      simulateActionTx({
        serializedTransactionBase64: '!!!not base64!!!',
        account: Keypair.generate().publicKey.toBase58(),
        connection,
      }),
    ).rejects.toMatchObject({ code: 'invalid_transaction' });
  });

  it('rejects empty payload as invalid_transaction', async () => {
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    await expect(
      simulateActionTx({
        serializedTransactionBase64: '',
        account: Keypair.generate().publicKey.toBase58(),
        connection,
      }),
    ).rejects.toMatchObject({ code: 'invalid_transaction' });
  });

  it('rejects non-pubkey account as invalid_account', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    await expect(
      simulateActionTx({
        serializedTransactionBase64: serialize(tx),
        account: 'not-a-pubkey',
        connection,
      }),
    ).rejects.toMatchObject({ code: 'invalid_account' });
  });
});

describe('simulateActionTx — failure detection', () => {
  it('throws simulation_failed with logs when value.err is non-null', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    const connection = makeMockConnection({
      pre: { accounts: {} },
      sim: { err: 'AccountNotFound', logs: ['log a', 'log b'] },
    });
    await expect(
      simulateActionTx({
        serializedTransactionBase64: serialize(tx),
        account: payer.publicKey.toBase58(),
        connection,
      }),
    ).rejects.toMatchObject({ code: 'simulation_failed', logs: ['log a', 'log b'] });
  });
});

describe('simulateActionTx — SOL deltas', () => {
  it('returns negative signer delta on outbound transfer + fee', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    const payerKey = payer.publicKey.toBase58();
    const connection = makeMockConnection({
      pre: {
        accounts: {
          [payerKey]: {
            lamports: 1_000_000,
            owner: SystemProgram.programId,
            data: Buffer.alloc(0),
          },
        },
      },
      sim: {
        unitsConsumed: 200,
        postAccountsByKey: {
          [payerKey]: {
            lamports: 994_000,
            owner: SystemProgram.programId.toBase58(),
            data: ['', 'base64'],
          },
        },
      },
    });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payerKey,
      connection,
    });
    expect(res.signerBalanceDelta.lamportsBefore).toBe(1_000_000n);
    expect(res.signerBalanceDelta.lamportsAfter).toBe(994_000n);
    expect(res.signerBalanceDelta.lamportsDelta).toBe(-6_000n);
    expect(res.tokenDeltas).toEqual([]);
    expect(res.computeUnitsConsumed).toBe(200);
    expect(res.warning).toBeUndefined();
  });

  it('computeUnitsConsumed is null when not returned', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.computeUnitsConsumed).toBeNull();
    expect(res.logs).toEqual([]);
  });
});

describe('simulateActionTx — token deltas', () => {
  it('returns one TokenDelta for an SPL transfer', async () => {
    const payer = Keypair.generate();
    const mint = Keypair.generate().publicKey;
    const ata = Keypair.generate().publicKey;
    // ix that simply references the ata account so it shows up in static keys
    const ix = new TransactionInstruction({
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: ata, isSigner: false, isWritable: true },
      ],
      data: Buffer.from([]),
    });
    const tx = makeVersionedTx(payer, [ix]);

    const ataKey = ata.toBase58();
    const mintKey = mint.toBase58();

    const connection = makeMockConnection({
      pre: {
        accounts: {
          [ataKey]: {
            lamports: 2_039_280,
            owner: TOKEN_PROGRAM_ID,
            data: buildTokenAccountData(mint, payer.publicKey, 1_000_000n),
          },
        },
      },
      sim: {
        postAccountsByKey: {
          [ataKey]: {
            lamports: 2_039_280,
            owner: TOKEN_PROGRAM_ID.toBase58(),
            data: [
              buildTokenAccountData(mint, payer.publicKey, 750_000n).toString('base64'),
              'base64',
            ],
          },
        },
      },
      mintDecimals: { [mintKey]: 6 },
    });

    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.tokenDeltas).toHaveLength(1);
    const td = res.tokenDeltas[0]!;
    expect(td.mint).toBe(mintKey);
    expect(td.owner).toBe(payer.publicKey.toBase58());
    expect(td.rawAmountDelta).toBe(-250_000n);
    expect(td.decimals).toBe(6);
    expect(td.uiAmountBefore).toBe('1');
    expect(td.uiAmountAfter).toBe('0.75');
  });

  it('emits empty tokenDeltas when no token state changes', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.tokenDeltas).toEqual([]);
  });
});

describe('simulateActionTx — partial signatures', () => {
  it('accepts a tx partial-signed with a valid signature and sets warning', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    tx.sign([payer]);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.warning).toBe(
      'transaction was partial-signed; existing signatures verified',
    );
  });

  it('rejects a tx with an invalid existing signature', async () => {
    const payer = Keypair.generate();
    const tx = makeVersionedTx(payer);
    // Forge a non-zero, invalid signature.
    const bogus = new Uint8Array(64);
    bogus.fill(7);
    tx.signatures[0] = bogus;
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    await expect(
      simulateActionTx({
        serializedTransactionBase64: serialize(tx),
        account: payer.publicKey.toBase58(),
        connection,
      }),
    ).rejects.toMatchObject({ code: 'invalid_partial_signature' });
  });
});

describe('simulateActionTx — transaction format support', () => {
  it('supports versioned (V0) transactions', async () => {
    const payer = Keypair.generate();
    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: FAKE_BLOCKHASH,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1,
        }),
      ],
    }).compileToV0Message();
    expect(message).toBeInstanceOf(MessageV0);
    const tx = new VersionedTransaction(message);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.signerBalanceDelta).toBeDefined();
  });

  it('supports legacy Transaction', async () => {
    const payer = Keypair.generate();
    const tx = makeLegacyTx(payer);
    const connection = makeMockConnection({ pre: { accounts: {} }, sim: {} });
    const res = await simulateActionTx({
      serializedTransactionBase64: serialize(tx),
      account: payer.publicKey.toBase58(),
      connection,
    });
    expect(res.signerBalanceDelta).toBeDefined();
    // Legacy path uses positional includeAccounts arg.
    expect(connection.simulateTransaction).toHaveBeenCalled();
  });
});

describe('ActionSimulationError', () => {
  it('preserves code, name and logs', () => {
    const err = new ActionSimulationError({ code: 'simulation_failed', logs: ['x'] });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ActionSimulationError');
    expect(err.code).toBe('simulation_failed');
    expect(err.logs).toEqual(['x']);
  });
});

// Touch nacl import to keep the dep tree honest in case tree-shaking changes.
void nacl.sign.detached;
