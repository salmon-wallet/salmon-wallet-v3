import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import type { Commitment } from '@solana/web3.js';
import type {
  PreparedNftTransaction,
  PreparedNftTransactionResponse,
} from '../../types/nft';
import type { SolanaAccount } from './SolanaAccount';

export interface SignAndSendPreparedSolanaTransactionsOptions {
  commitment?: Commitment;
}

const LOOKUP_TABLE_POLL_INTERVAL_MS = 400;
const LOOKUP_TABLE_TIMEOUT_MS = 20_000;
const SIGNATURE_CONFIRMATION_TIMEOUT_MS = 30_000;

interface LookupTableReadiness {
  ready: boolean;
  waitingForWarmup: boolean;
  lastExtendedSlot: number | null;
}

async function getLookupTableReadiness(
  connection: Awaited<ReturnType<SolanaAccount['getConnection']>>,
  tablePublicKey: PublicKey,
  expectedAddressCount: number | undefined,
  commitment: Commitment,
  currentSlotOverride?: number
): Promise<LookupTableReadiness> {
  const response = await connection.getAddressLookupTable(tablePublicKey, {
    commitment,
  });
  const lookupTable = response.value;

  if (!lookupTable) {
    return {
      ready: false,
      waitingForWarmup: false,
      lastExtendedSlot: null,
    };
  }

  const currentAddressCount = lookupTable.state.addresses.length;
  if (expectedAddressCount !== undefined && currentAddressCount < expectedAddressCount) {
    return {
      ready: false,
      waitingForWarmup: false,
      lastExtendedSlot: Number(lookupTable.state.lastExtendedSlot),
    };
  }

  if (expectedAddressCount === undefined || expectedAddressCount === 0) {
    return {
      ready: true,
      waitingForWarmup: false,
      lastExtendedSlot: Number(lookupTable.state.lastExtendedSlot),
    };
  }

  const currentSlot = currentSlotOverride ?? await connection.getSlot(commitment);
  const lastExtendedSlot = Number(lookupTable.state.lastExtendedSlot);
  const waitingForWarmup = currentSlot <= lastExtendedSlot;

  return {
    ready: !waitingForWarmup,
    waitingForWarmup,
    lastExtendedSlot,
  };
}

async function waitForLookupTableStateByPolling(
  connection: Awaited<ReturnType<SolanaAccount['getConnection']>>,
  tablePublicKey: PublicKey,
  expectedAddressCount: number | undefined,
  commitment: Commitment
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOOKUP_TABLE_TIMEOUT_MS) {
    const readiness = await getLookupTableReadiness(
      connection,
      tablePublicKey,
      expectedAddressCount,
      commitment
    );

    if (readiness.ready) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, LOOKUP_TABLE_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Lookup table ${tablePublicKey.toBase58()} was not ready with ${expectedAddressCount ?? 0} addresses in time`
  );
}

async function waitForLookupTableStateBySubscription(
  connection: Awaited<ReturnType<SolanaAccount['getConnection']>>,
  tablePublicKey: PublicKey,
  expectedAddressCount: number | undefined,
  commitment: Commitment
): Promise<void> {
  if (
    typeof connection.onAccountChange !== 'function' ||
    typeof connection.onSlotChange !== 'function' ||
    typeof connection.removeAccountChangeListener !== 'function' ||
    typeof connection.removeSlotChangeListener !== 'function'
  ) {
    throw new Error('Lookup table subscriptions are not available on this connection');
  }

  let accountSubscriptionId: number | null = null;
  let slotSubscriptionId: number | null = null;
  let timedOut = false;
  let settled = false;
  let warmupTargetSlot: number | null = null;

  const cleanup = async () => {
    const removals: Promise<unknown>[] = [];
    if (accountSubscriptionId !== null) {
      removals.push(connection.removeAccountChangeListener(accountSubscriptionId));
    }
    if (slotSubscriptionId !== null) {
      removals.push(connection.removeSlotChangeListener(slotSubscriptionId));
    }
    await Promise.allSettled(removals);
  };

  const initialReadiness = await getLookupTableReadiness(
    connection,
    tablePublicKey,
    expectedAddressCount,
    commitment
  );
  if (initialReadiness.ready) {
    return;
  }
  warmupTargetSlot = initialReadiness.waitingForWarmup ? initialReadiness.lastExtendedSlot : null;

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      timedOut = true;
      void cleanup().finally(() => {
        reject(
          new Error(
            `Lookup table ${tablePublicKey.toBase58()} was not ready with ${expectedAddressCount ?? 0} addresses in time`
          )
        );
      });
    }, LOOKUP_TABLE_TIMEOUT_MS);

    const finish = (callback: () => void) => {
      if (settled || timedOut) return;
      settled = true;
      clearTimeout(timeoutId);
      void cleanup().finally(callback);
    };

    const refreshReadiness = async () => {
      if (settled || timedOut) return;
      try {
        const readiness = await getLookupTableReadiness(
          connection,
          tablePublicKey,
          expectedAddressCount,
          commitment
        );
        warmupTargetSlot = readiness.waitingForWarmup ? readiness.lastExtendedSlot : null;
        if (readiness.ready) {
          finish(resolve);
        }
      } catch (error) {
        finish(() => {
          reject(error instanceof Error ? error : new Error('Unknown lookup table subscription error'));
        });
      }
    };

    try {
      accountSubscriptionId = connection.onAccountChange(
        tablePublicKey,
        () => {
          void refreshReadiness();
        },
        commitment
      );
    } catch (error) {
      finish(() => {
        reject(error instanceof Error ? error : new Error('Failed to subscribe to lookup table account'));
      });
    }

    try {
      slotSubscriptionId = connection.onSlotChange((slotInfo: { slot: number }) => {
        if (settled || timedOut) return;
        if (warmupTargetSlot !== null && slotInfo.slot > warmupTargetSlot) {
          finish(resolve);
        }
      });
    } catch (error) {
      finish(() => {
        reject(error instanceof Error ? error : new Error('Failed to subscribe to slot updates'));
      });
    }
  });
}

async function waitForLookupTableState(
  account: SolanaAccount,
  lookupTableAddress: string,
  expectedAddressCount: number | undefined,
  commitment: Commitment
): Promise<void> {
  const connection = await account.getConnection();
  const tablePublicKey = new PublicKey(lookupTableAddress);
  try {
    await waitForLookupTableStateBySubscription(
      connection,
      tablePublicKey,
      expectedAddressCount,
      commitment
    );
    return;
  } catch {
    await waitForLookupTableStateByPolling(
      connection,
      tablePublicKey,
      expectedAddressCount,
      commitment
    );
    return;
  }
}

async function confirmSignatureBySubscription(
  connection: Awaited<ReturnType<SolanaAccount['getConnection']>>,
  signature: string,
  commitment: Commitment
): Promise<void> {
  if (
    typeof connection.onSignature !== 'function' ||
    typeof connection.removeSignatureListener !== 'function'
  ) {
    throw new Error('Signature subscriptions are not available on this connection');
  }

  let settled = false;
  let timedOut = false;
  let subscriptionId: number | null = null;

  const cleanup = async () => {
    if (subscriptionId !== null) {
      await connection.removeSignatureListener(subscriptionId);
    }
  };

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      timedOut = true;
      void cleanup().finally(() => {
        reject(new Error(`Timed out waiting for signature ${signature} confirmation`));
      });
    }, SIGNATURE_CONFIRMATION_TIMEOUT_MS);

    const finish = (callback: () => void) => {
      if (settled || timedOut) return;
      settled = true;
      clearTimeout(timeoutId);
      void cleanup().finally(callback);
    };

    try {
      subscriptionId = connection.onSignature(
        signature,
        (result: { err: unknown }) => {
          if (result.err) {
            finish(() => {
              reject(new Error(`Signature ${signature} failed: ${JSON.stringify(result.err)}`));
            });
            return;
          }

          finish(resolve);
        },
        commitment
      );
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error instanceof Error ? error : new Error('Failed to subscribe to signature confirmation'));
    }
  });
}

export function getPreparedSolanaTransactions(
  response: PreparedNftTransactionResponse
): PreparedNftTransaction[] {
  if (response.transactions && response.transactions.length > 0) {
    return response.transactions;
  }

  if (response.transaction) {
    return [{ transaction: response.transaction, step: 'transaction' }];
  }

  return [];
}

export async function signAndSendPreparedSolanaTransactions(
  account: SolanaAccount,
  response: PreparedNftTransactionResponse,
  options: SignAndSendPreparedSolanaTransactionsOptions = {}
): Promise<string[]> {
  const preparedTransactions = getPreparedSolanaTransactions(response);

  if (preparedTransactions.length === 0) {
    throw new Error('Transaction flow was not returned by the API');
  }

  const connection = await account.getConnection();
  const commitment = options.commitment ?? 'confirmed';
  const signatures: string[] = [];

  for (const preparedTransaction of preparedTransactions) {
    try {
      const txBuffer = Buffer.from(preparedTransaction.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment);
      transaction.message.recentBlockhash = blockhash;
      transaction.sign([account.keyPair]);
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        preflightCommitment: commitment,
      });
      signatures.push(signature);
      try {
        await confirmSignatureBySubscription(connection, signature, commitment);
      } catch {
        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          commitment
        );
      }

      if (
        preparedTransaction.lookupTableAddress &&
        (preparedTransaction.step === 'lookup_table_create' ||
          preparedTransaction.step === 'lookup_table_extend')
      ) {
        await waitForLookupTableState(
          account,
          preparedTransaction.lookupTableAddress,
          preparedTransaction.expectedLookupTableAddressCount,
          commitment
        );
      }
    } catch (error) {
      const step = preparedTransaction.step ?? 'transaction';
      const message = error instanceof Error ? error.message : 'Unknown Solana transaction error';
      throw new Error(`Failed during ${step}: ${message}`);
    }
  }

  return signatures;
}
