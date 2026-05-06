import { describe, expect, it, vi } from 'vitest';

import { RegistryFetchError, fetchRegistry } from '../registry-fetch';

describe('fetchRegistry', () => {
  it('returns the parsed shape on 200', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ version: 'v1', hosts: ['dial.to'] }), { status: 200 }),
    );
    const result = await fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
    expect(result).toEqual({ version: 'v1', hosts: ['dial.to'] });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/v1/blinks/registry',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('strips trailing slash from apiUrl', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ version: 'v1', hosts: [] }), { status: 200 }),
    );
    await fetchRegistry({ apiUrl: 'https://api.test/', fetch: fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/v1/blinks/registry',
      expect.any(Object),
    );
  });

  it('throws http_error on non-2xx', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl })).rejects.toMatchObject(
      { name: 'RegistryFetchError', code: 'http_error' },
    );
  });

  it('throws network_error on fetch rejection', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    await expect(fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl })).rejects.toMatchObject(
      { code: 'network_error' },
    );
  });

  it('throws timeout when fetch is aborted', async () => {
    const fetchImpl = vi.fn(async (_url, init?: RequestInit) => {
      await new Promise<void>((_, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener('abort', () => {
          const err: Error & { name?: string } = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
      return new Response('{}', { status: 200 });
    });
    await expect(
      fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl, timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: 'timeout' });
  });

  it('throws invalid_response on malformed shape', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ version: 1, hosts: ['dial.to'] }), { status: 200 }),
    );
    await expect(
      fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('throws invalid_response when hosts contains non-strings', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ version: 'v1', hosts: ['dial.to', 42] }), { status: 200 }),
    );
    await expect(
      fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('throws invalid_response when hosts exceeds the size cap', async () => {
    const hosts = Array.from({ length: 10_001 }, (_, i) => `host${i}.example`);
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ version: 'v1', hosts }), { status: 200 }),
    );
    await expect(
      fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('throws invalid_response when body is not JSON', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('not json', { status: 200 }),
    );
    await expect(
      fetchRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('RegistryFetchError exposes a code field', () => {
    const e = new RegistryFetchError({ code: 'timeout' });
    expect(e.code).toBe('timeout');
    expect(e.name).toBe('RegistryFetchError');
  });
});
