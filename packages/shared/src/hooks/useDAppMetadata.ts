import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query/keys';
import { getDappMetadata } from '../api/services';
import type { DappMetadata } from '../types/trusted-app';

export interface UseDAppMetadataResult {
  metadata: DappMetadata | null;
  loading: boolean;
}

export function useDAppMetadata(origin: string): UseDAppMetadataResult {
  const isEnabled = !!origin;
  const query = useQuery({
    queryKey: origin ? queryKeys.dappMetadata({ origin }) : ['dapp-metadata', 'disabled'],
    queryFn: async () => {
      try {
        return await getDappMetadata(origin);
      } catch {
        return null;
      }
    },
    enabled: isEnabled,
    staleTime: 5 * 60_000,
  });

  return {
    metadata: query.data ?? null,
    loading: isEnabled && query.isPending,
  };
}
