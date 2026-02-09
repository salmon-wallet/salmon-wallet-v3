/**
 * @vitest-environment jsdom
 * Tests for useToken hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useToken } from './useToken';
import type { TokenMetadata } from '../api/services';
import type { TokenBalanceWithPrice } from '../utils/balance';
import * as tokensService from '../api/services/tokens';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../api/services/tokens', () => ({
  getTokenByAddress: vi.fn(),
}));

// ============================================================================
// Test Data
// ============================================================================

const MOCK_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const MOCK_TOKEN_METADATA: TokenMetadata = {
  address: MOCK_TOKEN_ADDRESS,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logo: 'https://example.com/usdc.png',
  coingeckoId: 'usd-coin',
  tags: ['stablecoin'],
};

const MOCK_BALANCE_ITEMS: TokenBalanceWithPrice[] = [
  {
    address: MOCK_TOKEN_ADDRESS,
    mint: MOCK_TOKEN_ADDRESS,
    owner: 'TestOwner111111111111111111111111111111111',
    amount: '1000000000',
    decimals: 6,
    uiAmount: 1000,
    symbol: 'USDC',
    name: 'USD Coin',
    logo: 'https://example.com/usdc.png',
    coingeckoId: 'usd-coin',
    tags: ['stablecoin'],
    price: 1.0,
    usdBalance: 1000,
    priceChange24h: 0.01,
    program: 'spl-token',
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('useToken Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tokensService.getTokenByAddress as any).mockResolvedValue(MOCK_TOKEN_METADATA);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty token when no tokenId provided', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: '', networkId: 'solana-mainnet' })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.address).toBe('');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch token metadata when tokenId is provided', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS, networkId: 'solana-mainnet' })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.address).toBe(MOCK_TOKEN_ADDRESS);
      expect(result.current.token.symbol).toBe('USDC');
      expect(result.current.token.name).toBe('USD Coin');
      expect(tokensService.getTokenByAddress).toHaveBeenCalledWith(
        MOCK_TOKEN_ADDRESS,
        'solana-mainnet'
      );
    });

    it('should use default networkId when not provided', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledWith(
        MOCK_TOKEN_ADDRESS,
        'solana-mainnet'
      );
    });
  });

  describe('Balance Items Integration', () => {
    it('should prioritize balance items over API fetch', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: MOCK_BALANCE_ITEMS,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.symbol).toBe('USDC');
      expect(result.current.token.uiAmount).toBe(1000);
      expect(result.current.token.price).toBe(1.0);
      expect(result.current.token.usdBalance).toBe(1000);
      expect(tokensService.getTokenByAddress).not.toHaveBeenCalled();
    });

    it('should match token by address in balance items', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: MOCK_BALANCE_ITEMS,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.address).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should match token by mint in balance items', async () => {
      const balanceWithMint = [
        {
          ...MOCK_BALANCE_ITEMS[0],
          address: undefined,
        },
      ];

      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: balanceWithMint as any,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.symbol).toBe('USDC');
    });

    it('should handle case-insensitive matching in balance items', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS.toLowerCase(),
          balanceItems: MOCK_BALANCE_ITEMS,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.symbol).toBe('USDC');
    });

    it('should fallback to API when not found in balance items', async () => {
      const otherTokenAddress = 'DifferentToken111111111111111111111111111';

      const { result } = renderHook(() =>
        useToken({
          tokenId: otherTokenAddress,
          balanceItems: MOCK_BALANCE_ITEMS,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledWith(
        otherTokenAddress,
        'solana-mainnet'
      );
    });
  });

  describe('Skip Metadata Fetch', () => {
    it('should skip API fetch when skipMetadataFetch is true', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          skipMetadataFetch: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).not.toHaveBeenCalled();
      expect(result.current.token.address).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should still check balance items when skipMetadataFetch is true', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: MOCK_BALANCE_ITEMS,
          skipMetadataFetch: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.symbol).toBe('USDC');
      expect(tokensService.getTokenByAddress).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during fetch', async () => {
      let resolvePromise: any;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (tokensService.getTokenByAddress as any).mockReturnValue(promise);

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.loaded).toBe(false);

      resolvePromise(MOCK_TOKEN_METADATA);

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set loaded to true after successful fetch', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set loaded to true after error', async () => {
      (tokensService.getTokenByAddress as any).mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Failed to fetch token');
      (tokensService.getTokenByAddress as any).mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to fetch token');
      expect(result.current.token.address).toBe(MOCK_TOKEN_ADDRESS);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should set minimal token info on error', async () => {
      (tokensService.getTokenByAddress as any).mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token).toEqual({ address: MOCK_TOKEN_ADDRESS });
    });

    it('should handle non-Error exceptions', async () => {
      (tokensService.getTokenByAddress as any).mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to fetch token');
    });
  });

  describe('Token Not Found', () => {
    it('should return minimal token info when API returns null', async () => {
      (tokensService.getTokenByAddress as any).mockResolvedValue(null);

      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token).toEqual({ address: MOCK_TOKEN_ADDRESS });
      expect(result.current.error).toBeNull();
    });

    it('should return minimal token info when not in balance items', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: 'UnknownToken111111111111111111111111111',
          balanceItems: MOCK_BALANCE_ITEMS,
          skipMetadataFetch: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token).toEqual({
        address: 'UnknownToken111111111111111111111111111',
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch token data when refetch is called', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(tokensService.getTokenByAddress).toHaveBeenCalledTimes(2);
    });

    it('should update loading state during refetch', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: MOCK_TOKEN_ADDRESS })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      let resolvePromise: any;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (tokensService.getTokenByAddress as any).mockReturnValue(promise);

      const refetchPromise = result.current.refetch();

      // Wait for the loading state to be set to true
      // State updates are asynchronous in React, so we need waitFor
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      resolvePromise(MOCK_TOKEN_METADATA);

      await refetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Token ID Changes', () => {
    it('should refetch when tokenId changes', async () => {
      const { result, rerender } = renderHook(
        ({ tokenId }) => useToken({ tokenId }),
        { initialProps: { tokenId: MOCK_TOKEN_ADDRESS } }
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledTimes(1);

      const newTokenAddress = 'NewToken111111111111111111111111111111';
      rerender({ tokenId: newTokenAddress });

      await waitFor(() => {
        expect(tokensService.getTokenByAddress).toHaveBeenCalledWith(
          newTokenAddress,
          'solana-mainnet'
        );
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledTimes(2);
    });

    it('should clear previous data when tokenId changes', async () => {
      const { result, rerender } = renderHook(
        ({ tokenId }) => useToken({ tokenId }),
        { initialProps: { tokenId: MOCK_TOKEN_ADDRESS } }
      );

      await waitFor(() => {
        expect(result.current.token.symbol).toBe('USDC');
      });

      const newMetadata = {
        ...MOCK_TOKEN_METADATA,
        address: 'NewToken111111111111111111111111111111',
        symbol: 'NEW',
      };

      (tokensService.getTokenByAddress as any).mockResolvedValue(newMetadata);

      rerender({ tokenId: 'NewToken111111111111111111111111111111' });

      await waitFor(() => {
        expect(result.current.token.symbol).toBe('NEW');
      });
    });
  });

  describe('Network ID Changes', () => {
    it('should refetch when networkId changes', async () => {
      const { result, rerender } = renderHook(
        ({ networkId }) => useToken({ tokenId: MOCK_TOKEN_ADDRESS, networkId }),
        { initialProps: { networkId: 'solana-mainnet' as any } }
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalledTimes(1);

      rerender({ networkId: 'solana-devnet' as any });

      await waitFor(() => {
        expect(tokensService.getTokenByAddress).toHaveBeenCalledWith(
          MOCK_TOKEN_ADDRESS,
          'solana-devnet'
        );
      });
    });
  });

  describe('Balance Items Changes', () => {
    it('should update when balanceItems change', async () => {
      const { result, rerender } = renderHook(
        ({ balanceItems }) => useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems,
        }),
        { initialProps: { balanceItems: [] as any } }
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Should have fetched from API
      expect(tokensService.getTokenByAddress).toHaveBeenCalled();

      rerender({ balanceItems: MOCK_BALANCE_ITEMS });

      await waitFor(() => {
        expect(result.current.token.price).toBe(1.0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string tokenId', async () => {
      const { result } = renderHook(() =>
        useToken({ tokenId: '' })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.token.address).toBe('');
      expect(tokensService.getTokenByAddress).not.toHaveBeenCalled();
    });

    it('should handle empty balance items array', async () => {
      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: [],
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(tokensService.getTokenByAddress).toHaveBeenCalled();
    });

    it('should handle missing address and mint in balance items', async () => {
      const balanceWithoutAddressOrMint = [
        {
          ...MOCK_BALANCE_ITEMS[0],
          address: undefined,
          mint: undefined,
        },
      ];

      const { result } = renderHook(() =>
        useToken({
          tokenId: MOCK_TOKEN_ADDRESS,
          balanceItems: balanceWithoutAddressOrMint as any,
        })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Should fallback to API fetch
      expect(tokensService.getTokenByAddress).toHaveBeenCalled();
    });
  });
});
