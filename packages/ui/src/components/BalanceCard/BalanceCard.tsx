import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
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
} from '@salmon/shared';
import type { BalanceCardProps } from './types';

/**
 * Default network logos
 */
const NETWORK_LOGOS: Record<string, string> = {
  'mainnet-beta': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'devnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'testnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
};

/**
 * BalanceCard component for displaying total portfolio balance
 *
 * Features:
 * - Network logo and name
 * - Total balance in USD
 * - Eye icon to toggle visibility
 * - 24h percentage and absolute change
 * - Purple/cosmic gradient background
 * - Pagination dots for future multi-network carousel
 *
 * @example
 * ```tsx
 * <BalanceCard
 *   network={{ id: 'mainnet-beta', name: 'Solana Mainnet' }}
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
  usdTotal,
  changePercent = 0,
  changeAmount = 0,
  hiddenBalance = false,
  onToggleVisibility,
  onNetworkPress,
  currentIndex = 0,
  totalCount = 1,
  loading = false,
  style,
}) => {
  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility?.();
  }, [onToggleVisibility]);

  const handleNetworkPress = useCallback(() => {
    onNetworkPress?.();
  }, [onNetworkPress]);

  // Determine the label type for coloring
  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];

  // Get network logo
  const networkLogo = network.logo || NETWORK_LOGOS[network.id] || NETWORK_LOGOS['mainnet-beta'];

  // Format display values
  const displayBalance = hiddenBalance ? hiddenValue : showAmount(usdTotal);
  const displayPercentage = showPercentage(changePercent);
  const displayAbsChange = showAbsoluteChange(changeAmount);

  return (
    <LinearGradient
      colors={gradients.balanceCard.colors}
      start={gradients.balanceCard.start}
      end={gradients.balanceCard.end}
      style={[styles.container, style]}
    >
      {/* Network selector */}
      <TouchableOpacity
        style={styles.networkContainer}
        onPress={handleNetworkPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Current network: ${network.name}`}
      >
        <Image
          source={{ uri: networkLogo }}
          style={styles.networkLogo}
          resizeMode="cover"
        />
        <Text style={styles.networkName}>{network.name}</Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.text.muted}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {/* Balance display */}
      <View style={styles.balanceContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text.primary} style={styles.loader} />
        ) : (
          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
            {displayBalance}
          </Text>
        )}

        {/* Visibility toggle */}
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={handleToggleVisibility}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={hiddenBalance ? 'Show balance' : 'Hide balance'}
        >
          <Ionicons
            name={hiddenBalance ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.text.muted}
          />
        </TouchableOpacity>
      </View>

      {/* 24h change */}
      {!loading && (
        <View style={styles.changeContainer}>
          {hiddenBalance ? (
            <Text style={styles.changeHidden}>{hiddenValue}</Text>
          ) : (
            <>
              <Text style={[styles.changePercent, { color: changeColor }]}>
                {displayPercentage}
              </Text>
              {displayAbsChange && (
                <Text style={[styles.changeAbsolute, { color: changeColor }]}>
                  {' '}({displayAbsChange})
                </Text>
              )}
            </>
          )}
        </View>
      )}

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
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
  },
  networkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  networkLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  chevron: {
    marginLeft: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balance: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  loader: {
    flex: 1,
    alignSelf: 'flex-start',
  },
  visibilityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '500',
  },
  changeAbsolute: {
    fontSize: 14,
    fontWeight: '400',
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
