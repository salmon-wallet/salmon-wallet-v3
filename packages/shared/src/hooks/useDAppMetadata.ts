import { useEffect, useState } from 'react';
import { getDappMetadata } from '../api/services';
import type { DappMetadata } from '../types/trusted-app';

export interface UseDAppMetadataResult {
  metadata: DappMetadata | null;
  loading: boolean;
}

export function useDAppMetadata(origin: string): UseDAppMetadataResult {
  const [metadata, setMetadata] = useState<DappMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      if (!origin) {
        setMetadata(null);
        setLoading(false);
        return;
      }

      setMetadata(null);
      setLoading(true);

      try {
        const nextMetadata = await getDappMetadata(origin);
        if (!cancelled) {
          setMetadata(nextMetadata);
        }
      } catch {
        if (!cancelled) {
          setMetadata(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [origin]);

  return { metadata, loading };
}
