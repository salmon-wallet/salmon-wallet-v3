import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  getLabelValue,
  gradients,
  hiddenValue,
  ms,
  s,
  showAbsoluteChange,
  showAmount,
  showPercentage,
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
 * All icons now have normalized viewBox dimensions (~43x57) for consistent visual size
 */
const renderBlockchainLogo = (blockchain: BlockchainId) => {
  const iconSize = s(55);
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
              size={ms(15)}
              color="rgba(255,255,255,0.7)"
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
          <Ionicons name="eye" size={ms(15)} color="rgba(255,255,255,0.7)" />
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
          name={isPositive ? 'arrow-up' : 'arrow-down'}
          size={ms(15)}
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
    borderRadius: ms(26),
    overflow: 'hidden',
  },
  container: {
    borderRadius: ms(26),
    paddingTop: vs(24),
    paddingHorizontal: s(24),
    paddingBottom: vs(24),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(18),
    // Shadow: 0px 15px 25px rgba(0,0,0,1)
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 1,
        shadowRadius: 25,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  // Container for blockchain logos
  logoContainer: {
    width: s(65),
    height: vs(65),
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(12),
    // Shadow: 0px 2.987px 17.925px black
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Figma: 37.344px, SemiBold, tracking -0.1867 (node 1697:3531)
  balanceDollars: {
    fontSize: ms(37),
    fontWeight: '600',
    color: '#e0e0e0',
    letterSpacing: -0.19,
  },
  balanceDecimals: {
    opacity: 0.4,
    color: '#ffffff',
  },
  eyeButton: {
    padding: s(4),
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow on change text
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  changeText: {
    fontSize: ms(13),
    fontWeight: '500',
    letterSpacing: 0.13,
    lineHeight: ms(13 * 1.3),
  },
  trendingIcon: {
    marginHorizontal: s(2),
  },
  changeHidden: {
    fontSize: ms(13),
    color: colors.text.muted,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(16),
  },
  paginationDot: {
    width: s(4),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: colors.step.inactive,
    marginHorizontal: s(3),
  },
  paginationDotActive: {
    backgroundColor: colors.text.primary,
  },
});

export default BalanceCard;
