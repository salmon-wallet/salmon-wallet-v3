import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionClientError, fetchActionMetadata, requestActionTransaction } from '../action-client';

// `dial.to` is in the pinned snapshot; `evil.example` is not.
const TRUSTED = 'https://dial.to/api/action';
const UNTRUSTED = 'https://evil.example/api/action';

const validGet = {
  type: 'action' as const,
  icon: 'https://example.com/icon.png',
  title: 'Tip the creator',
  description: 'Send a SOL tip',
  label: 'Tip',
};

const validPost = {
  type: 'transaction' as const,
  transaction: 'AAAA',
};

const ACCOUNT = '11111111111111111111111111111111';

function jsonResponse(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const headers = new Headers({ 'content-type': 'application/json', ...(init?.headers ?? {}) });
  return new Response(text, { status: init?.status ?? 200, headers });
}

describe('action-client URL guards', () => {
  it('rejects http:// URLs as not_https', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata('http://dial.to/x', { fetch }),
    ).rejects.toMatchObject({ code: 'not_https' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects data: URLs as not_https', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata('data:text/plain,hi', { fetch }),
    ).rejects.toMatchObject({ code: 'not_https' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects file: URLs as not_https', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata('file:///etc/passwd', { fetch }),
    ).rejects.toMatchObject({ code: 'not_https' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects solana-action: URLs as not_https', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata('solana-action:https://dial.to/x', { fetch }),
    ).rejects.toMatchObject({ code: 'not_https' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects untrusted host before any network IO', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata(UNTRUSTED, { fetch }),
    ).rejects.toMatchObject({ code: 'untrusted_host' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed URLs', async () => {
    const fetch = vi.fn();
    await expect(
      fetchActionMetadata('not a url', { fetch }),
    ).rejects.toBeInstanceOf(ActionClientError);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('action-client redirect handling', () => {
  it('rejects 3xx responses as cross_host_redirect', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://evil.example/x' } }),
    );
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'cross_host_redirect',
    });
    // Verify redirect: 'manual' was passed
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: 'manual' }),
    );
  });
});

describe('action-client timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aborts after timeoutMs and surfaces a timeout error', async () => {
    const fetch: typeof globalThis.fetch = vi.fn(
      (_url, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    ) as unknown as typeof globalThis.fetch;
    const promise = fetchActionMetadata(TRUSTED, { fetch, timeoutMs: 1000 });
    // Attach a catch handler eagerly so the rejection is never unhandled
    // when the AbortController fires inside fake-timer advancement.
    const settled = promise.then(
      (v) => ({ ok: true as const, v }),
      (e) => ({ ok: false as const, e }),
    );
    await vi.advanceTimersByTimeAsync(1500);
    const result = await settled;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.e).toMatchObject({ code: 'timeout' });
    }
  });
});

describe('action-client size cap', () => {
  it('rejects when content-length exceeds 64 KiB without reading', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'content-length': '100000', 'content-type': 'application/json' },
      }),
    );
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'oversize_response',
    });
  });

  it('rejects when streamed body exceeds 64 KiB without content-length', async () => {
    const big = 'x'.repeat(70 * 1024);
    // Build a response without content-length.
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(big));
        controller.close();
      },
    });
    const fetch = vi.fn().mockResolvedValue(
      new Response(stream, { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'oversize_response',
    });
  });
});

describe('action-client http errors', () => {
  it('rejects 500 responses as http_error', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }));
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'http_error',
    });
  });
});

describe('fetchActionMetadata happy + invalid path', () => {
  it('parses a valid GET response', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(validGet));
    const out = await fetchActionMetadata(TRUSTED, { fetch });
    expect(out.title).toBe('Tip the creator');
  });

  it('rejects invalid GET response (missing icon) as invalid_response', async () => {
    const { icon: _icon, ...bad } = validGet;
    const fetch = vi.fn().mockResolvedValue(jsonResponse(bad));
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('rejects body that is not JSON as invalid_response', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    await expect(fetchActionMetadata(TRUSTED, { fetch })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('passes credentials: omit and Accept: application/json with no auth headers', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(validGet));
    await fetchActionMetadata(TRUSTED, { fetch });
    const init = fetch.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe('omit');
    expect(init.method).toBe('GET');
    const headers = new Headers(init.headers);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Cookie')).toBeNull();
  });
});

describe('requestActionTransaction', () => {
  it('parses a valid POST response', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(validPost));
    const out = await requestActionTransaction(
      { url: TRUSTED, account: ACCOUNT },
      { fetch },
    );
    expect((out as { transaction: string }).transaction).toBe('AAAA');
  });

  it('rejects invalid POST response as invalid_response', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ transaction: '@@@' }));
    await expect(
      requestActionTransaction({ url: TRUSTED, account: ACCOUNT }, { fetch }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('POSTs only { account, data } and never extra fields', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(validPost));
    const data = { amount: '1' };
    await requestActionTransaction(
      { url: TRUSTED, account: ACCOUNT, data },
      { fetch },
    );
    expect(fetch).toHaveBeenCalledWith(
      TRUSTED,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ account: ACCOUNT, data }),
        credentials: 'omit',
        redirect: 'manual',
      }),
    );
    const init = fetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Cookie')).toBeNull();
  });

  it('omits data key when not provided so body has only account', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(validPost));
    await requestActionTransaction({ url: TRUSTED, account: ACCOUNT }, { fetch });
    const init = fetch.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ account: ACCOUNT }));
  });

  it('rejects untrusted host before any network IO', async () => {
    const fetch = vi.fn();
    await expect(
      requestActionTransaction({ url: UNTRUSTED, account: ACCOUNT }, { fetch }),
    ).rejects.toMatchObject({ code: 'untrusted_host' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('treats 3xx as cross_host_redirect', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 301 }));
    await expect(
      requestActionTransaction({ url: TRUSTED, account: ACCOUNT }, { fetch }),
    ).rejects.toMatchObject({ code: 'cross_host_redirect' });
  });
});
