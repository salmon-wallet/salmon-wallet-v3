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
import { GlassContainer, isNativeLiquidGlassAvailable } from '../GlassContainer';
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
      <GlassContainer
        style={styles.glassWrapper}
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
      </GlassContainer>
    );
  }

  // Solana/Ethereum layout
  return (
    <GlassContainer
      style={styles.glassWrapper}
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
  // Figma: border-radius 12.391px, border 0.747px #404962
  glassWrapper: {
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  // Common container styles
  // Figma: padding-h 11.95px, gap 11.95px
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },

  // Solana/Ethereum styles
  // Figma: logo 35.85px, border-radius 21.838px
  logo: {
    width: 36,
    height: 36,
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
  // Figma: 13.65px Medium, color #d6d6d6, tracking -0.0682px, line-height 1.4
  name: {
    fontSize: 14,
    fontFamily: 'DMSansMedium',
    color: colors.text.token,
    flexShrink: 1,
    lineHeight: 20,
    letterSpacing: -0.07,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.verified.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  verifiedIcon: {
    fontSize: 8,
    color: colors.verified.icon,
    fontWeight: '700',
  },
  // Figma: gap 2.275px
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // Figma: 13.65px SemiBold, color rgba(255,255,255,0.79), tracking -0.0682px
  price: {
    fontSize: 14,
    fontFamily: 'DMSansSemiBold',
    color: colors.text.tokenPrice,
    letterSpacing: -0.07,
  },
  // Figma: arrow 13.65px
  changeArrow: {
    fontSize: 14,
  },
  // Figma: 11.375px Light, tracking -0.0569px
  changeText: {
    fontSize: 11,
    fontFamily: 'DMSansLight',
    letterSpacing: -0.06,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  // Figma: 17.925px Medium, color #d6d6d6, tracking -0.0896px
  usdValue: {
    fontSize: 18,
    fontFamily: 'DMSansMedium',
    color: colors.text.token,
    letterSpacing: -0.09,
  },
  // Figma: 11.95px Medium, color #ffffff
  tokenAmount: {
    fontSize: 12,
    fontFamily: 'DMSansMedium',
    color: colors.text.primary,
  },

  // Bitcoin-specific styles (scaled proportionally)
  logoBitcoin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
  },
  bitcoinInfoContainer: {
    flex: 1,
  },
  bitcoinUsdValue: {
    fontSize: 18,
    fontFamily: 'DMSansBold',
    color: colors.text.token,
    letterSpacing: -0.09,
  },
  bitcoinChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bitcoinChangeText: {
    fontSize: 11,
    fontFamily: 'DMSansLight',
    letterSpacing: -0.06,
  },
  bitcoinAmountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bitcoinAmount: {
    fontSize: 18,
    fontFamily: 'DMSansSemiBold',
    color: colors.text.tokenPrice,
    letterSpacing: -0.09,
  },
});

export default TokenListItem;
