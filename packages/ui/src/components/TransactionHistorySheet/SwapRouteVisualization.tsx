import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, ms, vs, s, fontSize, borderRadius, spacing, formatBlockNumber, formatDateTime, getShortAddress } from '@salmon/shared';
import type { Transaction, SwapRouteHop } from './types';
import { PriceImpactBadge } from './PriceImpactBadge';
import { ConversionRateDisplay } from './ConversionRateDisplay';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

const ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};

/** Duration to show the copied state (ms) */
const COPIED_FEEDBACK_DURATION = 1500;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format amount with proper decimals
 */
function formatAmount(amount: string, decimals: number): string {
  const rawAmount = parseFloat(amount);
  if (isNaN(rawAmount)) return '0';

  const formattedAmount = rawAmount / Math.pow(10, decimals);

  if (formattedAmount === 0) return '0';
  if (formattedAmount < 0.0001) return '<0.0001';
  if (formattedAmount >= 1000000) return `${(formattedAmount / 1000000).toFixed(2)}M`;
  if (formattedAmount >= 1000) return `${(formattedAmount / 1000).toFixed(2)}K`;
  if (formattedAmount >= 1) return formattedAmount.toFixed(4).replace(/\.?0+$/, '');

  return formattedAmount.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Truncate a transaction hash for display
 */
function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

/**
 * Build route summary from transaction inputs/outputs
 */
function buildRouteSummary(transaction: Transaction): string {
  const { inputs, outputs, type } = transaction;

  if (type !== 'swap') return '';

  // Get unique symbols
  const outputSymbols = [...new Set(outputs.map(o => o.symbol))];
  const inputSymbols = [...new Set(inputs.map(i => i.symbol))];

  if (outputSymbols.length <= 2 && inputSymbols.length <= 2) {
    // Simple swap: show direct route
    return `${outputSymbols.join(', ')} → ${inputSymbols.join(', ')}`;
  }

  // Complex swap: show count
  return `${outputSymbols.length} tokens → ${inputSymbols.length} tokens`;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Token logo with fallback
 */
const TokenIcon: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 24,
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.tokenIcon, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.tokenIconPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="help-circle" size={size * 0.6} color={colors.text.tertiary} />
    </View>
  );
};

/**
 * Copyable hash/text row component
 */
const HashCopyRow: React.FC<{
  label: string;
  value: string;
  displayValue?: string;
}> = ({ label, value, displayValue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(value);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION);
    } catch (error) {
      console.warn('Failed to copy:', error);
    }
  }, [value]);

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <TouchableOpacity
        onPress={handleCopy}
        style={styles.hashCopyContainer}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}
      >
        <Text style={styles.summaryValue} numberOfLines={1}>
          {displayValue ?? value}
        </Text>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={12}
          color={copied ? colors.status.success : colors.text.tertiary}
          style={styles.copyIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Route hop visualization
 */
const RouteHop: React.FC<{ hop: SwapRouteHop; isLast: boolean }> = ({ hop, isLast }) => {
  return (
    <View style={styles.hopContainer}>
      {/* Input token */}
      <View style={styles.hopToken}>
        <TokenIcon uri={hop.inputToken.logo} size={20} />
        <Text style={styles.hopAmount} numberOfLines={1}>
          {formatAmount(hop.inputToken.amount, hop.inputToken.decimals)} {hop.inputToken.symbol}
        </Text>
      </View>

      {/* Arrow with DEX label */}
      <View style={styles.hopArrow}>
        <View style={styles.dexBadge}>
          <Text style={styles.dexText}>{hop.dex}</Text>
          {hop.percent < 100 && (
            <Text style={styles.percentText}>{hop.percent}%</Text>
          )}
        </View>
        <Ionicons name="arrow-forward" size={14} color={colors.text.secondary} />
      </View>

      {/* Output token (only show on last hop or if different from next input) */}
      {isLast && (
        <View style={styles.hopToken}>
          <TokenIcon uri={hop.outputToken.logo} size={20} />
          <Text style={styles.hopAmount} numberOfLines={1}>
            {formatAmount(hop.outputToken.amount, hop.outputToken.decimals)} {hop.outputToken.symbol}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Fallback route visualization when no detailed route data
 */
const SimpleRouteView: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { inputs, outputs, source, fee, slot, id, timestamp, swapRoute } = transaction;

  // Calculate conversion rate if not provided but we have input/output data
  const conversionRate = useMemo(() => {
    if (swapRoute?.conversionRate) return swapRoute.conversionRate;
    if (outputs.length === 1 && inputs.length === 1) {
      const fromToken = outputs[0];
      const toToken = inputs[0];
      const fromAmount = parseFloat(fromToken.amount) / Math.pow(10, fromToken.decimals);
      const toAmount = parseFloat(toToken.amount) / Math.pow(10, toToken.decimals);
      if (fromAmount > 0) {
        return {
          fromSymbol: fromToken.symbol,
          toSymbol: toToken.symbol,
          rate: (toAmount / fromAmount).toFixed(6),
        };
      }
    }
    return null;
  }, [swapRoute, outputs, inputs]);

  return (
    <View style={styles.simpleRouteContainer}>
      {/* Route header */}
      <View style={styles.routeHeader}>
        <Ionicons name="git-branch-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.routeHeaderText}>
          Route {source ? `via ${source}` : ''}
        </Text>
      </View>

      {/* Visual route */}
      <View style={styles.simpleRoute}>
        {/* Outputs (sent) */}
        <View style={styles.routeColumn}>
          <Text style={styles.routeLabel}>Sent</Text>
          {outputs.slice(0, 3).map((output, i) => (
            <View key={`out-${i}`} style={styles.routeTokenRow}>
              <TokenIcon uri={output.logo} size={18} />
              <Text style={styles.routeTokenText} numberOfLines={1}>
                {formatAmount(output.amount, output.decimals)} {output.symbol}
              </Text>
            </View>
          ))}
          {outputs.length > 3 && (
            <Text style={styles.moreText}>+{outputs.length - 3} more</Text>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.routeArrowColumn}>
          <Ionicons name="arrow-forward" size={20} color={colors.accent.primary} />
        </View>

        {/* Inputs (received) */}
        <View style={styles.routeColumn}>
          <Text style={styles.routeLabel}>Received</Text>
          {inputs.slice(0, 3).map((input, i) => (
            <View key={`in-${i}`} style={styles.routeTokenRow}>
              <TokenIcon uri={input.logo} size={18} />
              <Text style={styles.routeTokenText} numberOfLines={1}>
                {formatAmount(input.amount, input.decimals)} {input.symbol}
              </Text>
            </View>
          ))}
          {inputs.length > 3 && (
            <Text style={styles.moreText}>+{inputs.length - 3} more</Text>
          )}
        </View>
      </View>

      {/* Summary section - unified with TransactionDetailModal */}
      <View style={styles.routeSummary}>
        {/* Price Impact */}
        {swapRoute?.priceImpact && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price Impact</Text>
            <PriceImpactBadge value={swapRoute.priceImpact} size="small" showIcon />
          </View>
        )}

        {/* Conversion Rate */}
        {conversionRate && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <ConversionRateDisplay
              fromSymbol={conversionRate.fromSymbol}
              toSymbol={conversionRate.toSymbol}
              rate={conversionRate.rate}
              size="small"
            />
          </View>
        )}

        {/* Fee info */}
        {fee && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee</Text>
            <Text style={styles.summaryValue}>
              {(fee.amount / Math.pow(10, fee.decimals)).toFixed(6)} {fee.symbol}
            </Text>
          </View>
        )}

        {/* Block info */}
        {slot && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Block</Text>
            <Text style={styles.summaryValue}>#{formatBlockNumber(slot)}</Text>
          </View>
        )}

        {/* Timestamp */}
        {timestamp && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{formatDateTime(timestamp)}</Text>
          </View>
        )}

        {/* Transaction Hash */}
        {id && (
          <HashCopyRow
            label="Tx Hash"
            value={id}
            displayValue={truncateHash(id)}
          />
        )}

        {/* Fee Payer */}
        {transaction.feePayer && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee Payer</Text>
            <Text style={styles.summaryValue}>{getShortAddress(transaction.feePayer, 4)}</Text>
          </View>
        )}

        {/* Accounts Involved */}
        {transaction.accountsInvolved && transaction.accountsInvolved > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Accounts</Text>
            <Text style={styles.summaryValue}>{transaction.accountsInvolved}</Text>
          </View>
        )}

        {/* Programs Used */}
        {transaction.instructions && transaction.instructions.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Programs</Text>
            <Text style={styles.summaryValue}>{transaction.instructions.length}</Text>
          </View>
        )}

        {/* Swap Fees (Native) */}
        {transaction.swapFees?.nativeFees && transaction.swapFees.nativeFees.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Swap Fees (Native)</Text>
            <Text style={styles.summaryValue}>{transaction.swapFees.nativeFees.length} fee(s)</Text>
          </View>
        )}

        {/* Inner Swaps / Multi-hop */}
        {transaction.innerSwaps && transaction.innerSwaps.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route Hops</Text>
            <Text style={styles.summaryValue}>{transaction.innerSwaps.length} hop(s)</Text>
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Detailed route visualization with hops
 */
const DetailedRouteView: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { swapRoute, source, slot, fee, id, timestamp } = transaction;

  if (!swapRoute || swapRoute.hops.length === 0) {
    return <SimpleRouteView transaction={transaction} />;
  }

  return (
    <View style={styles.detailedRouteContainer}>
      {/* Route header */}
      <View style={styles.routeHeader}>
        <Ionicons name="git-branch-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.routeHeaderText}>
          Route {source ? `via ${source}` : ''} ({swapRoute.hops.length} {swapRoute.hops.length === 1 ? 'hop' : 'hops'})
        </Text>
      </View>

      {/* Hops */}
      <View style={styles.hopsContainer}>
        {swapRoute.hops.map((hop, index) => (
          <RouteHop
            key={`hop-${index}`}
            hop={hop}
            isLast={index === swapRoute.hops.length - 1}
          />
        ))}
      </View>

      {/* Summary */}
      <View style={styles.routeSummary}>
        {swapRoute.priceImpact && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price Impact</Text>
            <PriceImpactBadge value={swapRoute.priceImpact} size="small" showIcon />
          </View>
        )}
        {swapRoute.conversionRate && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <ConversionRateDisplay
              fromSymbol={swapRoute.conversionRate.fromSymbol}
              toSymbol={swapRoute.conversionRate.toSymbol}
              rate={swapRoute.conversionRate.rate}
              size="small"
            />
          </View>
        )}
        {swapRoute.totalFee && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Fees</Text>
            <Text style={styles.summaryValue}>
              {swapRoute.totalFee.amount} {swapRoute.totalFee.symbol}
            </Text>
          </View>
        )}
        {!swapRoute.totalFee && fee && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee</Text>
            <Text style={styles.summaryValue}>
              {(fee.amount / Math.pow(10, fee.decimals)).toFixed(6)} {fee.symbol}
            </Text>
          </View>
        )}
        {slot && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Block</Text>
            <Text style={styles.summaryValue}>#{formatBlockNumber(slot)}</Text>
          </View>
        )}
        {/* Timestamp */}
        {timestamp && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{formatDateTime(timestamp)}</Text>
          </View>
        )}
        {/* Transaction Hash */}
        {id && (
          <HashCopyRow
            label="Tx Hash"
            value={id}
            displayValue={truncateHash(id)}
          />
        )}

        {/* Fee Payer */}
        {transaction.feePayer && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee Payer</Text>
            <Text style={styles.summaryValue}>{getShortAddress(transaction.feePayer, 4)}</Text>
          </View>
        )}

        {/* Accounts Involved */}
        {transaction.accountsInvolved && transaction.accountsInvolved > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Accounts</Text>
            <Text style={styles.summaryValue}>{transaction.accountsInvolved}</Text>
          </View>
        )}

        {/* Programs Used */}
        {transaction.instructions && transaction.instructions.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Programs</Text>
            <Text style={styles.summaryValue}>{transaction.instructions.length}</Text>
          </View>
        )}

        {/* Swap Fees (Native) */}
        {transaction.swapFees?.nativeFees && transaction.swapFees.nativeFees.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Swap Fees (Native)</Text>
            <Text style={styles.summaryValue}>{transaction.swapFees.nativeFees.length} fee(s)</Text>
          </View>
        )}

        {/* Inner Swaps / Multi-hop */}
        {transaction.innerSwaps && transaction.innerSwaps.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route Hops</Text>
            <Text style={styles.summaryValue}>{transaction.innerSwaps.length} hop(s)</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface SwapRouteVisualizationProps {
  transaction: Transaction;
  expanded: boolean;
}

/**
 * SwapRouteVisualization - Expandable visualization of swap routes
 *
 * Shows the path a swap took through different DEXes and tokens.
 * Animates smoothly when expanding/collapsing with dynamic height.
 */
export const SwapRouteVisualization: React.FC<SwapRouteVisualizationProps> = ({
  transaction,
  expanded,
}) => {
  // Track measured content height
  const contentHeight = useSharedValue(0);
  const [measured, setMeasured] = useState(false);

  // Only show for swaps
  if (transaction.type !== 'swap') {
    return null;
  }

  // Handle content layout measurement
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight.value) {
      contentHeight.value = height;
      setMeasured(true);
    }
  }, [contentHeight]);

  // Animated styles for expand/collapse with dynamic height
  const animatedStyle = useAnimatedStyle(() => {
    const targetHeight = expanded ? contentHeight.value : 0;
    const height = withTiming(targetHeight, ANIMATION_CONFIG);
    const opacity = withTiming(expanded ? 1 : 0, ANIMATION_CONFIG);

    return {
      height: measured ? height : (expanded ? undefined : 0),
      opacity,
      overflow: 'hidden',
    };
  }, [expanded, measured]);

  // Memoize route summary
  const routeSummary = useMemo(() => buildRouteSummary(transaction), [transaction]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content} onLayout={handleContentLayout}>
        {transaction.swapRoute ? (
          <DetailedRouteView transaction={transaction} />
        ) : (
          <SimpleRouteView transaction={transaction} />
        )}
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    paddingTop: vs(spacing.sm),
    paddingBottom: s(spacing.xs),
    paddingHorizontal: s(spacing.xs),
  },

  // Simple route styles
  simpleRouteContainer: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: s(spacing.sm),
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    marginBottom: vs(spacing.sm),
  },
  routeHeaderText: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  simpleRoute: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  routeColumn: {
    flex: 1,
  },
  routeLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.tertiary,
    marginBottom: vs(spacing.xs),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    marginBottom: vs(2),
  },
  routeTokenText: {
    fontSize: ms(fontSize.base),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.primary,
    flex: 1,
  },
  routeArrowColumn: {
    paddingHorizontal: s(spacing.sm),
    paddingTop: vs(spacing.lg),
  },
  moreText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.tertiary,
    marginTop: vs(2),
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    marginTop: vs(spacing.sm),
    paddingTop: vs(spacing.xs),
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  feeText: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.tertiary,
  },

  // Detailed route styles
  detailedRouteContainer: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: s(spacing.sm),
  },
  hopsContainer: {
    marginBottom: vs(spacing.xs),
  },
  hopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(spacing.xs),
  },
  hopToken: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    flex: 1,
  },
  hopAmount: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.primary,
    flex: 1,
  },
  hopArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
    paddingHorizontal: s(spacing.sm),
  },
  dexBadge: {
    backgroundColor: colors.background.tokenItem,
    paddingHorizontal: s(spacing.xs),
    paddingVertical: vs(2),
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  dexText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  percentText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.tertiary,
  },

  // Summary styles
  routeSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: vs(spacing.xs),
    marginTop: vs(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  summaryLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.tertiary,
  },
  summaryValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  summaryValueWarning: {
    color: colors.status.warning,
  },

  // Token icon styles
  tokenIcon: {
    backgroundColor: colors.background.card,
  },
  tokenIconPlaceholder: {
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hash copy row styles
  hashCopyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  copyIcon: {
    marginLeft: s(2),
  },
});

export default SwapRouteVisualization;
