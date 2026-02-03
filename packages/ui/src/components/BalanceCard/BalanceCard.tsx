import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
  colors,
  gradients,
  borderRadius,
  borderWidth,
} from '@salmon/shared';
import type { BalanceCardProps, BlockchainId } from './types';
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon/SvgIcons';

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
 * Render the blockchain logo using local SVG icons
 */
const renderBlockchainLogo = (blockchain: BlockchainId, size: number = 42) => {
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon size={size} color="#FFFFFF" />;
    case 'bitcoin':
      return <BitcoinSvgIcon size={size} color="#FFFFFF" />;
    case 'ethereum':
      return <EthereumSvgIcon size={size} color="#FFFFFF" />;
    default:
      return <SolanaSvgIcon size={size} color="#FFFFFF" />;
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

  // Get gradient for current blockchain
  const gradient = getGradientForBlockchain(blockchain);

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
              size={20}
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
          <Ionicons name="eye" size={20} color="rgba(255,255,255,0.7)" />
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
          size={16}
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
      {/* Blockchain Logo */}
      <View style={styles.logoContainer}>
        {renderBlockchainLogo(blockchain, 42)}
      </View>

      {/* Balance display */}
      <View style={styles.balanceContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.text.primary}
            style={styles.loader}
          />
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
  container: {
    borderRadius: borderRadius.header, // 35px
    padding: 24,
    marginHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
    // Bottom border
    borderBottomWidth: borderWidth.header, // 1.38px
    borderBottomColor: colors.border.light, // rgba(255, 255, 255, 0.8)
  },
  logoContainer: {
    width: 42,
    height: 42,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceDollars: {
    fontSize: 50,
    fontWeight: '600',
    color: '#e0e0e0',
    letterSpacing: -0.25,
  },
  balanceDecimals: {
    opacity: 0.4,
    color: '#ffffff',
  },
  eyeButton: {
    marginLeft: 12,
    padding: 4,
  },
  loader: {
    height: 50,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  trendingIcon: {
    marginHorizontal: 4,
  },
  changeHidden: {
    fontSize: 16,
    color: colors.text.muted,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.step.inactive,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.text.primary,
  },
});

export default BalanceCard;
