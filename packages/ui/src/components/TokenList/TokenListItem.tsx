import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  showAmount,
  showPercentage,
  getLabelValue,
  hiddenValue,
  type LabelType,
} from '@salmon/shared';
import type { TokenListItemProps } from './types';

/**
 * Color mapping for percentage change labels
 */
const LABEL_COLORS: Record<LabelType, string> = {
  positive: '#00C853',
  negative: '#FF5252',
  neutral: '#9E9E9E',
};

/**
 * Default placeholder image for tokens without a logo
 */
const DEFAULT_TOKEN_LOGO = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

/**
 * Individual token item component for the TokenList
 *
 * Displays token logo, name, symbol, balance, USD value, and 24h change.
 *
 * @example
 * ```tsx
 * <TokenListItem
 *   token={{
 *     address: 'So11111111111111111111111111111111111111112',
 *     name: 'Solana',
 *     symbol: 'SOL',
 *     logo: 'https://...',
 *     uiAmount: '10.5',
 *     usdBalance: 1050.00,
 *     last24HoursChange: { perc: 5.2 }
 *   }}
 *   onPress={(token) => console.log(token)}
 *   hiddenBalance={false}
 * />
 * ```
 */
const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  onPress,
  hiddenBalance = false,
}) => {
  const { name, symbol, logo, uiAmount, usdBalance, last24HoursChange } = token;

  const handlePress = React.useCallback(() => {
    onPress(token);
  }, [onPress, token]);

  // Get the label type for coloring the percentage
  const percentageChange = last24HoursChange?.perc ?? 0;
  const labelType = getLabelValue(percentageChange);
  const percentageColor = LABEL_COLORS[labelType];

  // Format display values
  const displayBalance = hiddenBalance ? hiddenValue : `${uiAmount} ${symbol || ''}`;
  const displayUsdValue = hiddenBalance
    ? hiddenValue
    : usdBalance != null
    ? showAmount(usdBalance)
    : null;
  const displayPercentage = last24HoursChange ? showPercentage(percentageChange) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${name} token, balance ${uiAmount} ${symbol}`}
    >
      {/* Token Logo */}
      <Image
        source={{ uri: logo || DEFAULT_TOKEN_LOGO }}
        style={styles.logo}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      {/* Token Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.balance} numberOfLines={1} ellipsizeMode="tail">
          {displayBalance}
        </Text>
      </View>

      {/* Value Info */}
      <View style={styles.valueContainer}>
        {displayUsdValue && (
          <Text style={styles.usdValue} numberOfLines={1}>
            {displayUsdValue}
          </Text>
        )}
        {displayPercentage && (
          <Text style={[styles.percentage, { color: percentageColor }]} numberOfLines={1}>
            {displayPercentage}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balance: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  valueContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  usdValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TokenListItem;
