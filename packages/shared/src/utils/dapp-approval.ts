import { Buffer } from 'buffer';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import {
  Message,
  PublicKey,
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { fetchAndMergeNetworkConfigs } from '../hooks/useAvailableNetworks';
import type { SolanaAccount } from '../blockchain/solana';
import type {
  DAppSignAllTransactionsApprovalPayload,
  DAppSignMessageApprovalPayload,
  DAppSignTransactionApprovalPayload,
  DAppSignAndSendTransactionApprovalPayload,
  DAppTransactionRequest,
} from '../types/dapp-approval';

export interface DecodedDAppMessage {
  text: string;
  isHex: boolean;
}

export type ParsedSolanaTransaction =
  | { type: 'legacy'; message: Message; tx: Transaction }
  | { type: 'versioned'; message: VersionedMessage; tx: VersionedTransaction };

export interface SolanaTransactionApprovalDetails {
  feeLamports: number | null;
  instructionCount: number | null;
  feePayer: string | null;
  recentBlockhash: string | null;
}

function getVersionedSignerIndex(
  message: VersionedMessage,
  publicKey: PublicKey,
): number {
  const signerIndex = message.staticAccountKeys
    .slice(0, message.header.numRequiredSignatures)
    .findIndex((accountKey) => accountKey.equals(publicKey));

  if (signerIndex === -1) {
    throw new Error('Signer public key not found in transaction message');
  }

  return signerIndex;
}

function toHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function isSecureOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function decodeDAppMessage(data: number[]): DecodedDAppMessage {
  const bytes = Uint8Array.from(data);
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(decoded)) {
      return { text: toHex(bytes), isHex: true };
    }
    return { text: decoded, isHex: false };
  } catch {
    return { text: toHex(bytes), isHex: true };
  }
}

export function buildTransactionFromEncodedMessage(encodedMessage: string): ParsedSolanaTransaction {
  const bytes = bs58.decode(encodedMessage);

  try {
    const versionedMessage = VersionedMessage.deserialize(bytes);
    return {
      type: 'versioned',
      message: versionedMessage,
      tx: new VersionedTransaction(versionedMessage),
    };
  } catch {
    const message = Message.from(bytes);
    return {
      type: 'legacy',
      message,
      tx: Transaction.populate(message),
    };
  }
}

export function getDAppTransactionRequestSummary(
  method: DAppTransactionRequest['method'],
): DAppTransactionRequest['method'] {
  return method;
}

export async function loadSolanaTransactionApprovalDetails(
  account: SolanaAccount,
  request: DAppTransactionRequest,
): Promise<SolanaTransactionApprovalDetails> {
  await fetchAndMergeNetworkConfigs();

  const encodedMessage = request.method === 'signAllTransactions'
    ? request.params?.messages?.[0] ?? ''
    : request.params?.message ?? '';

  if (!encodedMessage) {
    throw new Error(
      request.method === 'signAllTransactions' ? 'Missing messages' : 'Missing message',
    );
  }

  const parsed = buildTransactionFromEncodedMessage(encodedMessage);
  const connection = await account.getConnection();

  if (parsed.type === 'legacy') {
    const fee = await connection.getFeeForMessage(parsed.message);
    return {
      feeLamports: fee.value ?? null,
      instructionCount: parsed.message.instructions.length,
      feePayer: parsed.message.accountKeys?.[0]?.toBase58?.() ?? null,
      recentBlockhash: parsed.message.recentBlockhash ?? null,
    };
  }

  const fee = await connection.getFeeForMessage(parsed.message);
  const staticAccountKeys = parsed.message.staticAccountKeys;
  const blockhash = parsed.message.recentBlockhash;

  return {
    feeLamports: fee.value ?? null,
    instructionCount: parsed.message.compiledInstructions.length,
    feePayer: staticAccountKeys?.[0]?.toBase58?.() ?? null,
    recentBlockhash: blockhash ?? null,
  };
}

export function approveSolanaSignMessage(
  account: SolanaAccount,
  data: number[],
): DAppSignMessageApprovalPayload {
  const messageBytes = Uint8Array.from(data);
  const signature = nacl.sign.detached(messageBytes, account.keyPair.secretKey);

  return {
    signature: bs58.encode(signature),
    publicKey: account.getReceiveAddress(),
  };
}

export async function approveSolanaTransactionRequest(
  account: SolanaAccount,
  request: DAppTransactionRequest,
): Promise<
  | DAppSignTransactionApprovalPayload
  | DAppSignAllTransactionsApprovalPayload
  | DAppSignAndSendTransactionApprovalPayload
> {
  const publicKey = account.getReceiveAddress();

  if (request.method === 'signTransaction') {
    const encodedMessage = request.params?.message ?? '';
    if (!encodedMessage) throw new Error('Missing message');
    const parsed = buildTransactionFromEncodedMessage(encodedMessage);

    if (parsed.type === 'legacy') {
      parsed.tx.partialSign(account.keyPair);
      if (!parsed.tx.signature) throw new Error('Failed to sign transaction');
      return {
        signature: bs58.encode(parsed.tx.signature),
        publicKey,
      };
    }

    parsed.tx.sign([account.keyPair]);
    const signerIndex = getVersionedSignerIndex(parsed.message, account.keyPair.publicKey);
    const signature = parsed.tx.signatures[signerIndex];
    if (!signature) throw new Error('Failed to sign transaction');
    return {
      signature: bs58.encode(signature),
      publicKey,
    };
  }

  if (request.method === 'signAllTransactions') {
    const encodedMessages = request.params?.messages ?? [];
    if (!encodedMessages.length) throw new Error('Missing messages');

    const signatures = encodedMessages.map((encodedMessage) => {
      const parsed = buildTransactionFromEncodedMessage(encodedMessage);

      if (parsed.type === 'legacy') {
        parsed.tx.partialSign(account.keyPair);
        if (!parsed.tx.signature) throw new Error('Failed to sign one of the transactions');
        return bs58.encode(parsed.tx.signature);
      }

      parsed.tx.sign([account.keyPair]);
      const signerIndex = getVersionedSignerIndex(parsed.message, account.keyPair.publicKey);
      const signature = parsed.tx.signatures[signerIndex];
      if (!signature) {
        throw new Error('Failed to sign one of the transactions');
      }
      return bs58.encode(signature);
    });

    return {
      signatures,
      publicKey,
    };
  }

  const encodedMessage = request.params?.message ?? '';
  if (!encodedMessage) throw new Error('Missing message');

  const parsed = buildTransactionFromEncodedMessage(encodedMessage);
  await fetchAndMergeNetworkConfigs();
  const connection = await account.getConnection();
  const options = request.params?.options as Record<string, unknown> | undefined;

  if (parsed.type === 'legacy') {
    parsed.tx.partialSign(account.keyPair);
    const signature = await connection.sendRawTransaction(
      parsed.tx.serialize(),
      options as never,
    );
    return { signature };
  }

  parsed.tx.sign([account.keyPair]);
  const signature = await connection.sendTransaction(parsed.tx, options as never);
  return { signature };
}

export function serializeSignedTransactionFromApproval(
  encodedMessage: string,
  publicKey: string,
  signature: string,
): Uint8Array {
  const parsed = buildTransactionFromEncodedMessage(encodedMessage);
  const signerPublicKey = new PublicKey(publicKey);
  const signatureBytes = bs58.decode(signature);

  if (parsed.type === 'legacy') {
    parsed.tx.addSignature(signerPublicKey, Buffer.from(signatureBytes));
    return parsed.tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
  }

  const signerIndex = getVersionedSignerIndex(parsed.message, signerPublicKey);
  parsed.tx.signatures[signerIndex] = signatureBytes;
  return parsed.tx.serialize();
}

export function serializeSignedTransactionsFromApproval(
  encodedMessages: string[],
  publicKey: string,
  signatures: string[],
): Uint8Array[] {
  if (encodedMessages.length !== signatures.length) {
    throw new Error('Mismatched messages and signatures');
  }

  return encodedMessages.map((encodedMessage, index) =>
    serializeSignedTransactionFromApproval(encodedMessage, publicKey, signatures[index]),
  );
}
