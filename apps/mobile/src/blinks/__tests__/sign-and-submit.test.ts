/**
 * Unit tests for `sign-and-submit.ts` — covers the V0 fee-payer guard
 * (active wallet must equal `message.staticAccountKeys[0]` on BOTH unsigned
 * and partial-signed V0 paths), and a legacy-unsigned smoke test.
 *
 * Risk gates exercised:
 *   v0_feepayer_mismatch — refuse to sign V0 txs whose encoded fee payer
 *                          slot doesn't match the active wallet pubkey.
 *   R8 — partial-signed V0 path is signed AS-IS only when the fee-payer
 *        slot matches the local wallet (publishers can't trick the wallet
 *        into signing a tx that would debit a different fee payer).
 *
 * `@solana/web3.js` is mocked here. The shape of the mock mirrors the
 * narrow surface used by the helper:
 *   - VersionedTransaction.deserialize → returns an object with
 *     `message.staticAccountKeys[]` and `message.recentBlockhash` and
 *     `sign()` / `serialize()` methods.
 *   - Transaction.from → returns a similar legacy stand-in.
 *   - PublicKey is a class with `.equals(other)` semantics.
 */

// Globals capturing the next deserialize result so each test can shape it
// per scenario.
let mockNextVersionedFactory: (() => any) | null = null;
let mockNextLegacyFactory: (() => any) | null = null;

class MockPublicKey {
  constructor(public value: string) {}
  equals(other: MockPublicKey | undefined | null): boolean {
    return !!other && other.value === this.value;
  }
}

jest.mock('@solana/web3.js', () => {
  return {
    PublicKey: MockPublicKey,
    Transaction: {
      from: () => {
        if (!mockNextLegacyFactory) throw new Error('no legacy factory set');
        return mockNextLegacyFactory();
      },
    },
    VersionedTransaction: {
      deserialize: () => {
        if (!mockNextVersionedFactory) throw new Error('no versioned factory set');
        return mockNextVersionedFactory();
      },
    },
  };
});

import { signAndSubmitActionTransaction } from '../sign-and-submit';

function makeConnection() {
  return {
    getLatestBlockhash: jest
      .fn()
      .mockResolvedValue({ blockhash: 'BH', lastValidBlockHeight: 1000 }),
    sendRawTransaction: jest.fn().mockResolvedValue('SIG_BASE58'),
    confirmTransaction: jest.fn().mockResolvedValue({}),
  };
}

function makeAccount(pk: MockPublicKey) {
  return {
    publicKey: pk,
    keyPair: {
      publicKey: pk,
      secretKey: new Uint8Array(64),
    },
  };
}

function makeVersionedMock(staticAccountKeys: MockPublicKey[]) {
  return {
    message: {
      staticAccountKeys,
      recentBlockhash: 'OLD',
    },
    sign: jest.fn(),
    serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  };
}

function makeLegacyMock(feePayer: MockPublicKey | null) {
  return {
    feePayer,
    recentBlockhash: 'OLD',
    partialSign: jest.fn(),
    serialize: jest.fn().mockReturnValue(new Uint8Array([4, 5, 6])),
  };
}

beforeEach(() => {
  mockNextVersionedFactory = null;
  mockNextLegacyFactory = null;
});

describe('signAndSubmitActionTransaction — V0 fee-payer guard', () => {
  it('v0 unsigned with feePayer matching active account → succeeds', async () => {
    const userPk = new MockPublicKey('USER');
    const recipientPk = new MockPublicKey('RECIPIENT');
    const v = makeVersionedMock([userPk, recipientPk]);
    mockNextVersionedFactory = () => v;

    const conn = makeConnection();
    const res = await signAndSubmitActionTransaction({
      serializedTransactionBase64: 'AAAA',
      account: makeAccount(userPk) as never,
      connection: conn as never,
      partialSigned: false,
    });

    expect(res.signature).toBe('SIG_BASE58');
    expect(conn.getLatestBlockhash).toHaveBeenCalledWith('finalized');
    expect(v.sign).toHaveBeenCalled();
    expect(conn.sendRawTransaction).toHaveBeenCalled();
    expect(conn.confirmTransaction).toHaveBeenCalled();
    // Blockhash WAS refreshed on unsigned path.
    expect(v.message.recentBlockhash).toBe('BH');
  });

  it('v0 unsigned with feePayer = some other pubkey → throws v0_feepayer_mismatch', async () => {
    const userPk = new MockPublicKey('USER');
    const otherPk = new MockPublicKey('OTHER');
    const v = makeVersionedMock([otherPk]);
    mockNextVersionedFactory = () => v;

    const conn = makeConnection();
    await expect(
      signAndSubmitActionTransaction({
        serializedTransactionBase64: 'AAAA',
        account: makeAccount(userPk) as never,
        connection: conn as never,
        partialSigned: false,
      }),
    ).rejects.toThrow('v0_feepayer_mismatch');

    // Guard fires BEFORE any network call or signing.
    expect(conn.getLatestBlockhash).not.toHaveBeenCalled();
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
    expect(v.sign).not.toHaveBeenCalled();
  });

  it('v0 partial-signed with feePayer matching → succeeds (no blockhash refresh)', async () => {
    const userPk = new MockPublicKey('USER');
    const v = makeVersionedMock([userPk]);
    mockNextVersionedFactory = () => v;

    const conn = makeConnection();
    const res = await signAndSubmitActionTransaction({
      serializedTransactionBase64: 'AAAA',
      account: makeAccount(userPk) as never,
      connection: conn as never,
      partialSigned: true,
    });

    expect(res.signature).toBe('SIG_BASE58');
    expect(conn.getLatestBlockhash).not.toHaveBeenCalled();
    expect(v.sign).toHaveBeenCalled();
    expect(conn.sendRawTransaction).toHaveBeenCalled();
    // Partial-signed path must NOT mutate blockhash.
    expect(v.message.recentBlockhash).toBe('OLD');
  });

  it('v0 partial-signed with feePayer mismatch → throws v0_feepayer_mismatch', async () => {
    const userPk = new MockPublicKey('USER');
    const otherPk = new MockPublicKey('OTHER');
    const v = makeVersionedMock([otherPk]);
    mockNextVersionedFactory = () => v;

    const conn = makeConnection();
    await expect(
      signAndSubmitActionTransaction({
        serializedTransactionBase64: 'AAAA',
        account: makeAccount(userPk) as never,
        connection: conn as never,
        partialSigned: true,
      }),
    ).rejects.toThrow('v0_feepayer_mismatch');

    expect(v.sign).not.toHaveBeenCalled();
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('v0 with empty staticAccountKeys → throws v0_feepayer_mismatch', async () => {
    const userPk = new MockPublicKey('USER');
    const v = makeVersionedMock([]);
    mockNextVersionedFactory = () => v;

    const conn = makeConnection();
    await expect(
      signAndSubmitActionTransaction({
        serializedTransactionBase64: 'AAAA',
        account: makeAccount(userPk) as never,
        connection: conn as never,
        partialSigned: false,
      }),
    ).rejects.toThrow('v0_feepayer_mismatch');
  });

  it('legacy unsigned with feePayer set to active account → succeeds', async () => {
    const userPk = new MockPublicKey('USER');
    // Force versioned deserialize to fail so we fall through to legacy.
    mockNextVersionedFactory = () => {
      throw new Error('not versioned');
    };
    const legacy = makeLegacyMock(null);
    mockNextLegacyFactory = () => legacy;

    const conn = makeConnection();
    const res = await signAndSubmitActionTransaction({
      serializedTransactionBase64: 'AAAA',
      account: makeAccount(userPk) as never,
      connection: conn as never,
      partialSigned: false,
    });

    expect(res.signature).toBe('SIG_BASE58');
    // Helper sets feePayer + refreshes blockhash on the unsigned legacy path.
    expect(legacy.feePayer).toBe(userPk);
    expect(legacy.recentBlockhash).toBe('BH');
    expect(legacy.partialSign).toHaveBeenCalled();
    expect(conn.confirmTransaction).toHaveBeenCalled();
  });
});
