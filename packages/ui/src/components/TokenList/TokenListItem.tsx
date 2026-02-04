import {
  colors,
  getLabelValue,
  hiddenValue,
  ms,
  s,
  showAbsoluteChange,
  showAmount,
  showPercentage,
  vs,
} from '@salmon/shared';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from '../GlassContainer';
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
  style,
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

  // Bitcoin has a different layout showing price, change, and BTC amount
  if (blockchain === 'bitcoin') {
    return (
      <GlassContainer
        style={[styles.glassWrapper, style]}
        fallbackBackgroundColor={colors.background.tokenItem}
        fallbackBorderColor={colors.border.default}
        fallbackBorderWidth={1}
        fallbackBlurIntensity={2}
      >
        <TouchableOpacity
          style={styles.bitcoinContainer}
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${name} token, price ${price}, balance ${uiAmount} ${symbol}`}
        >
          {/* Token Logo */}
          <Image
            source={{ uri: logo || DEFAULT_TOKEN_LOGO }}
            style={styles.logoBitcoin}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          {/* Bitcoin Info - Price and percentage change */}
          <View style={styles.bitcoinInfoContainer}>
            {displayPrice && (
              <Text style={styles.bitcoinPrice} numberOfLines={1}>
                {displayPrice}
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
      </GlassContainer>
    );
  }

  // Solana/Ethereum layout
  return (
    <GlassContainer
      style={[styles.glassWrapper, style]}
      fallbackBackgroundColor={colors.background.tokenItem}
      fallbackBorderColor={colors.border.default}
      fallbackBorderWidth={1}
      fallbackBlurIntensity={2}
    >
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
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  // Glass wrapper for iOS 26+ Liquid Glass effect
  glassWrapper: {
    borderRadius: 12,
    marginBottom: vs(8),
    marginHorizontal: s(24),
    overflow: 'hidden',
  },
  // Common container styles
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: s(12),
  },

  // Solana/Ethereum styles
  logo: {
    width: s(36),
    height: vs(36),
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: ms(14),
    fontFamily: 'DMSansMedium',
    color: colors.text.token,
    flexShrink: 1,
    lineHeight: vs(20),
    letterSpacing: ms(-0.07, 0.3),
  },
  verifiedBadge: {
    width: s(14),
    height: vs(14),
    borderRadius: 7,
    backgroundColor: colors.verified.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(4),
  },
  verifiedIcon: {
    fontSize: ms(8),
    color: colors.verified.icon,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
  },
  price: {
    fontSize: ms(14),
    fontFamily: 'DMSansSemiBold',
    color: colors.text.tokenPrice,
    letterSpacing: ms(-0.07, 0.3),
  },
  changeArrow: {
    fontSize: ms(14),
  },
  changeText: {
    fontSize: ms(11),
    fontFamily: 'DMSansLight',
    letterSpacing: ms(-0.06, 0.3),
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  usdValue: {
    fontSize: ms(18),
    fontFamily: 'DMSansMedium',
    color: colors.text.token,
    letterSpacing: ms(-0.09, 0.3),
  },
  tokenAmount: {
    fontSize: ms(12),
    fontFamily: 'DMSansMedium',
    color: colors.text.primary,
  },

  // Bitcoin-specific styles (based on Figma specs)
  bitcoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: s(12),
  },
  logoBitcoin: {
    width: s(33),
    height: vs(33),
    borderRadius: 16.5,
    backgroundColor: colors.background.tertiary,
  },
  bitcoinInfoContainer: {
    flex: 1,
    gap: vs(2),
  },
  bitcoinPrice: {
    fontSize: ms(18),
    fontFamily: 'DMSansBold',
    color: '#FFFFFF',
    letterSpacing: ms(-0.09, 0.3),
  },
  bitcoinChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
  },
  bitcoinChangeText: {
    fontSize: ms(11),
    fontFamily: 'DMSansLight',
    letterSpacing: ms(-0.06, 0.3),
  },
  bitcoinAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bitcoinAmount: {
    fontSize: ms(19),
    fontFamily: 'DMSansSemiBold',
    color: 'rgba(255, 255, 255, 0.79)',
    letterSpacing: ms(-0.095, 0.3),
  },
});

export default TokenListItem;
