import { Ionicons } from '@expo/vector-icons';
import {
  borderRadius,
  colors,
  componentSizes,
  fontSize,
  getLabelValue,
  gradients,
  hiddenValue,
  letterSpacing,
  ms,
  s,
  shadows,
  showAbsoluteChange,
  showAmount,
  showPercentage,
  spacing,
  vs,
} from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BitcoinSvgIcon, EthereumSvgIcon, SolanaSvgIcon } from '../Icon/SvgIcons';
import { ScalesBackground } from '../ScalesBackground';
import { BalanceCardSkeleton } from './BalanceCardSkeleton';
import type { BalanceCardProps, BlockchainId } from './types';

/**
 * Get gradient configuration for a blockchain
 */
const getGradientForBlockchain = (blockchain: BlockchainId) => {
  switch (blockchain) {
    case 'bitcoin':
      return gradients.balanceCardBitcoin;
    case 'ethereum':
      return gradients.balanceCardEthereum;
    case 'solana':
    default:
      return gradients.balanceCardSolana;
  }
};

/**
 * Get ScalesBackground stroke color for a blockchain (15% opacity)
 */
const getScalesColorForBlockchain = (blockchain: BlockchainId): string => {
  switch (blockchain) {
    case 'bitcoin':
      return 'rgba(247, 147, 26, 0.15)';   // Bitcoin orange (#F7931A)
    case 'ethereum':
      return 'rgba(98, 126, 234, 0.15)';   // Ethereum blue (#627EEA)
    case 'solana':
    default:
      return 'rgba(153, 69, 255, 0.15)';   // Solana purple (#9945FF)
  }
};

/**
 * Render the blockchain logo using local SVG icons
 */
const renderBlockchainLogo = (blockchain: BlockchainId) => {
  const iconSize = s(componentSizes.blockchainIcon);
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon size={iconSize} color="#FFFFFF" />;
    case 'bitcoin':
      return <BitcoinSvgIcon size={iconSize} color="#FFFFFF" />;
    case 'ethereum':
      return <EthereumSvgIcon size={iconSize} color="#FFFFFF" />;
    default:
      return <SolanaSvgIcon size={iconSize} color="#FFFFFF" />;
  }
};

/**
 * BalanceCard component for displaying total portfolio balance
 *
 * Features:
 * - Large centered blockchain logo (42x38px)
 * - Centered balance with decimal opacity styling
 * - Inline eye icon for visibility toggle
 * - 24h percentage and absolute change with trending arrow
 * - Blockchain-specific gradient background
 * - Pagination dots for multi-network carousel
 *
 * @example
 * ```tsx
 * <BalanceCard
 *   network={{ id: 'mainnet-beta', name: 'Solana Mainnet' }}
 *   blockchain="solana"
 *   usdTotal={1234.56}
 *   changePercent={5.23}
 *   changeAmount={61.45}
 *   hiddenBalance={false}
 *   onToggleVisibility={() => setHidden(!hidden)}
 * />
 * ```
 */
export const BalanceCard: React.FC<BalanceCardProps> = ({
  network,
  blockchain = 'solana',
  usdTotal,
  changePercent = 0,
  changeAmount = 0,
  hiddenBalance = false,
  onToggleVisibility,
  currentIndex = 0,
  totalCount = 1,
  loading = false,
  style,
}) => {
  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility?.();
  }, [onToggleVisibility]);

  // Determine the label type for coloring
  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];


  // Format display values
  const displayPercentage = showPercentage(changePercent);
  const displayAbsChange = showAbsoluteChange(changeAmount);

  // Get gradient and scales color for current blockchain
  const gradient = getGradientForBlockchain(blockchain);
  const scalesColor = getScalesColorForBlockchain(blockchain);

  // Determine if change is positive
  const isPositive = changePercent >= 0;

  /**
   * Render balance with decimal opacity styling
   * Format: $1,177.90 where .90 has 40% opacity
   */
  const renderBalance = () => {
    if (hiddenBalance) {
      return (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceDollars}>{hiddenValue}</Text>
          <TouchableOpacity
            onPress={handleToggleVisibility}
            style={styles.eyeButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Show balance"
          >
            <Ionicons
              name="eye-off"
              size={ms(componentSizes.eyeIcon)}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        </View>
      );
    }

    const formatted = showAmount(usdTotal);
    const parts = formatted.split('.');

    return (
      <View style={styles.balanceRow}>
        <Text style={styles.balanceDollars}>{parts[0]}</Text>
        {parts[1] && (
          <Text style={[styles.balanceDollars, styles.balanceDecimals]}>
            .{parts[1]}
          </Text>
        )}
        <TouchableOpacity
          onPress={handleToggleVisibility}
          style={styles.eyeButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Hide balance"
        >
          <Ionicons name="eye" size={ms(componentSizes.eyeIcon)} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render 24h change with trending arrow
   * Format: 3,2 % (arrow) (+$199.45)
   */
  const renderChange = () => {
    if (hiddenBalance) {
      return (
        <View style={styles.changeRow}>
          <Text style={styles.changeHidden}>{hiddenValue}</Text>
        </View>
      );
    }

    return (
      <View style={styles.changeRow}>
        <Text style={[styles.changeText, { color: changeColor }]}>
          {displayPercentage}
        </Text>
        <Ionicons
          name={isPositive ? 'chevron-up' : 'chevron-down'}
          size={ms(componentSizes.changeArrowIcon)}
          color={changeColor}
          style={styles.trendingIcon}
        />
        {displayAbsChange && (
          <Text style={[styles.changeText, { color: changeColor }]}>
            ({displayAbsChange})
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={gradient.colors}
      start={gradient.start}
      end={gradient.end}
      style={[styles.container, style]}
    >
      {/* Scales pattern overlay - color based on blockchain */}
      <ScalesBackground
        strokeColor={scalesColor}
        strokeWidth={1}
        patternHeight={26}
        style={styles.scalesOverlay}
      />
      {/* Blockchain Logo - Figma: 32x29px (node 1697:3529) */}
      <View style={styles.logoContainer}>
        {renderBlockchainLogo(blockchain)}
      </View>

      {/* Balance display */}
      <View style={styles.balanceContainer}>
        {loading ? (
          <BalanceCardSkeleton testID="balance-card-skeleton" />
        ) : (
          renderBalance()
        )}
      </View>

      {/* 24h change */}
      {!loading && renderChange()}

      {/* Pagination dots */}
      {totalCount > 1 && (
        <View style={styles.pagination}>
          {Array.from({ length: totalCount }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scalesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ms(borderRadius.card),
  },
  container: {
    borderRadius: ms(borderRadius.card),
    paddingTop: vs(spacing['2xl']),
    paddingHorizontal: s(spacing['2xl']),
    paddingBottom: vs(spacing['2xl']),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(spacing.sm),
    ...Platform.select({
      ios: {
        shadowColor: shadows.card.shadowColor,
        shadowOffset: shadows.card.shadowOffset,
        shadowOpacity: shadows.card.shadowOpacity,
        shadowRadius: shadows.card.shadowRadius,
      },
      android: {
        elevation: shadows.card.elevation,
      },
    }),
  },
  logoContainer: {
    width: s(componentSizes.logoContainer),
    height: vs(componentSizes.logoContainer),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: shadows.logo.shadowColor,
        shadowOffset: shadows.logo.shadowOffset,
        shadowOpacity: shadows.logo.shadowOpacity,
        shadowRadius: shadows.logo.shadowRadius,
      },
      android: {
        elevation: shadows.logo.elevation,
      },
    }),
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(spacing.md),
    ...Platform.select({
      ios: {
        shadowColor: shadows.balanceText.shadowColor,
        shadowOffset: shadows.balanceText.shadowOffset,
        shadowOpacity: shadows.balanceText.shadowOpacity,
        shadowRadius: shadows.balanceText.shadowRadius,
      },
      android: {
        elevation: shadows.balanceText.elevation,
      },
    }),
  },
  balanceDollars: {
    fontSize: ms(fontSize.balance),
    fontWeight: '600',
    color: colors.text.balance,
    letterSpacing: letterSpacing.balance,
  },
  balanceDecimals: {
    opacity: 0.4,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: s(spacing.xs),
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: shadows.balanceText.shadowColor,
        shadowOffset: shadows.balanceText.shadowOffset,
        shadowOpacity: shadows.balanceText.shadowOpacity,
        shadowRadius: shadows.balanceText.shadowRadius,
      },
      android: {
        elevation: shadows.balanceText.elevation,
      },
    }),
  },
  changeText: {
    fontSize: ms(fontSize.sm),
    fontWeight: '500',
    letterSpacing: letterSpacing.change,
    lineHeight: ms(fontSize.sm * 1.3),
  },
  trendingIcon: {
    marginHorizontal: s(spacing['2xs']),
  },
  changeHidden: {
    fontSize: ms(fontSize.sm),
    color: colors.text.muted,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(spacing.paginationGap),
  },
  paginationDot: {
    width: s(spacing.xs),
    height: s(spacing.xs),
    borderRadius: s(spacing['2xs']),
    backgroundColor: colors.step.inactive,
    marginHorizontal: s(spacing.xxs + 1),
  },
  paginationDotActive: {
    backgroundColor: colors.text.primary,
  },
});

export default BalanceCard;
