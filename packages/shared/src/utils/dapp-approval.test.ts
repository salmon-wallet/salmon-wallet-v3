import bs58 from 'bs58';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  approveSolanaTransactionRequest,
  loadSolanaTransactionApprovalDetails,
  serializeSignedTransactionFromApproval,
} from './dapp-approval';

vi.mock('../hooks/useAvailableNetworks', () => ({
  fetchAndMergeNetworkConfigs: vi.fn().mockResolvedValue(true),
}));

describe('dapp approval utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the signature for the matching versioned signer instead of slot 0', async () => {
    const payer = Keypair.generate();
    const salmon = Keypair.generate();
    const recipient = Keypair.generate();
    const recentBlockhash = Keypair.generate().publicKey.toBase58();

    const instruction = SystemProgram.transfer({
      fromPubkey: salmon.publicKey,
      toPubkey: recipient.publicKey,
      lamports: 1,
    });

    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    const encodedMessage = bs58.encode(tx.message.serialize());

    const account = {
      keyPair: salmon,
      getReceiveAddress: () => salmon.publicKey.toBase58(),
    };

    const result = await approveSolanaTransactionRequest(account as never, {
      id: 'req-1',
      method: 'signTransaction',
      params: { message: encodedMessage },
    });

    expect('signature' in result).toBe(true);
    if (!('signature' in result)) return;

    const expectedTx = new VersionedTransaction(message);
    expectedTx.sign([salmon]);

    expect(result.signature).toBe(bs58.encode(expectedTx.signatures[1]));
    expect(result.signature).not.toBe(bs58.encode(expectedTx.signatures[0]));
  });

  it('rebuilds versioned transactions using the signer slot that matches the public key', async () => {
    const payer = Keypair.generate();
    const salmon = Keypair.generate();
    const recipient = Keypair.generate();
    const recentBlockhash = Keypair.generate().publicKey.toBase58();

    const instruction = SystemProgram.transfer({
      fromPubkey: salmon.publicKey,
      toPubkey: recipient.publicKey,
      lamports: 1,
    });

    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([salmon]);

    const rebuilt = serializeSignedTransactionFromApproval(
      bs58.encode(tx.message.serialize()),
      salmon.publicKey.toBase58(),
      bs58.encode(tx.signatures[1]),
    );
    const rebuiltTx = VersionedTransaction.deserialize(rebuilt);

    expect(bs58.encode(rebuiltTx.signatures[1])).toBe(bs58.encode(tx.signatures[1]));
    expect(bs58.encode(rebuiltTx.signatures[0])).toBe(bs58.encode(tx.signatures[0]));
  });

  it('returns the original versioned blockhash in transaction approval details', async () => {
    const payer = Keypair.generate();
    const recentBlockhash = Keypair.generate().publicKey.toBase58();

    const instruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    });

    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    const details = await loadSolanaTransactionApprovalDetails(
      {
        getConnection: async () => ({
          getFeeForMessage: async () => ({ value: 5000 }),
        }),
      } as never,
      {
        id: 'req-2',
        method: 'signTransaction',
        params: { message: bs58.encode(tx.message.serialize()) },
      },
    );

    expect(details.recentBlockhash).toBe(recentBlockhash);
  });
});
