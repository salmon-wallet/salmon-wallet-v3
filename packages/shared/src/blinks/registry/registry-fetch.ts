/**
 * Fetch the blinks trusted-host registry from salmon-api.
 *
 * Endpoint: `GET ${apiUrl}/v1/blinks/registry`
 * Response: `{ version: string, hosts: string[] }`
 *
 * Hard 5s timeout via AbortController. Throws on non-2xx, network error,
 * timeout, or malformed response shape. All thrown errors are
 * `RegistryFetchError` so callers can branch on `code`.
 */

import { getApiUrl } from '../../api/config';

const DEFAULT_TIMEOUT_MS = 5_000;

export type RegistryFetchErrorCode =
  | 'timeout'
  | 'http_error'
  | 'network_error'
  | 'invalid_response';

export class RegistryFetchError extends Error {
  readonly code: RegistryFetchErrorCode;
  readonly cause?: unknown;

  constructor(args: { code: RegistryFetchErrorCode; message?: string; cause?: unknown }) {
    super(args.message ?? args.code);
    this.name = 'RegistryFetchError';
    this.code = args.code;
    this.cause = args.cause;
  }
}

export interface RegistryFetchResult {
  version: string;
  hosts: string[];
}

export interface RegistryFetchOptions {
  apiUrl?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

function isValidShape(value: unknown): value is RegistryFetchResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'string') return false;
  if (!Array.isArray(v.hosts)) return false;
  return v.hosts.every((h) => typeof h === 'string');
}

export async function fetchRegistry(opts?: RegistryFetchOptions): Promise<RegistryFetchResult> {
  const baseUrl = opts?.apiUrl ?? getApiUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/v1/blinks/registry`;
  const fetchImpl = opts?.fetch ?? globalThis.fetch;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (e) {
      const err = e as { name?: string };
      if (err && err.name === 'AbortError') {
        throw new RegistryFetchError({ code: 'timeout' });
      }
      throw new RegistryFetchError({ code: 'network_error', cause: e });
    }
    if (!res.ok) {
      throw new RegistryFetchError({ code: 'http_error', message: `status ${res.status}` });
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch (e) {
      throw new RegistryFetchError({ code: 'invalid_response', cause: e });
    }
    if (!isValidShape(json)) {
      throw new RegistryFetchError({ code: 'invalid_response', message: 'shape mismatch' });
    }
    return { version: json.version, hosts: json.hosts };
  } finally {
    clearTimeout(timer);
  }
}
