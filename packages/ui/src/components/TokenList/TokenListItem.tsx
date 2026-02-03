import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
  colors,
} from '@salmon/shared';
import type { TokenListItemProps } from './types';

/**
 * Default placeholder image for tokens without a logo
 */
const DEFAULT_TOKEN_LOGO =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

/**
 * Arrow indicator component for price changes
 */
const ChangeArrow: React.FC<{ isPositive: boolean }> = ({ isPositive }) => (
  <Text
    style={[
      styles.changeArrow,
      { color: isPositive ? colors.change.positive : colors.change.negative },
    ]}
  >
    {isPositive ? '\u25B2' : '\u25BC'}
  </Text>
);

/**
 * Individual token item component for the TokenList
 *
 * Displays token logo, name, price with change indicator, USD holdings, and token amount.
 *
 * Layout varies by blockchain:
 * - Solana/Ethereum: Full layout with token name, price, and detailed info
 * - Bitcoin: Simplified layout showing only total USD value and BTC amount
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
 *   blockchain="solana"
 * />
 * ```
 */
const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  onPress,
  hiddenBalance = false,
  blockchain = 'solana',
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
  const isPositiveChange = percentageChange >= 0;

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

  const displayTokenAmount = hiddenBalance ? hiddenValue : `${uiAmount} ${symbol || ''}`;

  // Bitcoin has a different, simplified layout
  if (blockchain === 'bitcoin') {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${name} token, balance ${uiAmount} ${symbol}`}
      >
        {/* Token Logo - slightly smaller for Bitcoin */}
        <Image
          source={{ uri: logo || DEFAULT_TOKEN_LOGO }}
          style={styles.logoBitcoin}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />

        {/* Bitcoin Info - USD total with change */}
        <View style={styles.bitcoinInfoContainer}>
          {displayUsdValue && (
            <Text style={styles.bitcoinUsdValue} numberOfLines={1}>
              {displayUsdValue}
            </Text>
          )}
          <View style={styles.bitcoinChangeRow}>
            {displayPercentage && (
              <>
                <ChangeArrow isPositive={isPositiveChange} />
                <Text style={[styles.bitcoinChangeText, { color: changeColor }]} numberOfLines={1}>
                  {displayPercentage}
                  {displayAbsChange && ` (${displayAbsChange})`}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Bitcoin Amount - Right Side */}
        <View style={styles.bitcoinAmountContainer}>
          <Text style={styles.bitcoinAmount} numberOfLines={1}>
            {displayTokenAmount}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Solana/Ethereum layout
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
              <ChangeArrow isPositive={isPositiveChange} />
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
  // Common container styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background.tokenItem,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 10,
    marginHorizontal: 24,
    gap: 16,
  },

  // Solana/Ethereum styles
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.token,
    flexShrink: 1,
    lineHeight: 25,
    letterSpacing: -0.09,
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
    gap: 3,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.tokenPrice,
    letterSpacing: -0.09,
  },
  changeArrow: {
    fontSize: 12,
    marginLeft: 4,
  },
  changeText: {
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: -0.08,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  usdValue: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.text.token,
    letterSpacing: -0.12,
    lineHeight: 28,
  },
  tokenAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },

  // Bitcoin-specific styles
  logoBitcoin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
  },
  bitcoinInfoContainer: {
    flex: 1,
  },
  bitcoinUsdValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.036,
    lineHeight: 31,
  },
  bitcoinChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bitcoinChangeText: {
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: -0.08,
  },
  bitcoinAmountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bitcoinAmount: {
    fontSize: 25,
    fontWeight: '600',
    color: colors.text.tokenPrice,
    letterSpacing: -0.13,
  },
});

export default TokenListItem;
