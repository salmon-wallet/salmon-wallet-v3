import type { NetworkId } from '../types/blockchain';

export const queryKeys = {
  balance: (params: { accountId: string; networkId: NetworkId; includeSpam?: boolean }) =>
    ['balance', params] as const,
  avatarNfts: (params: { accountId: string }) =>
    ['avatar-nfts', params] as const,
  solanaNfts: (params: { accountId: string; networkId: NetworkId; includeSpam?: boolean }) =>
    ['solana-nfts', params] as const,
  transactions: (params: { accountId: string; networkId: NetworkId }) =>
    ['transactions', params] as const,
} as const;
