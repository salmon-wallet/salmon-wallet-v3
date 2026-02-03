/**
 * TokenListItem - Individual token row component
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  fontWeight,
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
  type LabelType,
  type Token,
} from '@salmon/shared';
import { ChevronRightIcon } from '../Icon';
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
const DEFAULT_TOKEN_LOGO =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: borderRadius.lg,
  marginBottom: spacing.sm,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TokenLogo = styled('img')({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  objectFit: 'cover',
});

const TokenLogoPlaceholder = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  color: colors.text.secondary,
});

const InfoContainer = styled(Box)({
  flex: 1,
  marginLeft: spacing.md,
  minWidth: 0, // Allow text truncation
});

const TokenName = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing['2xs'],
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const PriceRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const Price = styled(Typography)({
  fontSize: 14,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: 'rgba(255, 255, 255, 0.7)',
});

const BulletSeparator = styled(Typography)({
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.5)',
  padding: '0 4px',
});

const ChangeText = styled(Typography)<{ changeColor?: string }>(({ changeColor }) => ({
  fontSize: 14,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: changeColor || '#9E9E9E',
}));

const ValueContainer = styled(Box)({
  alignItems: 'flex-end',
  marginLeft: spacing.sm,
  textAlign: 'right',
});

const UsdValue = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing['2xs'],
});

const TokenAmount = styled(Typography)({
  fontSize: 14,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: 'rgba(255, 255, 255, 0.7)',
});

/**
 * Individual token item component for the TokenList
 *
 * Displays token logo, name, price with change indicator, USD holdings, and token amount.
 *
 * Layout (per Figma design):
 * - Token icon (48px circle)
 * - Left side: Token name, Price per token with change indicator
 * - Right side: USD value of holdings, Token amount
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
export function TokenListItem({
  token,
  onPress,
  hiddenBalance = false,
  style,
  className,
}: TokenListItemProps) {
  const { name, symbol, logo, price, uiAmount, usdBalance, last24HoursChange } = token;

  const handlePress = useCallback(() => {
    onPress(token);
  }, [onPress, token]);

  // Get the label type for coloring the percentage and absolute change
  const percentageChange = last24HoursChange?.perc ?? 0;
  const absoluteChange = last24HoursChange?.abs;
  const labelType = getLabelValue(percentageChange);
  const changeColor = LABEL_COLORS[labelType];

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

  return (
    <Container
      onClick={handlePress}
      style={style}
      className={className}
      role="button"
      aria-label={`${name} token, balance ${uiAmount} ${symbol}`}
    >
      {/* Token Logo */}
      {logo ? (
        <TokenLogo src={logo} alt={name} onError={(e) => {
          // Fallback to default on error
          (e.target as HTMLImageElement).src = DEFAULT_TOKEN_LOGO;
        }} />
      ) : (
        <TokenLogoPlaceholder>{symbol?.[0] || '?'}</TokenLogoPlaceholder>
      )}

      {/* Token Info - Left Side */}
      <InfoContainer>
        <TokenName>{name}</TokenName>
        <PriceRow>
          {displayPrice && <Price>{displayPrice}</Price>}
          {displayPercentage && (
            <>
              <BulletSeparator>{'\u2022'}</BulletSeparator>
              <ChangeText changeColor={changeColor}>
                {displayPercentage}
                {displayAbsChange && ` (${displayAbsChange})`}
              </ChangeText>
            </>
          )}
        </PriceRow>
      </InfoContainer>

      {/* Value Info - Right Side */}
      <ValueContainer>
        {displayUsdValue && <UsdValue>{displayUsdValue}</UsdValue>}
        <TokenAmount>{displayTokenAmount}</TokenAmount>
      </ValueContainer>

      {/* Chevron */}
      <ChevronRightIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 20, marginLeft: 1 }} />
    </Container>
  );
}

export default TokenListItem;
