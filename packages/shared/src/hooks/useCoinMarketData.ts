/**
 * useCoinMarketData
 *
 * Shared React Query hook that fetches CoinGecko coin info + market chart in
 * parallel. Replaces duplicated `useState + useEffect` blocks in web/extension
 * HomePage Bitcoin and selected-token detail flows.
 */

import { useCallback, useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query/keys';
import { getCoinInfo, getMarketChart } from '../api/services';
import type { CoinInfo } from '../types/price';

export interface MarketChartPoint {
  timestamp: number;
  price: number;
}

export interface UseCoinMarketDataParams {
  coinId: string | undefined;
  currency: string;
  days: 1 | 7 | 30 | 90 | 365;
  enabled?: boolean;
}

export interface UseCoinMarketDataResult {
  coinInfo: CoinInfo | null;
  chartData: MarketChartPoint[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCoinMarketData(params: UseCoinMarketDataParams): UseCoinMarketDataResult {
  const { coinId, currency, days, enabled = true } = params;
  const isEnabled = enabled && !!coinId;
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      {
        queryKey: coinId ? queryKeys.coinInfo({ coinId, currency }) : ['coin-info', 'disabled'],
        queryFn: () => getCoinInfo(coinId as string, currency),
        enabled: isEnabled,
        staleTime: 60_000,
      },
      {
        queryKey: coinId
          ? queryKeys.marketChart({ coinId, currency, days })
          : ['market-chart', 'disabled'],
        queryFn: () => getMarketChart(coinId as string, days, currency),
        enabled: isEnabled,
        staleTime: 60_000,
      },
    ],
  });

  const [infoQuery, chartQuery] = results;

  const chartData = useMemo<MarketChartPoint[] | null>(() => {
    const data = chartQuery.data;
    if (!data?.prices) return null;
    return data.prices.map(([timestamp, price]) => ({ timestamp, price }));
  }, [chartQuery.data]);

  const errorObj = infoQuery.error ?? chartQuery.error;
  const error = errorObj ? (errorObj instanceof Error ? errorObj.message : String(errorObj)) : null;

  const refresh = useCallback(async () => {
    if (!coinId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.coinInfo({ coinId, currency }) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.marketChart({ coinId, currency, days }) }),
    ]);
  }, [queryClient, coinId, currency, days]);

  return {
    coinInfo: infoQuery.data ?? null,
    chartData,
    loading: isEnabled && (infoQuery.isPending || chartQuery.isPending),
    error,
    refresh,
  };
}
