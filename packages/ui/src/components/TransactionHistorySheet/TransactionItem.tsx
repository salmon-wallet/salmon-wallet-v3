import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ms, vs, s, spacing, fontSize, borderRadius } from '@salmon/shared';
import type { TransactionItemProps, TransactionType, TransactionTokenAmount } from './types';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

const HIDDEN_VALUE = '****';

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
// Helper Functions
// ============================================================================

/**
 * Format a raw amount with decimals
 */
function formatAmount(amount: string | number, decimals: number): string {
  const rawAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(rawAmount)) return '0';

  const formattedAmount = rawAmount / Math.pow(10, decimals);

  // Show up to 6 decimal places, but trim trailing zeros
  if (formattedAmount === 0) return '0';
  if (formattedAmount < 0.000001) return '<0.000001';
  if (formattedAmount >= 1000000) return `${(formattedAmount / 1000000).toFixed(2)}M`;
  if (formattedAmount >= 1000) return `${(formattedAmount / 1000).toFixed(2)}K`;
  if (formattedAmount >= 1) return formattedAmount.toFixed(4).replace(/\.?0+$/, '');

  // For small amounts, show more precision
  return formattedAmount.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Format a timestamp to relative time or date string
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  // Less than 1 minute ago
  if (diff < 60) return 'Just now';
  // Less than 1 hour ago
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  // Less than 24 hours ago
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  // Less than 7 days ago
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  // Show full date for older transactions
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncate an address for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Get description text for a transaction
 */
function getDescription(
  type: TransactionType,
  inputs: TransactionTokenAmount[],
  outputs: TransactionTokenAmount[],
  description?: string
): string {
  // Use Helius description if available and meaningful
  if (description && description.length > 0 && !description.includes('Unknown')) {
    return description;
  }

  switch (type) {
    case 'send':
      if (outputs[0]?.destination) {
        return `To ${truncateAddress(outputs[0].destination)}`;
      }
      return 'Sent tokens';
    case 'receive':
      if (inputs[0]?.source) {
        return `From ${truncateAddress(inputs[0].source)}`;
      }
      return 'Received tokens';
    case 'swap':
      if (outputs[0]?.symbol && inputs[0]?.symbol) {
        return `${outputs[0].symbol} to ${inputs[0].symbol}`;
      }
      return 'Token swap';
    case 'mint':
      return 'Token minted';
    case 'burn':
      return 'Token burned';
    case 'stake':
      return 'Staking operation';
    case 'loan':
      return 'Loan operation';
    case 'interaction':
      return 'Contract interaction';
    default:
      return 'Transaction';
  }
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Token logo component with fallback
 */
const TokenLogo: React.FC<{ uri?: string | null; size?: number }> = ({
  uri,
  size = 32,
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.tokenLogo, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.tokenLogoPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="help-circle-outline" size={size * 0.6} color={colors.text.secondary} />
    </View>
  );
};

/**
 * Swap tokens visualization (two overlapping logos)
 */
const SwapTokenLogos: React.FC<{
  fromLogo?: string | null;
  toLogo?: string | null;
}> = ({ fromLogo, toLogo }) => {
  return (
    <View style={styles.swapLogosContainer}>
      <TokenLogo uri={fromLogo} size={28} />
      <View style={styles.swapLogoOverlap}>
        <TokenLogo uri={toLogo} size={28} />
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
    : `${sign} ${formatAmount(token.amount, token.decimals)} ${token.symbol}`;

  const color = sign === '+' ? colors.change.positive : colors.change.negative;

  return (
    <Text style={[styles.amountText, { color }]} numberOfLines={1}>
      {displayAmount}
    </Text>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransactionItem - Individual transaction row for the transaction list
 *
 * Displays:
 * - Transaction type icon
 * - Transaction type label and description
 * - Time since transaction
 * - Token amounts (inputs/outputs)
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
  hiddenBalance = false,
  style,
}) => {
  const { type, timestamp, status, inputs, outputs, description } = transaction;
  const config = TRANSACTION_TYPE_CONFIG[type] || TRANSACTION_TYPE_CONFIG.unknown;

  const handlePress = useCallback(() => {
    onPress?.(transaction);
  }, [onPress, transaction]);

  // Get description text
  const descriptionText = getDescription(type, inputs, outputs, description);

  // Determine which logo(s) to show
  const renderLogo = () => {
    if (type === 'swap' && inputs[0]?.logo && outputs[0]?.logo) {
      return <SwapTokenLogos fromLogo={outputs[0].logo} toLogo={inputs[0].logo} />;
    }

    // For other types, show the primary token logo
    const primaryToken = type === 'receive' ? inputs[0] : outputs[0];
    if (primaryToken?.logo) {
      return <TokenLogo uri={primaryToken.logo} />;
    }

    // Fallback to type icon
    return (
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
    );
  };

  // Render amount changes
  const renderAmounts = () => {
    if (status === 'failed') {
      return (
        <View style={styles.failedBadge}>
          <Ionicons name="close-circle" size={14} color={colors.status.error} />
          <Text style={styles.failedText}>Failed</Text>
        </View>
      );
    }

    // For swaps, show both output (negative) and input (positive)
    if (type === 'swap') {
      return (
        <View style={styles.amountsContainer}>
          {outputs.map((output, i) => (
            <AmountDisplay key={`out-${i}`} token={output} sign="-" hidden={hiddenBalance} />
          ))}
          {inputs.map((input, i) => (
            <AmountDisplay key={`in-${i}`} token={input} sign="+" hidden={hiddenBalance} />
          ))}
        </View>
      );
    }

    // For sends, show outputs as negative
    if (type === 'send') {
      return (
        <View style={styles.amountsContainer}>
          {outputs.map((output, i) => (
            <AmountDisplay key={`out-${i}`} token={output} sign="-" hidden={hiddenBalance} />
          ))}
        </View>
      );
    }

    // For receives, show inputs as positive
    if (type === 'receive') {
      return (
        <View style={styles.amountsContainer}>
          {inputs.map((input, i) => (
            <AmountDisplay key={`in-${i}`} token={input} sign="+" hidden={hiddenBalance} />
          ))}
        </View>
      );
    }

    // For other types, show any amounts available
    return (
      <View style={styles.amountsContainer}>
        {outputs.map((output, i) => (
          <AmountDisplay key={`out-${i}`} token={output} sign="-" hidden={hiddenBalance} />
        ))}
        {inputs.map((input, i) => (
          <AmountDisplay key={`in-${i}`} token={input} sign="+" hidden={hiddenBalance} />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${config.label} transaction, ${descriptionText}`}
    >
      {/* Left: Logo/Icon */}
      <View style={styles.logoSection}>
        {renderLogo()}
      </View>

      {/* Center: Type and description */}
      <View style={styles.infoSection}>
        <Text style={styles.typeText} numberOfLines={1}>
          {config.label}
        </Text>
        <Text style={styles.descriptionText} numberOfLines={1}>
          {descriptionText}
        </Text>
      </View>

      {/* Right: Amounts and time */}
      <View style={styles.rightSection}>
        {renderAmounts()}
        <Text style={styles.timeText}>
          {formatTimestamp(timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    backgroundColor: colors.background.tokenItem,
    borderRadius: borderRadius.md,
    marginBottom: vs(8),
  },
  logoSection: {
    marginRight: s(12),
  },
  tokenLogo: {
    backgroundColor: colors.background.card,
  },
  tokenLogoPlaceholder: {
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapLogosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
  },
  swapLogoOverlap: {
    marginLeft: -12,
    borderWidth: 2,
    borderColor: colors.background.secondary,
    borderRadius: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: ms(fontSize.md),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
    marginBottom: vs(2),
  },
  descriptionText: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.regular,
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
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    marginBottom: vs(1),
  },
  timeText: {
    fontSize: ms(fontSize.xs),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.tertiary,
    marginTop: vs(2),
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  failedText: {
    fontSize: ms(fontSize.sm),
    fontFamily: FONT_FAMILY.medium,
    color: colors.status.error,
  },
});

export default TransactionItem;
