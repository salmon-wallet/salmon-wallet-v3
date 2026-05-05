/**
 * Action API client — single entry point through which the wallet talks to any
 * Solana Actions / Blinks endpoint.
 *
 * Wraps `fetch` and enforces every defense the wallet relies on:
 *
 * 1. HTTPS-only (rejects http/data/file/solana-action/etc.).
 * 2. Registry guard via `isHostTrusted` (refuses unpinned hosts).
 * 3. No cross-host redirects (`redirect: 'manual'`; any 3xx → reject).
 * 4. Hard 10s timeout via `AbortController`.
 * 5. Response size cap of 64 KiB (Content-Length pre-check + streaming cap).
 * 6. Schema validation via `parseActionGetResponse` / `parseActionPostResponse`.
 * 7. No credentials (`credentials: 'omit'`, no Authorization/Cookie headers).
 * 8. Sanitized POST body — only `{ account, data }`.
 *
 * All failures surface as `ActionClientError` so callers can switch on `code`.
 */
import { isHostTrusted } from '../registry/registry';
import {
  parseActionGetResponse,
  parseActionPostResponse,
  type ActionGetResponse,
  type ActionPostResponse,
} from '../spec/schemas';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 64 * 1024;

export type ActionClientErrorCode =
  | 'untrusted_host'
  | 'not_https'
  | 'timeout'
  | 'http_error'
  | 'invalid_response'
  | 'cross_host_redirect'
  | 'oversize_response';

export interface ActionClientOptions {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  now?: () => number;
}

export class ActionClientError extends Error {
  readonly code: ActionClientErrorCode;
  readonly cause?: unknown;

  constructor(args: { code: ActionClientErrorCode; message?: string; cause?: unknown }) {
    super(args.message ?? args.code);
    this.name = 'ActionClientError';
    this.code = args.code;
    this.cause = args.cause;
  }
}

function validateUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch (e) {
    throw new ActionClientError({ code: 'not_https', message: 'invalid url', cause: e });
  }
  if (parsed.protocol !== 'https:') {
    throw new ActionClientError({ code: 'not_https', message: `protocol ${parsed.protocol} not allowed` });
  }
  if (!isHostTrusted(parsed.hostname)) {
    throw new ActionClientError({ code: 'untrusted_host', message: parsed.hostname });
  }
  return parsed;
}

async function readCappedText(res: Response): Promise<string> {
  const cl = res.headers.get('content-length');
  if (cl != null && cl !== '') {
    const n = Number(cl);
    if (Number.isFinite(n) && n > MAX_RESPONSE_BYTES) {
      throw new ActionClientError({ code: 'oversize_response', message: `content-length ${n}` });
    }
  }
  const reader = res.body?.getReader?.();
  if (!reader) {
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new ActionClientError({ code: 'oversize_response' });
    }
    return text;
  }
  const decoder = new TextDecoder();
  let total = 0;
  let out = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* swallow */
        }
        throw new ActionClientError({ code: 'oversize_response' });
      }
      out += decoder.decode(value, { stream: true });
    }
  }
  out += decoder.decode();
  return out;
}

interface FetchActionArgs {
  parsed: URL;
  init: RequestInit;
  fetchImpl: typeof globalThis.fetch;
  timeoutMs: number;
}

async function fetchAndReadJson({ parsed, init, fetchImpl, timeoutMs }: FetchActionArgs): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl(parsed.toString(), { ...init, signal: controller.signal });
    } catch (e) {
      const err = e as { name?: string };
      if (err && err.name === 'AbortError') {
        throw new ActionClientError({ code: 'timeout' });
      }
      throw new ActionClientError({ code: 'invalid_response', cause: e });
    }
    if (res.status >= 300 && res.status < 400) {
      throw new ActionClientError({ code: 'cross_host_redirect', message: `status ${res.status}` });
    }
    if (!res.ok) {
      throw new ActionClientError({ code: 'http_error', message: `status ${res.status}` });
    }
    const text = await readCappedText(res);
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new ActionClientError({ code: 'invalid_response', cause: e });
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchActionMetadata(
  url: string,
  opts?: ActionClientOptions,
): Promise<ActionGetResponse> {
  const parsed = validateUrl(url);
  const fetchImpl = opts?.fetch ?? globalThis.fetch;
  const json = await fetchAndReadJson({
    parsed,
    fetchImpl,
    timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    init: {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    },
  });
  try {
    return parseActionGetResponse(json);
  } catch (e) {
    throw new ActionClientError({ code: 'invalid_response', cause: e });
  }
}

export async function requestActionTransaction(
  args: { url: string; account: string; data?: Record<string, string | string[]> },
  opts?: ActionClientOptions,
): Promise<ActionPostResponse> {
  const parsed = validateUrl(args.url);
  const fetchImpl = opts?.fetch ?? globalThis.fetch;
  // Sanitized body — only account (+ optional data).
  const body: { account: string; data?: Record<string, string | string[]> } = { account: args.account };
  if (args.data !== undefined) body.data = args.data;
  const json = await fetchAndReadJson({
    parsed,
    fetchImpl,
    timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    init: {
      method: 'POST',
      redirect: 'manual',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    },
  });
  try {
    return parseActionPostResponse(json);
  } catch (e) {
    throw new ActionClientError({ code: 'invalid_response', cause: e });
  }
}
