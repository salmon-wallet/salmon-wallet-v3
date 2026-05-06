/**
 * useAvatarNfts Hook
 *
 * Fetches the current account's Solana NFTs for avatar selection.
 * Shared between mobile (AvatarPicker) and extension (AccountAvatarPanel).
 *
 * Internals are powered by `@tanstack/react-query` — caching and dedupe are
 * handled by the QueryClient mounted at app roots. The public return shape is
 * preserved for backwards compatibility, with an added `refresh()` for parity
 * with sibling hooks.
 */

import { useQuery } from '@tanstack/react-query';
import type { Account } from '../types/account';
import type { NftAvatarItem } from '../types/ui/avatar-picker';
import type { Nft } from '../types/nft';
import { isSolanaAccount } from '../utils/account';
import { queryKeys } from '../query/keys';

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
  /** Error message if fetch failed */
  error: string | null;
  /** Whether an error occurred */
  isError: boolean;
  /** Manually refetch the NFT list */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAvatarNfts({ account, enabled }: UseAvatarNftsParams): UseAvatarNftsResult {
  const accountId = account?.id ?? '';
  const isEnabled = !!enabled && !!account && !!accountId;

  const query = useQuery<NftAvatarItem[], Error>({
    queryKey: queryKeys.avatarNfts({ accountId }),
    queryFn: async () => {
      if (!account) return [];

      const solanaMainnet = account.networksAccounts?.['solana-mainnet'];
      const solanaAccount = solanaMainnet?.[0];
      if (!solanaAccount || !isSolanaAccount(solanaAccount)) {
        return [];
      }

      const raw: Nft[] = await solanaAccount.getAllNfts();

      // BE drops blacklisted / spamScore>0 NFTs by default; the avatar
      // picker stays on that policy (no developer-mode override here).
      const items: NftAvatarItem[] = raw
        .map((nft): NftAvatarItem => ({
          mint: nft.mint.address,
          name: nft.name || 'Unnamed NFT',
          image: nft.media || undefined,
        }))
        .filter((item) => !!item.image);

      return items;
    },
    enabled: isEnabled,
    staleTime: 60_000,
  });

  return {
    nfts: query.data ?? [],
    loading: query.isPending && isEnabled,
    error: query.error?.message ?? null,
    isError: query.isError,
    refresh: () => query.refetch().then(() => undefined),
  };
}
