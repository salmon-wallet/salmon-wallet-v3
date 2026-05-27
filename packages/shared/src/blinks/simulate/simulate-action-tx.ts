/**
 * Pre-sign defense for Solana Actions / Blinks transactions.
 *
 * Every transaction returned by an Action endpoint MUST be simulated before
 * the user is asked to approve it. The result surfaces what changes for the
 * signer (SOL delta, SPL token deltas) so the wallet UI can show meaningful
 * "you will receive / you will pay" hints and refuse obviously bad txs.
 *
 * Behavior:
 *   1. Decode versioned (V0) first, fall back to legacy.
 *   2. Validate `account` parses as PublicKey.
 *   3. If transaction is partial-signed, verify each non-zero existing
 *      signature against its signer's pubkey and the message bytes using
 *      tweetnacl. Any invalid sig → `invalid_partial_signature`.
 *   4. Simulate with `replaceRecentBlockhash: true`, `sigVerify: false`,
 *      `commitment: 'processed'`, requesting post-state for signer + every
 *      SPL token account referenced in the message.
 *   5. Pre-state is fetched in parallel via `getMultipleAccountsInfo`.
 *   6. Diff lamports for SOL; parse SPL Token account data (165 bytes,
 *      mint at offset 0, owner at 32, amount at 64 as u64 LE) for token
 *      amounts. Decimals come from `getMultipleAccountsInfo` on the mint;
 *      when unavailable the delta is emitted with `decimals: null` and
 *      `uiAmountBefore/After: null` (raw delta still reported).
 *   7. On `value.err !== null` → `simulation_failed` with logs preserved.
 *   8. Pre-fetch failures degrade `tokenDeltas` to [] without throwing —
 *      signer SOL delta is best-effort and may also degrade to zeros.
 *   9. Versioned (V0) txs: ALT entries in `addressTableLookups` are resolved
 *      via `connection.getAddressLookupTable`. Failure to resolve any ALT
 *      throws `simulation_failed`/`address_lookup_tables_unresolved` so the
 *      UI can block (silent degradation would cause false-negative token
 *      delta detection on Jupiter-style routes).
 */
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface SimulationInput {
  serializedTransactionBase64: string;
  account: string;
  connection: Connection;
}

export interface BalanceDelta {
  lamportsBefore: bigint;
  lamportsAfter: bigint;
  lamportsDelta: bigint;
}

export interface TokenDelta {
  mint: string;
  owner: string;
  uiAmountBefore: string | null;
  uiAmountAfter: string | null;
  rawAmountDelta: bigint;
  decimals: number | null;
}

export interface SimulationResult {
  signerBalanceDelta: BalanceDelta;
  tokenDeltas: TokenDelta[];
  computeUnitsConsumed: number | null;
  logs: string[];
  warning?: string;
}

export type ActionSimulationErrorCode =
  | 'invalid_transaction'
  | 'invalid_account'
  | 'simulation_failed'
  | 'invalid_partial_signature';

export class ActionSimulationError extends Error {
  readonly code: ActionSimulationErrorCode;
  readonly logs?: string[];
  readonly cause?: unknown;

  constructor(args: {
    code: ActionSimulationErrorCode;
    message?: string;
    logs?: string[];
    cause?: unknown;
  }) {
    super(args.message ?? args.code);
    this.name = 'ActionSimulationError';
    this.code = args.code;
    this.logs = args.logs;
    this.cause = args.cause;
  }
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const SPL_TOKEN_ACCOUNT_LEN = 165;

type DecodedTx =
  | { kind: 'versioned'; tx: VersionedTransaction }
  | { kind: 'legacy'; tx: Transaction };

function base64ToBytes(b64: string): Uint8Array {
  // Buffer is already a polyfill in shared via `buffer` dep + RN/web setup.
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

function decodeTx(b64: string): DecodedTx {
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(b64);
    if (bytes.length === 0) throw new Error('empty bytes');
  } catch (e) {
    throw new ActionSimulationError({ code: 'invalid_transaction', cause: e });
  }
  try {
    return { kind: 'versioned', tx: VersionedTransaction.deserialize(bytes) };
  } catch (vErr) {
    try {
      return { kind: 'legacy', tx: Transaction.from(bytes) };
    } catch (lErr) {
      throw new ActionSimulationError({
        code: 'invalid_transaction',
        cause: { versioned: vErr, legacy: lErr },
      });
    }
  }
}

function parsePubkey(raw: string): PublicKey {
  try {
    return new PublicKey(raw);
  } catch (e) {
    throw new ActionSimulationError({ code: 'invalid_account', cause: e });
  }
}

function isNonZeroSig(sig: Uint8Array | null | undefined): sig is Uint8Array {
  if (!sig || sig.length === 0) return false;
  for (let i = 0; i < sig.length; i++) if (sig[i] !== 0) return true;
  return false;
}

/**
 * Verifies pre-existing signatures on a partial-signed tx. Returns true if a
 * partial signature was present (so caller can set the warning).
 *
 * Throws `invalid_partial_signature` if any non-zero signature fails to verify.
 */
function verifyPartialSignatures(decoded: DecodedTx): boolean {
  if (decoded.kind === 'versioned') {
    const tx = decoded.tx;
    const message = tx.message;
    const messageBytes = message.serialize();
    const numRequiredSigs = message.header.numRequiredSignatures;
    let sawPartial = false;
    for (let i = 0; i < numRequiredSigs; i++) {
      const sig = tx.signatures[i];
      if (!isNonZeroSig(sig)) continue;
      sawPartial = true;
      const signer = message.staticAccountKeys[i];
      if (!signer) {
        throw new ActionSimulationError({ code: 'invalid_partial_signature' });
      }
      const ok = nacl.sign.detached.verify(messageBytes, sig, signer.toBytes());
      if (!ok) {
        throw new ActionSimulationError({ code: 'invalid_partial_signature' });
      }
    }
    return sawPartial;
  }
  const tx = decoded.tx;
  // Use `serializeMessage()` — it returns the already-compiled message bytes
  // that signers actually signed (post `Transaction.from(...)`). It does NOT
  // recompile/reorder, so we verify against the exact signed payload.
  let messageBytes: Uint8Array;
  try {
    messageBytes = tx.serializeMessage();
  } catch (e) {
    throw new ActionSimulationError({ code: 'invalid_partial_signature', cause: e });
  }
  let sawPartial = false;
  for (const { publicKey, signature } of tx.signatures) {
    if (!isNonZeroSig(signature ?? undefined)) continue;
    sawPartial = true;
    const ok = nacl.sign.detached.verify(messageBytes, signature!, publicKey.toBytes());
    if (!ok) {
      throw new ActionSimulationError({ code: 'invalid_partial_signature' });
    }
  }
  return sawPartial;
}

/**
 * Returns every account key referenced by the message in the order Solana's
 * runtime resolves them: static keys first, then ALT writable indexes, then
 * ALT readonly indexes. For legacy transactions there are no lookup tables.
 *
 * If any ALT cannot be resolved (RPC error, missing account, missing state),
 * throws `simulation_failed` with message `address_lookup_tables_unresolved`
 * — the UI must block on this rather than silently degrade to false-negatives
 * in token-delta detection.
 */
async function resolveAccountKeys(
  decoded: DecodedTx,
  connection: Connection,
): Promise<PublicKey[]> {
  if (decoded.kind === 'legacy') {
    return decoded.tx.compileMessage().accountKeys;
  }
  const message = decoded.tx.message;
  const staticKeys = [...message.staticAccountKeys];
  const lookups = message.addressTableLookups ?? [];
  if (lookups.length === 0) return staticKeys;

  let fetched: Array<{
    state: { addresses: PublicKey[] } | null;
  } | null>;
  try {
    fetched = await Promise.all(
      lookups.map(async (l) => {
        const resp = await connection.getAddressLookupTable(l.accountKey);
        const value = (resp as any)?.value ?? null;
        if (!value) return null;
        // `value.state` may be `state` directly (AddressLookupTableAccount).
        const state = (value as any).state ?? null;
        return state ? { state } : null;
      }),
    );
  } catch (e) {
    throw new ActionSimulationError({
      code: 'simulation_failed',
      message: 'address_lookup_tables_unresolved',
      cause: e,
    });
  }

  const writable: PublicKey[] = [];
  const readonly: PublicKey[] = [];
  for (let i = 0; i < lookups.length; i++) {
    const lookup = lookups[i]!;
    const entry = fetched[i];
    if (!entry || !entry.state) {
      throw new ActionSimulationError({
        code: 'simulation_failed',
        message: 'address_lookup_tables_unresolved',
      });
    }
    const addresses = entry.state.addresses;
    for (const idx of lookup.writableIndexes) {
      const addr = addresses[idx];
      if (!addr) {
        throw new ActionSimulationError({
          code: 'simulation_failed',
          message: 'address_lookup_tables_unresolved',
        });
      }
      writable.push(addr);
    }
    for (const idx of lookup.readonlyIndexes) {
      const addr = addresses[idx];
      if (!addr) {
        throw new ActionSimulationError({
          code: 'simulation_failed',
          message: 'address_lookup_tables_unresolved',
        });
      }
      readonly.push(addr);
    }
  }
  return [...staticKeys, ...writable, ...readonly];
}

function isTokenProgram(pk: PublicKey): boolean {
  return pk.equals(TOKEN_PROGRAM_ID) || pk.equals(TOKEN_2022_PROGRAM_ID);
}

function readU64LE(buf: Uint8Array, offset: number): bigint {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(buf[offset + i]!);
  return v;
}

interface ParsedTokenAccount {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
}

function parseTokenAccount(data: Uint8Array | undefined): ParsedTokenAccount | null {
  if (!data || data.length < SPL_TOKEN_ACCOUNT_LEN) return null;
  try {
    const mint = new PublicKey(data.subarray(0, 32));
    const owner = new PublicKey(data.subarray(32, 64));
    const amount = readU64LE(data, 64);
    return { mint, owner, amount };
  } catch {
    return null;
  }
}

function decodeAccountData(
  data: unknown,
): Uint8Array | undefined {
  if (!data) return undefined;
  if (data instanceof Uint8Array) return data;
  if (Array.isArray(data) && typeof data[0] === 'string') {
    const [payload, encoding] = data as [string, string];
    if (encoding === 'base64') return base64ToBytes(payload);
    if (encoding === 'base58') return undefined; // not needed in practice
  }
  return undefined;
}

function uiAmount(raw: bigint, decimals: number): string {
  if (decimals === 0) return raw.toString();
  const neg = raw < 0n;
  const abs = neg ? -raw : raw;
  const s = abs.toString().padStart(decimals + 1, '0');
  const intPart = s.slice(0, -decimals);
  const fracPart = s.slice(-decimals).replace(/0+$/, '');
  const out = fracPart ? `${intPart}.${fracPart}` : intPart;
  return neg ? `-${out}` : out;
}

interface PreState {
  lamports: Map<string, bigint>;
  tokens: Map<string, ParsedTokenAccount>;
}

async function fetchPreState(
  connection: Connection,
  candidates: PublicKey[],
): Promise<PreState> {
  const lamports = new Map<string, bigint>();
  const tokens = new Map<string, ParsedTokenAccount>();
  if (candidates.length === 0) return { lamports, tokens };
  let infos: Array<{ lamports: number; data: Buffer | Uint8Array; owner: PublicKey } | null>;
  try {
    infos = (await connection.getMultipleAccountsInfo(candidates)) as any;
  } catch {
    return { lamports, tokens };
  }
  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i]!.toBase58();
    const info = infos[i];
    if (!info) {
      lamports.set(key, 0n);
      continue;
    }
    lamports.set(key, BigInt(info.lamports));
    if (isTokenProgram(info.owner)) {
      const parsed = parseTokenAccount(info.data as Uint8Array);
      if (parsed) tokens.set(key, parsed);
    }
  }
  return { lamports, tokens };
}

async function fetchMintDecimals(
  connection: Connection,
  mints: PublicKey[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (mints.length === 0) return out;
  try {
    const infos = (await connection.getMultipleAccountsInfo(mints)) as any[];
    for (let i = 0; i < mints.length; i++) {
      const info = infos[i];
      if (!info) continue;
      const data = info.data as Uint8Array;
      // Mint layout: decimals at offset 44 (1 byte).
      if (data && data.length >= 45) out.set(mints[i]!.toBase58(), data[44]!);
    }
  } catch {
    /* best-effort */
  }
  return out;
}

export async function simulateActionTx(input: SimulationInput): Promise<SimulationResult> {
  const decoded = decodeTx(input.serializedTransactionBase64);
  const signer = parsePubkey(input.account);
  const sawPartial = verifyPartialSignatures(decoded);

  const accountKeys = await resolveAccountKeys(decoded, input.connection);
  const preState = await fetchPreState(input.connection, accountKeys);

  // Run simulation, requesting post-state for every static key.
  let simResp: any;
  try {
    if (decoded.kind === 'versioned') {
      simResp = await input.connection.simulateTransaction(decoded.tx, {
        replaceRecentBlockhash: true,
        sigVerify: false,
        commitment: 'processed' as any,
        accounts: {
          encoding: 'base64',
          addresses: accountKeys.map((k) => k.toBase58()),
        },
      } as any);
    } else {
      // Legacy `simulateTransaction` overload: (tx, signers?, includeAccounts?)
      simResp = await (input.connection as any).simulateTransaction(
        decoded.tx,
        undefined,
        accountKeys.map((k) => k.toBase58()),
      );
    }
  } catch (e) {
    throw new ActionSimulationError({ code: 'simulation_failed', cause: e });
  }

  const value = simResp?.value ?? {};
  const logs: string[] = Array.isArray(value.logs) ? value.logs : [];
  const computeUnitsConsumed: number | null =
    typeof value.unitsConsumed === 'number' ? value.unitsConsumed : null;

  if (value.err != null) {
    throw new ActionSimulationError({
      code: 'simulation_failed',
      logs,
      cause: value.err,
    });
  }

  // Map post-state from sim response onto the candidate addresses.
  const postLamports = new Map<string, bigint>();
  const postTokens = new Map<string, ParsedTokenAccount>();
  const postAccounts: any[] = Array.isArray(value.accounts) ? value.accounts : [];
  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys[i]!.toBase58();
    const acc = postAccounts[i];
    if (!acc) continue;
    if (typeof acc.lamports === 'number') postLamports.set(key, BigInt(acc.lamports));
    const data = decodeAccountData(acc.data);
    const ownerStr: string | undefined = acc.owner;
    if (
      data &&
      ownerStr &&
      (ownerStr === TOKEN_PROGRAM_ID.toBase58() || ownerStr === TOKEN_2022_PROGRAM_ID.toBase58())
    ) {
      const parsed = parseTokenAccount(data);
      if (parsed) postTokens.set(key, parsed);
    }
  }

  // Signer SOL delta — best-effort.
  const signerKey = signer.toBase58();
  const before = preState.lamports.get(signerKey) ?? 0n;
  const after = postLamports.get(signerKey) ?? before;
  const signerBalanceDelta: BalanceDelta = {
    lamportsBefore: before,
    lamportsAfter: after,
    lamportsDelta: after - before,
  };

  // Token deltas — union of pre and post token-account keys.
  const tokenKeys = new Set<string>([...preState.tokens.keys(), ...postTokens.keys()]);
  const dirtyMints = new Set<string>();
  const drafts: Array<{
    key: string;
    mint: PublicKey;
    owner: PublicKey;
    amountBefore: bigint;
    amountAfter: bigint;
  }> = [];
  for (const k of tokenKeys) {
    const pre = preState.tokens.get(k);
    const post = postTokens.get(k);
    const ref = post ?? pre;
    if (!ref) continue;
    const amountBefore = pre?.amount ?? 0n;
    const amountAfter = post?.amount ?? amountBefore;
    if (amountBefore === amountAfter) continue;
    drafts.push({
      key: k,
      mint: ref.mint,
      owner: ref.owner,
      amountBefore,
      amountAfter,
    });
    dirtyMints.add(ref.mint.toBase58());
  }

  let decimalsByMint = new Map<string, number>();
  if (drafts.length > 0) {
    decimalsByMint = await fetchMintDecimals(
      input.connection,
      Array.from(dirtyMints).map((m) => new PublicKey(m)),
    );
  }

  const tokenDeltas: TokenDelta[] = drafts.map((d) => {
    const decimalsResolved = decimalsByMint.get(d.mint.toBase58());
    const hasDecimals = typeof decimalsResolved === 'number';
    return {
      mint: d.mint.toBase58(),
      owner: d.owner.toBase58(),
      uiAmountBefore: hasDecimals ? uiAmount(d.amountBefore, decimalsResolved!) : null,
      uiAmountAfter: hasDecimals ? uiAmount(d.amountAfter, decimalsResolved!) : null,
      rawAmountDelta: d.amountAfter - d.amountBefore,
      decimals: hasDecimals ? decimalsResolved! : null,
    };
  });

  const result: SimulationResult = {
    signerBalanceDelta,
    tokenDeltas,
    computeUnitsConsumed,
    logs,
  };
  if (sawPartial) {
    result.warning = 'transaction was partial-signed; existing signatures verified';
  }
  return result;
}
