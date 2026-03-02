import React, { useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ms, vs, s, fontSize, borderRadius, formatRawAmount, formatRelativeTimeCompact, getTransactionDescription, fontFamilyNative } from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import { TokenLogo } from '../TokenLogo';
import { SwapRouteVisualization } from './SwapRouteVisualization';
import type { TransactionItemProps, TransactionType, TransactionTokenAmount } from './types';

// ============================================================================
// Constants
// ============================================================================

const HIDDEN_VALUE = '****';

/** Maximum amounts to show before collapsing */
const MAX_VISIBLE_AMOUNTS = 2;

/**
 * Transaction type display configuration
 */
const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  send: {
    label: 'Sent',
    icon: 'arrow-up-outline',
    color: colors.change.negative,
  },
  receive: {
    label: 'Received',
    icon: 'arrow-down-outline',
    color: colors.change.positive,
  },
  swap: {
    label: 'Swapped',
    icon: 'swap-horizontal-outline',
    color: colors.palette.purple,
  },
  mint: {
    label: 'Minted',
    icon: 'add-circle-outline',
    color: colors.palette.cyan,
  },
  burn: {
    label: 'Burned',
    icon: 'flame-outline',
    color: colors.palette.orange,
  },
  stake: {
    label: 'Staked',
    icon: 'lock-closed-outline',
    color: colors.palette.green,
  },
  loan: {
    label: 'Loan',
    icon: 'cash-outline',
    color: colors.palette.amber,
  },
  interaction: {
    label: 'Interaction',
    icon: 'cube-outline',
    color: colors.palette.blue,
  },
  unknown: {
    label: 'Unknown',
    icon: 'help-circle-outline',
    color: colors.text.secondary,
  },
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Swap tokens visualization (two overlapping logos) with type badge
 */
const SwapTokenLogos: React.FC<{
  fromLogo?: string | null;
  fromSymbol?: string;
  toLogo?: string | null;
  toSymbol?: string;
  typeIcon: keyof typeof Ionicons.glyphMap;
  typeColor: string;
}> = ({ fromLogo, fromSymbol, toLogo, toSymbol, typeIcon, typeColor }) => {
  return (
    <View style={styles.swapLogosContainer}>
      <TokenLogo uri={fromLogo || undefined} symbol={fromSymbol} size={34} />
      <View style={styles.swapLogoOverlap}>
        <TokenLogo uri={toLogo || undefined} symbol={toSymbol} size={34} />
      </View>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
        <Ionicons name={typeIcon} size={10} color="#FFFFFF" />
      </View>
    </View>
  );
};

/**
 * Token logo with type badge overlay
 */
const TokenLogoWithBadge: React.FC<{
  uri?: string | null;
  symbol?: string;
  typeIcon: keyof typeof Ionicons.glyphMap;
  typeColor: string;
}> = ({ uri, symbol, typeIcon, typeColor }) => {
  return (
    <View style={styles.logoWithBadgeContainer}>
      <TokenLogo uri={uri || undefined} symbol={symbol} size={40} />
      <View style={[styles.typeBadge, styles.typeBadgeSingle, { backgroundColor: typeColor }]}>
        <Ionicons name={typeIcon} size={10} color="#FFFFFF" />
      </View>
    </View>
  );
};

/**
 * Amount display for a transaction
 */
const AmountDisplay: React.FC<{
  token: TransactionTokenAmount;
  sign: '+' | '-';
  hidden: boolean;
}> = ({ token, sign, hidden }) => {
  const displayAmount = hidden
    ? `${sign} ${HIDDEN_VALUE} ${token.symbol}`
    : `${sign} ${formatRawAmount(token.amount, token.decimals)} ${token.symbol}`;

  const color = sign === '+' ? colors.change.positive : colors.change.negative;

  return (
    <Text style={[styles.amountText, { color }]} numberOfLines={1}>
      {displayAmount}
    </Text>
  );
};

/**
 * Source/Protocol badge
 */
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  return (
    <View style={styles.sourceBadge}>
      <Text style={styles.sourceText}>{source}</Text>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransactionItem - Individual transaction row for the transaction list
 *
 * Features:
 * - Shows transaction type icon with token logos
 * - Collapses multiple amounts with expandable route visualization
 * - Badge showing source protocol (Jupiter, etc.)
 *
 * @example
 * ```tsx
 * <TransactionItem
 *   transaction={transaction}
 *   onPress={(tx) => console.log('Pressed:', tx.id)}
 *   hiddenBalance={false}
 * />
 * ```
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  onLongPressDetail,
  hiddenBalance = false,
  style,
}) => {
  const { t } = useTranslation();
  const { type, timestamp, status, inputs, outputs, description, source } = transaction;
  const config = TRANSACTION_TYPE_CONFIG[type] || TRANSACTION_TYPE_CONFIG.unknown;

  // Expanded state for route visualization
  const [expanded, setExpanded] = useState(false);

  // Calculate if we should show collapsed view
  const totalAmounts = inputs.length + outputs.length;
  const isComplex = type === 'swap' && totalAmounts > MAX_VISIBLE_AMOUNTS;

  // Check if this is a swap transaction (expandable)
  const isSwap = type === 'swap';

  const handlePress = useCallback(() => {
    if (isSwap) {
      // Toggle expansion for all swaps (to see the route inline)
      setExpanded(prev => !prev);
    } else {
      // Normal press behavior for non-swap transactions
      onPress?.(transaction);
    }
  }, [isSwap, onPress, transaction]);

  const handleLongPress = useCallback(() => {
    // Long press opens the detail modal via callback
    if (onLongPressDetail) {
      onLongPressDetail(transaction);
    }
  }, [onLongPressDetail, transaction]);

  // Get description text
  const descriptionText = useMemo(
    () => getTransactionDescription(type, inputs, outputs, source, description),
    [type, inputs, outputs, source, description]
  );

  // Determine which logo(s) to show
  const renderLogo = () => {
    // For swaps, try to show token logos with type badge
    if (type === 'swap') {
      if (inputs[0]?.logo && outputs[0]?.logo) {
        return (
          <SwapTokenLogos
            fromLogo={outputs[0].logo}
            fromSymbol={outputs[0].symbol}
            toLogo={inputs[0].logo}
            toSymbol={inputs[0].symbol}
            typeIcon={config.icon}
            typeColor={config.color}
          />
        );
      }
    }

    // For other types with token logo, show logo with type badge
    const primaryToken = type === 'receive' ? inputs[0] : (outputs[0] || inputs[0]);
    if (primaryToken?.logo) {
      return (
        <TokenLogoWithBadge
          uri={primaryToken.logo}
          symbol={primaryToken.symbol}
          typeIcon={config.icon}
          typeColor={config.color}
        />
      );
    }

    // Fallback to type icon only (no badge needed)
    return (
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>
    );
  };

  // Helper to render token amounts
  const renderTokenAmounts = (tokens: TransactionTokenAmount[], sign: '+' | '-') => {
    return tokens.map((token, i) => (
      <AmountDisplay
        key={`${sign}-${i}`}
        token={token}
        sign={sign}
        hidden={hiddenBalance}
      />
    ));
  };

  // Render amount changes
  const renderAmounts = () => {
    // Status badges
    if (status === 'failed') {
      return (
        <View style={styles.failedBadge}>
          <Ionicons name="close-circle" size={16} color={colors.status.error} />
          <Text style={styles.failedText}>Failed</Text>
        </View>
      );
    }

    if (status === 'pending') {
      return (
        <View style={styles.pendingBadge}>
          <Ionicons name="time-outline" size={14} color={colors.status.warning} />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      );
    }

    // Complex swap with expand toggle
    if (isComplex) {
      const firstOutput = outputs[0];
      const firstInput = inputs[0];
      const hiddenCount = totalAmounts - 2;

      return (
        <View style={styles.amountsContainer}>
          {firstOutput && (
            <AmountDisplay token={firstOutput} sign="-" hidden={hiddenBalance} />
          )}
          {firstInput && (
            <AmountDisplay token={firstInput} sign="+" hidden={hiddenBalance} />
          )}
          <TouchableOpacity
            style={styles.expandBadge}
            onPress={() => setExpanded(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.expandText}>
              {expanded ? 'Show less' : `+${hiddenCount} more`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={colors.accent.primary}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Type-specific amount rendering
    const showOutputs = type !== 'receive';
    const showInputs = type !== 'send';

    return (
      <View style={styles.amountsContainer}>
        {showOutputs && renderTokenAmounts(outputs, '-')}
        {showInputs && renderTokenAmounts(inputs, '+')}
      </View>
    );
  };

  return (
    <BlurContainer style={[styles.blurWrapper, style]}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${config.label} transaction, ${descriptionText}`}
        accessibilityHint={isSwap ? 'Tap to expand route details, long press for full details' : 'Long press for full details'}
      >
        {/* Left: Logo/Icon */}
        <View style={styles.logoSection}>
          {renderLogo()}
        </View>

        {/* Center: Type and description */}
        <View style={styles.infoSection}>
          <View style={styles.typeRow}>
            <Text style={styles.typeText} numberOfLines={1}>
              {config.label}
            </Text>
            {source && <SourceBadge source={source} />}
          </View>
          <Text style={styles.descriptionText} numberOfLines={1}>
            {descriptionText}
          </Text>
        </View>

        {/* Right: Amounts and time */}
        <View style={styles.rightSection}>
          {renderAmounts()}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              {formatRelativeTimeCompact(timestamp, t)}
            </Text>
            {isSwap && (
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.text.tertiary}
                style={styles.expandChevron}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expandable route visualization for swaps */}
      {type === 'swap' && (
        <SwapRouteVisualization
          transaction={transaction}
          expanded={expanded}
        />
      )}
    </BlurContainer>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  blurWrapper: {
    borderRadius: borderRadius.lg,
    marginBottom: vs(12),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(18),
    paddingHorizontal: s(18),
  },
  logoSection: {
    marginRight: s(12),
  },
  swapLogosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 54,
    position: 'relative',
  },
  swapLogoOverlap: {
    marginLeft: -14,
    borderWidth: 2,
    borderColor: colors.background.secondary,
    borderRadius: 18,
  },
  logoWithBadgeContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  typeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  typeBadgeSingle: {
    top: -2,
    right: -2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(4),
  },
  typeText: {
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  sourceBadge: {
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: s(8),
  },
  amountsContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
    marginBottom: vs(2),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  timeText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.tertiary,
  },
  expandChevron: {
    marginLeft: s(4),
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  failedText: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
    color: colors.status.error,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    backgroundColor: `${colors.status.warning}15`,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.status.warning,
  },
  expandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
    marginTop: vs(4),
  },
  expandText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.medium,
    color: colors.accent.primary,
  },
});

export default TransactionItem;
