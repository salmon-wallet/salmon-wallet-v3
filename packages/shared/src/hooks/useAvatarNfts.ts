/**
 * useAvatarNfts Hook
 *
 * Fetches the current account's Solana NFTs for avatar selection.
 * Shared between mobile (AvatarPicker) and extension (AccountAvatarPage).
 */

import { useState, useEffect, useRef } from 'react';
import type { Account } from '../types/account';
import type { NftAvatarItem } from '../types/ui/avatar-picker';
import type { Nft } from '../types/nft';
import { isSolanaAccount } from '../utils/account';
import { filterSpamNfts } from '../utils/nft-spam-filter';

// ============================================================================
// Types
// ============================================================================

export interface UseAvatarNftsParams {
  /** The account to fetch NFTs for */
  account: Account | undefined;
  /** Whether fetching is enabled (e.g. when NFT tab is active) */
  enabled: boolean;
}

export interface UseAvatarNftsResult {
  /** NFT items suitable for avatar selection */
  nfts: NftAvatarItem[];
  /** Whether NFTs are currently loading */
  loading: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useAvatarNfts({ account, enabled }: UseAvatarNftsParams): UseAvatarNftsResult {
  const [nfts, setNfts] = useState<NftAvatarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Reset when account changes so NFTs are re-fetched for the new account
  const prevAccountIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentId = account?.id;
    if (currentId !== prevAccountIdRef.current) {
      prevAccountIdRef.current = currentId;
      setFetched(false);
      setNfts([]);
    }
  }, [account]);

  useEffect(() => {
    if (!enabled || fetched || !account) return;

    const fetchNfts = async () => {
      setLoading(true);
      try {
        const solanaMainnet = account.networksAccounts?.['solana-mainnet'];
        const solanaAccount = solanaMainnet?.[0];
        if (!solanaAccount || !isSolanaAccount(solanaAccount)) {
          setLoading(false);
          setFetched(true);
          return;
        }

        const raw: Nft[] = await solanaAccount.getAllNfts();

        const converted = raw.map((nft) => ({
          mint: nft.mint.address,
          name: nft.name || 'Unnamed NFT',
          image: nft.media || undefined,
          blockchain: 'solana' as const,
          blacklisted: nft.blacklisted ?? false,
        }));
        const filtered = filterSpamNfts(converted).filter((nft) => nft.image);

        setNfts(
          filtered.map((nft) => ({
            mint: nft.mint,
            name: nft.name,
            image: nft.image,
          })),
        );
      } catch (error) {
        console.error('[useAvatarNfts] Failed to fetch NFTs:', error);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };

    fetchNfts();
  }, [enabled, fetched, account]);

  return { nfts, loading };
}

export default useAvatarNfts;
