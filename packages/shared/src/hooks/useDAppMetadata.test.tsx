/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, QueryWrapper } from '../test-utils/query-wrapper';

vi.mock('../api/services', () => ({
  getDappMetadata: vi.fn(),
}));

import { getDappMetadata } from '../api/services';
import { useDAppMetadata } from './useDAppMetadata';

const mockGetDappMetadata = vi.mocked(getDappMetadata);

function wrapWithClient() {
  const client = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryWrapper client={client}>{children}</QueryWrapper>
  );
}

describe('useDAppMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads metadata for a valid origin', async () => {
    mockGetDappMetadata.mockResolvedValueOnce({
      name: 'Jupiter',
      icon: 'https://jup.ag/icon.png',
    });

    const { result } = renderHook(() => useDAppMetadata('https://jup.ag'), {
      wrapper: wrapWithClient(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetDappMetadata).toHaveBeenCalledWith('https://jup.ag');
    expect(result.current.metadata).toEqual({
      name: 'Jupiter',
      icon: 'https://jup.ag/icon.png',
    });
  });

  it('skips loading when origin is empty', () => {
    const { result } = renderHook(() => useDAppMetadata(''), { wrapper: wrapWithClient() });

    expect(mockGetDappMetadata).not.toHaveBeenCalled();
    expect(result.current.metadata).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('falls back to null metadata when the request fails', async () => {
    mockGetDappMetadata.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useDAppMetadata('https://jup.ag'), {
      wrapper: wrapWithClient(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metadata).toBeNull();
  });
});
