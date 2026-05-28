import { Transaction, VersionedTransaction } from '@solana/web3.js';
import type { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

export interface SerializedSolanaSignSubmitInput {
  serializedTransactionBase64: string;
  account: { publicKey: PublicKey; keyPair: { publicKey: PublicKey; secretKey: Uint8Array } };
  connection: Connection;
  partialSigned: boolean;
}

export interface SerializedSolanaSignSubmitResult {
  signature: string;
  blockhash?: string;
  lastValidBlockHeight?: number;
}

export function inspectSerializedSolanaTransactionSigStatus(
  serializedTransactionBase64: string,
): { partialSigned: boolean; isVersioned: boolean } {
  const bytes = Uint8Array.from(Buffer.from(serializedTransactionBase64, 'base64'));
  try {
    const tx = VersionedTransaction.deserialize(bytes);
    const partialSigned = tx.signatures.some(
      (signature) => signature.length > 0 && signature.some((byte) => byte !== 0),
    );
    return { partialSigned, isVersioned: true };
  } catch {
    const tx = Transaction.from(bytes);
    const partialSigned = tx.signatures.some(
      ({ signature }) => !!signature && signature.length > 0 && signature.some((byte) => byte !== 0),
    );
    return { partialSigned, isVersioned: false };
  }
}

export async function signAndSubmitSerializedSolanaTransaction({
  serializedTransactionBase64,
  account,
  connection,
  partialSigned,
}: SerializedSolanaSignSubmitInput): Promise<SerializedSolanaSignSubmitResult> {
  const bytes = Uint8Array.from(Buffer.from(serializedTransactionBase64, 'base64'));

  let versioned: VersionedTransaction | null = null;
  let legacy: Transaction | null = null;
  try {
    versioned = VersionedTransaction.deserialize(bytes);
  } catch {
    legacy = Transaction.from(bytes);
  }

  if (versioned) {
    const feePayerKey = versioned.message.staticAccountKeys[0];
    if (!feePayerKey || !feePayerKey.equals(account.publicKey)) {
      throw new Error('v0_feepayer_mismatch');
    }

    if (!partialSigned) {
      const fresh = await connection.getLatestBlockhash('finalized');
      versioned.message.recentBlockhash = fresh.blockhash;
      versioned.sign([account.keyPair as never]);
      const signature = await connection.sendRawTransaction(versioned.serialize());
      await connection.confirmTransaction(
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

    versioned.sign([account.keyPair as never]);
    const signature = await connection.sendRawTransaction(versioned.serialize());
    return { signature };
  }

  const tx = legacy as Transaction;
  if (!partialSigned) {
    tx.feePayer = account.publicKey;
    const fresh = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = fresh.blockhash;
    tx.partialSign(account.keyPair as never);
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(
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

  tx.partialSign(account.keyPair as never);
  const signature = await connection.sendRawTransaction(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  );
  return { signature };
}
