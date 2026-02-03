import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import ContentLoader, { Rect } from 'react-content-loader/native';
import { colors, spacing, borderRadius, PRICE_CHART_PERIODS } from '@salmon/shared';
import type { PriceChartPeriod, PriceDataPoint } from '@salmon/shared';
import type { PriceChartProps } from './types';

/**
 * Default colors for positive/negative performance
 */
const CHART_COLORS = {
  positive: colors.status.success,
  negative: colors.status.error,
} as const;

/**
 * Calculate min and max values from data
 */
const getDataBounds = (data: PriceDataPoint[]): { min: number; max: number } => {
  if (data.length === 0) return { min: 0, max: 0 };

  let min = data[0].price;
  let max = data[0].price;

  for (const point of data) {
    if (point.price < min) min = point.price;
    if (point.price > max) max = point.price;
  }

  // Add padding to bounds
  const padding = (max - min) * 0.1;
  return {
    min: min - padding,
    max: max + padding,
  };
};

/**
 * Generate SVG path from data points
 */
const generatePath = (
  data: PriceDataPoint[],
  width: number,
  height: number,
  bounds: { min: number; max: number }
): string => {
  if (data.length === 0) return '';

  const { min, max } = bounds;
  const range = max - min || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.price - min) / range) * height;
    return { x, y };
  });

  // Create smooth curve using quadratic bezier
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    path += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`;
  }

  // Final line to last point
  if (points.length > 1) {
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x} ${lastPoint.y}`;
  }

  return path;
};

/**
 * Generate area fill path (extends line path to bottom)
 */
const generateAreaPath = (
  linePath: string,
  width: number,
  height: number
): string => {
  if (!linePath) return '';
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
};

/**
 * Determine if period performance is positive
 */
const isPositivePerformance = (data: PriceDataPoint[]): boolean => {
  if (data.length < 2) return true;
  return data[data.length - 1].price >= data[0].price;
};

/**
 * ChartSkeleton - Loading placeholder for the chart
 */
const ChartSkeleton: React.FC<{ height: number }> = ({ height }) => {
  const screenWidth = Dimensions.get('window').width - spacing['2xl'] * 2;

  return (
    <ContentLoader
      speed={1.5}
      width={screenWidth}
      height={height}
      viewBox={`0 0 ${screenWidth} ${height}`}
      backgroundColor={colors.skeleton.base}
      foregroundColor={colors.skeleton.highlight}
    >
      {/* Chart area skeleton */}
      <Rect x="0" y="0" rx="8" ry="8" width={screenWidth} height={height} />
    </ContentLoader>
  );
};

/**
 * PeriodSelectorSkeleton - Loading placeholder for period buttons
 */
const PeriodSelectorSkeleton: React.FC = () => {
  const buttonWidth = 40;
  const buttonHeight = 32;
  const gap = spacing.xs;
  const totalWidth = PRICE_CHART_PERIODS.length * (buttonWidth + gap) - gap;

  return (
    <View style={styles.periodContainer}>
      <ContentLoader
        speed={1.5}
        width={totalWidth}
        height={buttonHeight}
        viewBox={`0 0 ${totalWidth} ${buttonHeight}`}
        backgroundColor={colors.skeleton.base}
        foregroundColor={colors.skeleton.highlight}
      >
        {PRICE_CHART_PERIODS.map((_, index) => (
          <Rect
            key={index}
            x={index * (buttonWidth + gap)}
            y="0"
            rx="16"
            ry="16"
            width={buttonWidth}
            height={buttonHeight}
          />
        ))}
      </ContentLoader>
    </View>
  );
};

/**
 * PriceChart component for displaying token price history
 *
 * Features:
 * - Line chart with gradient fill
 * - Time period selector (1H, 1D, 1W, 1M, 3M, 1Y, All)
 * - Color changes based on period performance
 * - Loading state with skeleton
 *
 * @example
 * ```tsx
 * const priceData = [
 *   { timestamp: 1704067200000, price: 100.50 },
 *   { timestamp: 1704153600000, price: 102.30 },
 *   // ... more data points
 * ];
 *
 * <PriceChart
 *   data={priceData}
 *   selectedPeriod="1D"
 *   onPeriodChange={(period) => setPeriod(period)}
 *   loading={false}
 * />
 * ```
 */
export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
  loading = false,
  color,
  height = 200,
  style,
}) => {
  // Calculate chart dimensions
  const chartWidth = Dimensions.get('window').width - spacing['2xl'] * 2;
  const chartHeight = height;

  // Determine chart color based on performance
  const chartColor = useMemo(() => {
    if (color) return color;
    return isPositivePerformance(data) ? CHART_COLORS.positive : CHART_COLORS.negative;
  }, [data, color]);

  // Calculate data bounds
  const bounds = useMemo(() => getDataBounds(data), [data]);

  // Generate SVG paths
  const linePath = useMemo(
    () => generatePath(data, chartWidth, chartHeight, bounds),
    [data, chartWidth, chartHeight, bounds]
  );

  const areaPath = useMemo(
    () => generateAreaPath(linePath, chartWidth, chartHeight),
    [linePath, chartWidth, chartHeight]
  );

  // Handle period selection
  const handlePeriodPress = useCallback(
    (period: PriceChartPeriod) => {
      onPeriodChange(period);
    },
    [onPeriodChange]
  );

  return (
    <View style={[styles.container, style]}>
      {/* Chart area */}
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {loading ? (
          <ChartSkeleton height={chartHeight} />
        ) : data.length > 0 ? (
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={chartColor} stopOpacity={0.3} />
                <Stop offset="1" stopColor={chartColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Area fill */}
            <Path d={areaPath} fill="url(#areaGradient)" />

            {/* Line */}
            <Path
              d={linePath}
              stroke={chartColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No data available</Text>
          </View>
        )}
      </View>

      {/* Period selector */}
      {loading ? (
        <PeriodSelectorSkeleton />
      ) : (
        <View style={styles.periodContainer}>
          {PRICE_CHART_PERIODS.map((period) => {
            const isSelected = period === selectedPeriod;
            return (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  isSelected && styles.periodButtonSelected,
                ]}
                onPress={() => handlePeriodPress(period)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select ${period} time period`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    isSelected && styles.periodButtonTextSelected,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  chartContainer: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  periodButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
  },
  periodButtonSelected: {
    backgroundColor: colors.text.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  periodButtonTextSelected: {
    color: colors.background.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default PriceChart;
