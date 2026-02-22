/**
 * BalanceCard - Portfolio balance display with gradient background
 *
 * Web version matching mobile's visual structure:
 * - Dynamic gradient per blockchain
 * - ScalesBackground overlay
 * - Centered blockchain SVG icon
 * - Balance with decimal opacity split
 * - Trending arrow + change colors from tokens
 *
 * Uses responsive scaling (s, vs, ms) from shared to match mobile proportions.
 */
import { useCallback } from 'react';
import { keyframes } from '@mui/material/styles';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  gradients,
  spacing,
  borderRadius,
  fontSize,
  fontFamily,
  fontWeight,
  letterSpacing,
  componentSizes,
  shadowsCSS,
  s,
  vs,
  ms,
  showPercentage,
  getLabelValue,
  hiddenValue,
  useCurrencyContext,
  getNetworkLabel,
  getScalesColorForBlockchain,
} from '@salmon/shared';
import type { BlockchainId } from '@salmon/shared';
import { EyeIcon, EyeOffIcon, Icon, SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon';
import { ScalesBackground } from '../ScalesBackground';
import type { BalanceCardProps } from './types';

/**
 * Get CSS gradient string for a blockchain
 */
const getGradientCSSForBlockchain = (blockchain: BlockchainId): string => {
  switch (blockchain) {
    case 'solana':
      return gradients.balanceCardSolanaCSS;
    case 'solana-devnet':
      return gradients.balanceCardSolanaDevnetCSS;
    case 'bitcoin':
      return gradients.balanceCardBitcoinCSS;
    case 'bitcoin-testnet':
      return gradients.balanceCardBitcoinTestnetCSS;
    case 'ethereum':
      return gradients.balanceCardEthereumCSS;
    case 'ethereum-sepolia':
      return gradients.balanceCardEthereumSepoliaCSS;
    default:
      return gradients.balanceCardSolanaCSS;
  }
};

/**
 * Render the blockchain logo using SVG icons
 */
const renderBlockchainLogo = (blockchain: BlockchainId) => {
  const iconSize = s(componentSizes.blockchainIcon);
  const iconStyle = {
    width: iconSize,
    height: iconSize,
    color: '#FFFFFF',
  };
  switch (blockchain) {
    case 'solana':
    case 'solana-devnet':
      return <SolanaSvgIcon style={iconStyle} />;
    case 'bitcoin':
    case 'bitcoin-testnet':
      return <BitcoinSvgIcon style={iconStyle} />;
    case 'ethereum':
    case 'ethereum-sepolia':
      return <EthereumSvgIcon style={iconStyle} />;
    default:
      return <SolanaSvgIcon style={iconStyle} />;
  }
};

// --- Styled components ---

const Container = styled(Box)({
  borderRadius: `0 0 ${ms(borderRadius.card)}px ${ms(borderRadius.card)}px`,
  paddingTop: vs(spacing['2xl']),
  paddingBottom: vs(spacing['2xl']),
  paddingLeft: s(spacing['2xl']),
  paddingRight: s(spacing['2xl']),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: shadowsCSS.card,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vs(spacing.sm),
});

const LogoContainer = styled(Box)({
  position: 'relative' as const,
  zIndex: 1,
  width: s(componentSizes.logoContainer),
  height: vs(componentSizes.logoContainer),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const NetworkLabel = styled(Box)({
  position: 'relative' as const,
  zIndex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  paddingLeft: s(spacing.sm),
  paddingRight: s(spacing.sm),
  paddingTop: vs(spacing.xxs),
  paddingBottom: vs(spacing.xxs),
  borderRadius: ms(borderRadius.sm),
  marginTop: vs(spacing.xs),
});

const NetworkLabelText = styled(Typography)({
  fontSize: ms(fontSize.xs),
  fontWeight: 600,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
});

const BalanceRow = styled(Box)({
  position: 'relative' as const,
  zIndex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: s(spacing.md),
});

const BalanceDollars = styled(Typography)({
  fontSize: ms(fontSize.balance),
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.balance,
  letterSpacing: letterSpacing.balance,
});

const BalanceDecimals = styled(Typography)({
  fontSize: ms(fontSize.balance),
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: letterSpacing.balance,
  opacity: 0.4,
});

const EyeButton = styled('button')({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: s(spacing.xs),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.text.muted,
  '&:hover': {
    opacity: 0.8,
  },
});

const ChangeRow = styled(Box)({
  position: 'relative' as const,
  zIndex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
});

const ChangeText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$color',
})<{ $color?: string }>(({ $color }) => ({
  fontSize: ms(fontSize.sm),
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: $color || colors.text.muted,
  letterSpacing: letterSpacing.change,
}));

const TrendingIconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginLeft: s(spacing['2xs']),
  marginRight: s(spacing['2xs']),
});

const Pagination = styled(Box)({
  position: 'relative' as const,
  zIndex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: vs(spacing.sm),
});

const PaginationDot = styled(Box)<{ $active?: boolean }>(({ $active }) => ({
  width: s(spacing.xs),
  height: s(spacing.xs),
  borderRadius: s(spacing['2xs']),
  backgroundColor: $active ? colors.text.primary : colors.step.inactive,
  margin: `0 ${s(spacing.xxs + 1)}px`,
}));

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonRect = styled(Box)({
  borderRadius: ms(borderRadius.sm),
  background: `linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%)`,
  backgroundSize: '400px 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});

export function BalanceCard({
  network: _network,
  blockchain = 'solana',
  usdTotal,
  changePercent = 0,
  changeAmount = 0,
  hiddenBalance = false,
  onToggleVisibility,
  currentIndex = 0,
  totalCount = 1,
  loading = false,
  showNetworkLabel = false,
  style,
  className,
}: BalanceCardProps) {
  const [, { formatValue, formatChange }] = useCurrencyContext();

  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility?.();
  }, [onToggleVisibility]);

  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];
  const isPositive = changePercent >= 0;

  const displayPercentage = showPercentage(changePercent);
  const displayAbsChange = formatChange(changeAmount);

  const gradientCSS = getGradientCSSForBlockchain(blockchain);
  const scalesColor = getScalesColorForBlockchain(blockchain);
  const networkLabel = showNetworkLabel ? getNetworkLabel(blockchain) : null;

  const renderBalance = () => {
    if (hiddenBalance) {
      return (
        <BalanceRow>
          <BalanceDollars>{hiddenValue}</BalanceDollars>
          <EyeButton onClick={handleToggleVisibility} aria-label="Show balance">
            <EyeOffIcon sx={{ fontSize: ms(componentSizes.eyeIcon) }} />
          </EyeButton>
        </BalanceRow>
      );
    }

    const formatted = formatValue(usdTotal);
    const parts = formatted.split('.');

    return (
      <BalanceRow>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <BalanceDollars>{parts[0]}</BalanceDollars>
          {parts[1] && <BalanceDecimals>.{parts[1]}</BalanceDecimals>}
        </Box>
        <EyeButton onClick={handleToggleVisibility} aria-label="Hide balance">
          <EyeIcon sx={{ fontSize: ms(componentSizes.eyeIcon) }} />
        </EyeButton>
      </BalanceRow>
    );
  };

  const renderChange = () => {
    if (hiddenBalance) {
      return (
        <ChangeRow>
          <ChangeText>{hiddenValue}</ChangeText>
        </ChangeRow>
      );
    }

    return (
      <ChangeRow>
        <ChangeText $color={changeColor}>{displayPercentage}</ChangeText>
        <TrendingIconWrapper>
          <Icon
            name={isPositive ? 'chevron-up' : 'chevron-down'}
            size={ms(componentSizes.changeArrowIcon)}
            color={changeColor}
          />
        </TrendingIconWrapper>
        {displayAbsChange && (
          <ChangeText $color={changeColor}>({displayAbsChange})</ChangeText>
        )}
      </ChangeRow>
    );
  };

  return (
    <Container
      style={{ ...style, background: gradientCSS }}
      className={className}
    >
      {/* Scales pattern overlay */}
      <ScalesBackground
        strokeColor={scalesColor}
        strokeWidth={1}
        patternHeight={26}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      />

      {/* Blockchain logo */}
      <LogoContainer>{renderBlockchainLogo(blockchain)}</LogoContainer>

      {/* Network label for non-mainnet */}
      {networkLabel && (
        <NetworkLabel>
          <NetworkLabelText>{networkLabel}</NetworkLabelText>
        </NetworkLabel>
      )}

      {/* Balance */}
      {loading ? (
        <BalanceRow>
          <SkeletonRect sx={{ width: ms(160), height: ms(fontSize.balance), borderRadius: `${ms(borderRadius.sm)}px` }} />
        </BalanceRow>
      ) : (
        renderBalance()
      )}

      {/* 24h change */}
      {loading ? (
        <ChangeRow>
          <SkeletonRect sx={{ width: ms(120), height: ms(fontSize.sm), borderRadius: `${ms(borderRadius.sm)}px` }} />
        </ChangeRow>
      ) : (
        renderChange()
      )}

      {/* Pagination dots */}
      {totalCount > 1 && (
        <Pagination>
          {Array.from({ length: totalCount }).map((_, index) => (
            <PaginationDot key={index} $active={index === currentIndex} />
          ))}
        </Pagination>
      )}
    </Container>
  );
}

export default BalanceCard;
