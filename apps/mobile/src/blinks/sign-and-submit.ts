/**
 * Sign + submit pipeline for Solana Actions / Blinks transactions.
 *
 * Risk gates (do not relax without re-running the threat model):
 *   R8 — partial-signed transactions are signed AS-IS (no feePayer /
 *        recentBlockhash mutation). For unsigned transactions, the route
 *        sets feePayer to the active wallet pubkey and refreshes the
 *        blockhash via `getLatestBlockhash('finalized')`.
 *   v0 feePayer guard — for versioned (V0) transactions the publisher
 *        encodes the fee payer at `message.staticAccountKeys[0]`. This
 *        module refuses to sign any V0 tx whose fee-payer slot does not
 *        equal the active wallet's pubkey, on both unsigned and partial-
 *        signed paths. Throws `Error('v0_feepayer_mismatch')`.
 *
 * This module is split out of `apps/mobile/app/` so the route can be
 * tested without pulling `@solana/web3.js` into Jest. The route mocks this
 * module; this module's invariants are covered by simulator tests in
 * `@salmon/shared/blinks/simulate` (signature verification, ALT resolution),
 * by component tests for the approval UX, and by the unit tests in
 * `./__tests__/sign-and-submit.test.ts`.
 */
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

export interface SignSubmitInput {
  serializedTransactionBase64: string;
  account: { publicKey: PublicKey; keyPair: { publicKey: PublicKey; secretKey: Uint8Array } };
  connection: Connection;
  /** True if the tx already carries a non-zero signature from the provider. */
  partialSigned: boolean;
}

export interface SignSubmitResult {
  signature: string;
  blockhash?: string;
  lastValidBlockHeight?: number;
}

/**
 * Inspects a serialized base64 transaction without signing. Returns whether
 * the tx already has any non-zero signature. Useful for routing partial-vs-
 * unsigned branches before invoking `signAndSubmitActionTransaction`.
 */
export function inspectTransactionSigStatus(
  serializedTransactionBase64: string,
): { partialSigned: boolean; isVersioned: boolean } {
  const bytes = Uint8Array.from(Buffer.from(serializedTransactionBase64, 'base64'));
  try {
    const v = VersionedTransaction.deserialize(bytes);
    const hasSig = (v.signatures ?? []).some(
      (s) => s && s.length > 0 && s.some((b) => b !== 0),
    );
    return { partialSigned: hasSig, isVersioned: true };
  } catch {
    const tx = Transaction.from(bytes);
    const hasSig = tx.signatures.some(
      ({ signature }) => signature && signature.length > 0 && signature.some((b) => b !== 0),
    );
    return { partialSigned: hasSig, isVersioned: false };
  }
}

/**
 * Signs and submits an Action transaction. Implements the partial-signed-
 * vs-unsigned branching defensively (R8): for partial-signed txs, the
 * `feePayer` and `recentBlockhash` fields are NEVER mutated; the local
 * signer's signature is added in-place. For unsigned txs, the route sets
 * `feePayer` to the active wallet pubkey and refreshes blockhash.
 *
 * For V0 transactions, asserts `staticAccountKeys[0]` (the encoded fee
 * payer) equals the active wallet pubkey on BOTH unsigned and partial-
 * signed paths. Mismatch throws `Error('v0_feepayer_mismatch')` BEFORE
 * any signing happens.
 */
export async function signAndSubmitActionTransaction(
  input: SignSubmitInput,
): Promise<SignSubmitResult> {
  const bytes = Uint8Array.from(
    Buffer.from(input.serializedTransactionBase64, 'base64'),
  );

  // Try versioned (V0) first, fall back to legacy.
  let versioned: VersionedTransaction | null = null;
  let legacy: Transaction | null = null;
  try {
    versioned = VersionedTransaction.deserialize(bytes);
  } catch {
    legacy = Transaction.from(bytes);
  }

  if (versioned) {
    // V0 fee-payer guard — applies to BOTH unsigned and partial-signed paths.
    // The publisher encodes the fee payer at staticAccountKeys[0]; if that
    // slot doesn't match the active wallet, refuse to sign.
    const feePayerKey = versioned.message.staticAccountKeys[0];
    if (!feePayerKey || !feePayerKey.equals(input.account.publicKey)) {
      throw new Error('v0_feepayer_mismatch');
    }

    if (!input.partialSigned) {
      // Unsigned versioned tx — refresh blockhash on the message before
      // signing. We can't change feePayer of a versioned message after the
      // fact (it's encoded into staticAccountKeys[0]); the publisher is
      // expected to set it. This matches the spec: publisher always sets
      // feePayer when returning a transaction.
      const fresh = await input.connection.getLatestBlockhash('finalized');
      versioned.message.recentBlockhash = fresh.blockhash;
      versioned.sign([input.account.keyPair as never]);
      const signature = await input.connection.sendRawTransaction(
        versioned.serialize(),
      );
      await input.connection.confirmTransaction(
        {
          signature,
          blockhash: fresh.blockhash,
          lastValidBlockHeight: fresh.lastValidBlockHeight,
        },
        'confirmed',
      );
      return {
        signature,
        blockhash: fresh.blockhash,
        lastValidBlockHeight: fresh.lastValidBlockHeight,
      };
    }
    // Partial-signed versioned tx — sign AS-IS, do NOT touch blockhash.
    versioned.sign([input.account.keyPair as never]);
    const signature = await input.connection.sendRawTransaction(
      versioned.serialize(),
    );
    return { signature };
  }

  // Legacy path
  const tx = legacy as Transaction;
  if (!input.partialSigned) {
    tx.feePayer = input.account.publicKey;
    const fresh = await input.connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = fresh.blockhash;
    tx.partialSign(input.account.keyPair as never);
    const signature = await input.connection.sendRawTransaction(tx.serialize());
    await input.connection.confirmTransaction(
      {
        signature,
        blockhash: fresh.blockhash,
        lastValidBlockHeight: fresh.lastValidBlockHeight,
      },
      'confirmed',
    );
    return {
      signature,
      blockhash: fresh.blockhash,
      lastValidBlockHeight: fresh.lastValidBlockHeight,
    };
  }
  // Partial-signed legacy — sign AS-IS, do NOT touch feePayer / blockhash.
  tx.partialSign(input.account.keyPair as never);
  const signature = await input.connection.sendRawTransaction(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  );
  return { signature };
}
