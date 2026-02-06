import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ms, s, fontSize } from '@salmon/shared';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ConversionRateDisplayProps {
  /** Input token symbol */
  fromSymbol: string;
  /** Output token symbol */
  toSymbol: string;
  /** The conversion rate (how many toTokens per 1 fromToken) */
  rate: string;
  /** Optional size variant */
  size?: 'small' | 'medium';
  /** Custom style */
  style?: ViewStyle;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format the conversion rate with appropriate precision and suffixes
 * - If rate > 1000: format with K suffix (e.g., "1.5K")
 * - If rate < 0.0001: show "<0.0001"
 * - Otherwise: show up to 4 decimal places, trimming trailing zeros
 */
function formatRate(rate: string): string {
  const numericRate = parseFloat(rate);

  if (isNaN(numericRate) || numericRate === 0) {
    return '0';
  }

  // Handle very small values
  if (numericRate < 0.0001) {
    return '<0.0001';
  }

  // Handle large values with K suffix
  if (numericRate >= 1000) {
    const kValue = numericRate / 1000;
    // Format with up to 2 decimal places, trimming trailing zeros
    return `${kValue.toFixed(2).replace(/\.?0+$/, '')}K`;
  }

  // Standard formatting: up to 4 decimal places, trimming trailing zeros
  return numericRate.toFixed(4).replace(/\.?0+$/, '');
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ConversionRateDisplay - Displays the conversion rate for swap transactions
 *
 * Shows the rate in format "1 SOL = 150.25 USDC" or compact "1:150.25" for small size.
 *
 * @example
 * ```tsx
 * <ConversionRateDisplay
 *   fromSymbol="SOL"
 *   toSymbol="USDC"
 *   rate="150.25"
 * />
 * ```
 */
export const ConversionRateDisplay: React.FC<ConversionRateDisplayProps> = ({
  fromSymbol,
  toSymbol,
  rate,
  size = 'medium',
  style,
}) => {
  const formattedRate = useMemo(() => formatRate(rate), [rate]);

  const isSmall = size === 'small';

  if (isSmall) {
    // Compact format: "1:150.25"
    return (
      <View style={[styles.container, styles.containerSmall, style]}>
        <Ionicons
          name="swap-horizontal"
          size={12}
          color={colors.text.secondary}
          style={styles.iconSmall}
        />
        <Text style={styles.compactText}>
          1:{formattedRate}
        </Text>
      </View>
    );
  }

  // Full format: "1 SOL = 150.25 USDC"
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="swap-horizontal"
        size={14}
        color={colors.text.secondary}
        style={styles.icon}
      />
      <Text style={styles.text}>
        <Text style={styles.symbolText}>1 {fromSymbol}</Text>
        <Text style={styles.equalsText}> = </Text>
        <Text style={styles.rateText}>{formattedRate} </Text>
        <Text style={styles.symbolText}>{toSymbol}</Text>
      </Text>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerSmall: {
    // Additional styles for small variant if needed
  },
  icon: {
    marginRight: s(6),
  },
  iconSmall: {
    marginRight: s(4),
  },
  text: {
    fontSize: ms(fontSize.sm),
    color: colors.text.secondary,
  },
  symbolText: {
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  equalsText: {
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
  },
  rateText: {
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
  },
  compactText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
  },
});

export default ConversionRateDisplay;
