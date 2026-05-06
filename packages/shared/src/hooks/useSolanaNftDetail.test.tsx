/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, QueryWrapper } from '../test-utils/query-wrapper';

vi.mock('../api/services', () => ({
  getSolanaNftByAddress: vi.fn(),
}));

import { getSolanaNftByAddress } from '../api/services';
import { useSolanaNftDetail } from './useSolanaNftDetail';

const mockGet = vi.mocked(getSolanaNftByAddress);

describe('useSolanaNftDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches NFT by mint and network', async () => {
    mockGet.mockResolvedValue({ id: 'mint1', name: 'X' } as any);

    const client = createTestQueryClient();
    const { result } = renderHook(
      () => useSolanaNftDetail({ mintAddress: 'mint1', networkId: 'solana-mainnet' }),
      { wrapper: ({ children }) => <QueryWrapper client={client}>{children}</QueryWrapper> },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('solana-mainnet', 'mint1');
    expect((result.current.nft as any)?.id).toBe('mint1');
  });

  it('skips when mint or network missing', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(
      () => useSolanaNftDetail({ mintAddress: undefined, networkId: 'solana-mainnet' }),
      { wrapper: ({ children }) => <QueryWrapper client={client}>{children}</QueryWrapper> },
    );
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.nft).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
