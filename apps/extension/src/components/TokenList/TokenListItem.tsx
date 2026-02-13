/**
 * TokenListItem - Individual token row component
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses responsive scaling (s, vs, ms) from shared to match mobile proportions.
 */
import { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontFamily,
  fontWeight,
  componentSizes,
  s,
  vs,
  ms,
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
} from '@salmon/shared';
import { ChevronRightIcon } from '../Icon';
import type { TokenListItemProps } from './types';

/**
 * Default placeholder image for tokens without a logo
 */
const DEFAULT_TOKEN_LOGO =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: `${vs(spacing.md)}px ${s(spacing.lg)}px`,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: ms(borderRadius.lg),
  marginBottom: vs(spacing.sm),
  cursor: 'pointer',
  gap: s(spacing.md),
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

const TokenLogo = styled('img')({
  width: s(componentSizes.tokenIcon),
  height: s(componentSizes.tokenIcon),
  borderRadius: ms(borderRadius.tokenIcon),
  backgroundColor: colors.background.tertiary,
  objectFit: 'cover',
  flexShrink: 0,
});

const TokenLogoPlaceholder = styled(Box)({
  width: s(componentSizes.tokenIcon),
  height: s(componentSizes.tokenIcon),
  borderRadius: ms(borderRadius.tokenIcon),
  backgroundColor: colors.background.tertiary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: ms(fontSize.base),
  color: colors.text.secondary,
  flexShrink: 0,
});

const InfoContainer = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const TokenName = styled(Typography)({
  fontSize: ms(fontSize.tokenNamePrice),
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: vs(spacing['2xs']),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const PriceRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: s(spacing['2xs']),
});

const Price = styled(Typography)({
  fontSize: ms(fontSize.tokenNamePrice),
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: 'rgba(255, 255, 255, 0.7)',
});

const BulletSeparator = styled(Typography)({
  fontSize: ms(fontSize.tokenNamePrice),
  color: 'rgba(255, 255, 255, 0.5)',
});

const ChangeText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$changeColor',
})<{ $changeColor?: string }>(({ $changeColor }) => ({
  fontSize: ms(fontSize.tokenChange),
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: $changeColor || colors.text.muted,
}));

const ValueContainer = styled(Box)({
  alignItems: 'flex-end',
  textAlign: 'right',
  gap: vs(spacing.tokenAmountGap),
});

const UsdValue = styled(Typography)({
  fontSize: ms(fontSize.lg),
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: vs(spacing['2xs']),
});

const TokenAmount = styled(Typography)({
  fontSize: ms(fontSize.sm),
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: 'rgba(255, 255, 255, 0.7)',
});

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

  const percentageChange = last24HoursChange?.perc ?? 0;
  const absoluteChange = last24HoursChange?.abs;
  const labelType = getLabelValue(percentageChange);
  const changeColor = colors.change[labelType];

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
      {logo ? (
        <TokenLogo src={logo} alt={name} onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_TOKEN_LOGO;
        }} />
      ) : (
        <TokenLogoPlaceholder>{symbol?.[0] || '?'}</TokenLogoPlaceholder>
      )}

      <InfoContainer>
        <TokenName>{name}</TokenName>
        <PriceRow>
          {displayPrice && <Price>{displayPrice}</Price>}
          {displayPercentage && (
            <>
              <BulletSeparator>{'\u2022'}</BulletSeparator>
              <ChangeText $changeColor={changeColor}>
                {displayPercentage}
                {displayAbsChange && ` (${displayAbsChange})`}
              </ChangeText>
            </>
          )}
        </PriceRow>
      </InfoContainer>

      <ValueContainer>
        {displayUsdValue && <UsdValue>{displayUsdValue}</UsdValue>}
        <TokenAmount>{displayTokenAmount}</TokenAmount>
      </ValueContainer>

      <ChevronRightIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: ms(16), marginLeft: s(spacing['2xs']) }} />
    </Container>
  );
}

export default TokenListItem;
