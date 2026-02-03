import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
  colors,
  type LabelType,
} from '@salmon/shared';
import type { TokenListItemProps } from './types';

/**
 * Default placeholder image for tokens without a logo
 */
const DEFAULT_TOKEN_LOGO = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

/**
 * Individual token item component for the TokenList
 *
 * Displays token logo, name, price with change indicator, USD holdings, and token amount.
 *
 * Layout (per Figma design):
 * - Token icon (48px circle)
 * - Left side: Token name, Price per token with change indicator (e.g., "$ 131.28 . 1.2% (+$10.01)")
 * - Right side: USD value of holdings, Token amount (e.g., "1.2 SOL")
 *
 * @example
 * ```tsx
 * <TokenListItem
 *   token={{
 *     address: 'So11111111111111111111111111111111111111112',
 *     name: 'Solana',
 *     symbol: 'SOL',
 *     logo: 'https://...',
 *     price: 131.28,
 *     uiAmount: '1.2',
 *     usdBalance: 155.20,
 *     last24HoursChange: { perc: 1.2, abs: 10.01 }
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
  const { name, symbol, logo, price, uiAmount, usdBalance, last24HoursChange, isVerified } = token;

  const handlePress = React.useCallback(() => {
    onPress(token);
  }, [onPress, token]);

  // Get the label type for coloring the percentage and absolute change
  const percentageChange = last24HoursChange?.perc ?? 0;
  const absoluteChange = last24HoursChange?.abs;
  const labelType = getLabelValue(percentageChange);
  const changeColor = colors.change[labelType];

  // Format display values
  const displayPrice = hiddenBalance
    ? hiddenValue
    : price != null
    ? showAmount(price)
    : null;

  const displayPercentage = last24HoursChange ? showPercentage(percentageChange) : null;
  const displayAbsChange = absoluteChange != null ? showAbsoluteChange(absoluteChange) : null;

  const displayUsdValue = hiddenBalance
    ? hiddenValue
    : usdBalance != null
    ? showAmount(usdBalance)
    : null;

  const displayTokenAmount = hiddenBalance
    ? hiddenValue
    : `${uiAmount} ${symbol || ''}`;

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

      {/* Token Info - Left Side */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>{'\u2713'}</Text>
            </View>
          )}
        </View>
        <View style={styles.priceRow}>
          {displayPrice && (
            <Text style={styles.price} numberOfLines={1}>
              {displayPrice}
            </Text>
          )}
          {displayPercentage && (
            <>
              <Text style={styles.bulletSeparator}> {'\u2022'} </Text>
              <Text style={[styles.changeText, { color: changeColor }]} numberOfLines={1}>
                {displayPercentage}
                {displayAbsChange && ` (${displayAbsChange})`}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Value Info - Right Side */}
      <View style={styles.valueContainer}>
        {displayUsdValue && (
          <Text style={styles.usdValue} numberOfLines={1}>
            {displayUsdValue}
          </Text>
        )}
        <Text style={styles.tokenAmount} numberOfLines={1}>
          {displayTokenAmount}
        </Text>
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
    backgroundColor: colors.background.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.verified.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    fontSize: 10,
    color: colors.verified.icon,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: colors.text.muted,
  },
  bulletSeparator: {
    fontSize: 14,
    color: colors.text.disabled,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  usdValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  tokenAmount: {
    fontSize: 14,
    color: colors.text.muted,
  },
});

export default TokenListItem;
