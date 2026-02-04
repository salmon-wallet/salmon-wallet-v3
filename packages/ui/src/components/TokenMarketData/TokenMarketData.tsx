import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { colors, ms, vs, s } from '@salmon/shared';
import { GlassContainer } from '../GlassContainer';
import type { TokenMarketDataProps } from './types';

/**
 * Format large numbers for display (e.g., 1.5B, 2.3M, 150K)
 */
function formatLargeNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
}

/**
 * Format USD currency for display
 */
function formatUSD(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `$${formatLargeNumber(value)}`;
}

/**
 * Format percentage for display
 */
function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Single market data row component (label left, value right)
 */
const MarketDataRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
  </View>
);

/**
 * TokenMarketData component for displaying token market statistics
 *
 * Features:
 * - Glassmorphism container
 * - Grid layout with market stats
 * - Loading skeleton state
 * - Formatted numbers (1.5B, 2.3M, etc.)
 *
 * @example
 * ```tsx
 * <TokenMarketData
 *   data={{
 *     marketCap: 50000000000,
 *     volume24h: 1500000000,
 *     circulatingSupply: 400000000,
 *     totalSupply: 500000000,
 *     ath: 260,
 *     athChangePercentage: -50,
 *   }}
 *   symbol="SOL"
 * />
 * ```
 */
export const TokenMarketData: React.FC<TokenMarketDataProps> = ({
  data,
  symbol,
  title = 'Info',
  loading = false,
  style,
}) => {
  if (loading) {
    return (
      <GlassContainer
        style={[styles.glassWrapper, style]}
        fallbackBackgroundColor={colors.background.tokenItem}
        fallbackBorderColor={colors.border.default}
        fallbackBorderWidth={1}
        fallbackBlurIntensity={2}
      >
        <View style={styles.container}>
          <ContentLoader
            speed={1.5}
            width="100%"
            height={160}
            backgroundColor={colors.skeleton.base}
            foregroundColor={colors.skeleton.highlight}
          >
            {/* Title */}
            <Rect x="0" y="0" rx="4" ry="4" width="40" height="16" />
            {/* Row 1 */}
            <Rect x="0" y="32" rx="4" ry="4" width="80" height="14" />
            <Rect x="85%" y="32" rx="4" ry="4" width="15%" height="14" />
            {/* Row 2 */}
            <Rect x="0" y="57" rx="4" ry="4" width="60" height="14" />
            <Rect x="85%" y="57" rx="4" ry="4" width="15%" height="14" />
            {/* Row 3 */}
            <Rect x="0" y="82" rx="4" ry="4" width="90" height="14" />
            <Rect x="80%" y="82" rx="4" ry="4" width="20%" height="14" />
            {/* Row 4 */}
            <Rect x="0" y="107" rx="4" ry="4" width="100" height="14" />
            <Rect x="80%" y="107" rx="4" ry="4" width="20%" height="14" />
            {/* Row 5 */}
            <Rect x="0" y="132" rx="4" ry="4" width="120" height="14" />
            <Rect x="80%" y="132" rx="4" ry="4" width="20%" height="14" />
          </ContentLoader>
        </View>
      </GlassContainer>
    );
  }

  if (!data) {
    return null;
  }

  const hasData =
    data.marketCap !== undefined ||
    data.volume24h !== undefined ||
    data.circulatingSupply !== undefined ||
    data.totalSupply !== undefined ||
    data.maxSupply !== undefined ||
    data.ath !== undefined ||
    data.atl !== undefined;

  if (!hasData) {
    return null;
  }

  // Determine color for ATH change
  const athChangeColor =
    data.athChangePercentage !== undefined
      ? data.athChangePercentage >= 0
        ? colors.change.positive
        : colors.change.negative
      : undefined;

  // Determine color for ATL change
  const atlChangeColor =
    data.atlChangePercentage !== undefined
      ? data.atlChangePercentage >= 0
        ? colors.change.positive
        : colors.change.negative
      : undefined;

  return (
    <GlassContainer
      style={[styles.glassWrapper, style]}
      fallbackBackgroundColor={colors.background.tokenItem}
      fallbackBorderColor={colors.border.default}
      fallbackBorderWidth={1}
      fallbackBlurIntensity={2}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.rowsContainer}>
          {/* Market Cap */}
          {data.marketCap !== undefined && (
            <MarketDataRow
              label="Market Cap"
              value={formatUSD(data.marketCap)}
            />
          )}

          {/* Market Cap Rank */}
          {data.marketCapRank !== undefined && data.marketCapRank !== null && (
            <MarketDataRow label="Rank" value={`#${data.marketCapRank}`} />
          )}

          {/* 24h Volume */}
          {data.volume24h !== undefined && (
            <MarketDataRow
              label="24h Volume"
              value={formatUSD(data.volume24h)}
            />
          )}

          {/* 24h High */}
          {data.high24h !== undefined && (
            <MarketDataRow label="24h High" value={formatUSD(data.high24h)} />
          )}

          {/* 24h Low */}
          {data.low24h !== undefined && (
            <MarketDataRow label="24h Low" value={formatUSD(data.low24h)} />
          )}

          {/* Circulating Supply */}
          {data.circulatingSupply !== undefined && (
            <MarketDataRow
              label="Circulating Supply"
              value={`${formatLargeNumber(data.circulatingSupply)}${symbol ? ` ${symbol}` : ''}`}
            />
          )}

          {/* Total Supply */}
          {data.totalSupply !== undefined && data.totalSupply !== null && (
            <MarketDataRow
              label="Total Supply"
              value={`${formatLargeNumber(data.totalSupply)}${symbol ? ` ${symbol}` : ''}`}
            />
          )}

          {/* Max Supply */}
          {data.maxSupply !== undefined && data.maxSupply !== null && (
            <MarketDataRow
              label="Max Supply"
              value={`${formatLargeNumber(data.maxSupply)}${symbol ? ` ${symbol}` : ''}`}
            />
          )}

          {/* All-Time High */}
          {data.ath !== undefined && (
            <MarketDataRow label="All-Time High" value={formatUSD(data.ath)} />
          )}

          {/* ATH Change */}
          {data.athChangePercentage !== undefined && (
            <MarketDataRow
              label="From ATH"
              value={formatPercentage(data.athChangePercentage)}
              valueColor={athChangeColor}
            />
          )}

          {/* ATH Date */}
          {data.athDate !== undefined && (
            <MarketDataRow label="ATH Date" value={formatDate(data.athDate)} />
          )}

          {/* All-Time Low */}
          {data.atl !== undefined && (
            <MarketDataRow label="All-Time Low" value={formatUSD(data.atl)} />
          )}

          {/* ATL Change */}
          {data.atlChangePercentage !== undefined && (
            <MarketDataRow
              label="From ATL"
              value={formatPercentage(data.atlChangePercentage)}
              valueColor={atlChangeColor}
            />
          )}

          {/* ATL Date */}
          {data.atlDate !== undefined && (
            <MarketDataRow label="ATL Date" value={formatDate(data.atlDate)} />
          )}
        </View>
      </View>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: 18,
    marginHorizontal: s(24),
    overflow: 'hidden',
  },
  container: {
    padding: s(12),
  },
  title: {
    fontSize: ms(14),
    fontFamily: 'DMSansSemiBold',
    color: colors.text.primary,
    marginBottom: vs(8),
    letterSpacing: ms(-0.07, 0.3),
  },
  rowsContainer: {
    gap: vs(11),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: ms(13),
    fontFamily: 'DMSansMedium',
    color: '#bdc3d1',
    letterSpacing: ms(-0.065, 0.3),
  },
  rowValue: {
    fontSize: ms(13),
    fontFamily: 'DMSansSemiBold',
    color: colors.text.primary,
    letterSpacing: ms(-0.065, 0.3),
  },
});

export default TokenMarketData;
