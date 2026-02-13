/**
 * BalanceCard - Portfolio balance display with gradient background
 *
 * Web version matching mobile's visual structure:
 * - Dynamic gradient per blockchain
 * - ScalesBackground overlay
 * - Centered blockchain SVG icon
 * - Balance with decimal opacity split
 * - Trending arrow + change colors from tokens
 */
import { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
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
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
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
 * Get ScalesBackground stroke color for a blockchain (15% opacity)
 */
const getScalesColorForBlockchain = (blockchain: BlockchainId): string => {
  switch (blockchain) {
    case 'solana':
      return 'rgba(153, 69, 255, 0.15)';
    case 'solana-devnet':
      return 'rgba(0, 255, 163, 0.15)';
    case 'bitcoin':
      return 'rgba(247, 147, 26, 0.15)';
    case 'bitcoin-testnet':
      return 'rgba(255, 149, 0, 0.15)';
    case 'ethereum':
      return 'rgba(98, 126, 234, 0.15)';
    case 'ethereum-sepolia':
      return 'rgba(76, 175, 80, 0.15)';
    default:
      return 'rgba(153, 69, 255, 0.15)';
  }
};

/**
 * Render the blockchain logo using SVG icons
 */
const renderBlockchainLogo = (blockchain: BlockchainId) => {
  const iconStyle = {
    width: componentSizes.blockchainIcon,
    height: componentSizes.blockchainIcon,
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

/**
 * Get network label for non-mainnet networks
 */
const getNetworkLabel = (blockchain: BlockchainId): string | null => {
  switch (blockchain) {
    case 'solana-devnet':
      return 'Devnet';
    case 'bitcoin-testnet':
      return 'Testnet';
    case 'ethereum-sepolia':
      return 'Sepolia';
    default:
      return null;
  }
};

// --- Styled components ---

const Container = styled(Box)({
  borderRadius: borderRadius['2xl'],
  padding: spacing.xl,
  margin: `0 ${spacing.lg}px`,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: shadowsCSS.card,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.sm,
});

const LogoContainer = styled(Box)({
  width: componentSizes.logoContainer,
  height: componentSizes.logoContainer,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const NetworkLabel = styled(Box)({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  paddingTop: spacing.xxs,
  paddingBottom: spacing.xxs,
  borderRadius: borderRadius.sm,
  marginTop: spacing.xs,
});

const NetworkLabelText = styled(Typography)({
  fontSize: fontSize.xs,
  fontWeight: 600,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
});

const BalanceRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.md,
  textShadow: shadowsCSS.balanceText,
});

const BalanceDollars = styled(Typography)({
  fontSize: fontSize.balance,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.balance,
  letterSpacing: letterSpacing.balance,
});

const BalanceDecimals = styled(Typography)({
  fontSize: fontSize.balance,
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
  padding: spacing.xs,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.text.muted,
  '&:hover': {
    opacity: 0.8,
  },
});

const ChangeRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  textShadow: shadowsCSS.balanceText,
});

const ChangeText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== '$color',
})<{ $color?: string }>(({ $color }) => ({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: $color || colors.text.muted,
  letterSpacing: letterSpacing.change,
}));

const TrendingIconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginLeft: spacing['2xs'],
  marginRight: spacing['2xs'],
});

const Pagination = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: spacing.sm,
});

const PaginationDot = styled(Box)<{ $active?: boolean }>(({ $active }) => ({
  width: spacing.xs,
  height: spacing.xs,
  borderRadius: spacing['2xs'],
  backgroundColor: $active ? colors.text.primary : colors.step.inactive,
  margin: `0 ${spacing.xxs + 1}px`,
}));

export function BalanceCard({
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
  showNetworkLabel = false,
  style,
  className,
}: BalanceCardProps) {
  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility?.();
  }, [onToggleVisibility]);

  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];
  const isPositive = changePercent >= 0;

  const displayPercentage = showPercentage(changePercent);
  const displayAbsChange = showAbsoluteChange(changeAmount);

  const gradientCSS = getGradientCSSForBlockchain(blockchain);
  const scalesColor = getScalesColorForBlockchain(blockchain);
  const networkLabel = showNetworkLabel ? getNetworkLabel(blockchain) : null;

  const renderBalance = () => {
    if (hiddenBalance) {
      return (
        <BalanceRow>
          <BalanceDollars>{hiddenValue}</BalanceDollars>
          <EyeButton onClick={handleToggleVisibility} aria-label="Show balance">
            <EyeOffIcon sx={{ fontSize: componentSizes.eyeIcon }} />
          </EyeButton>
        </BalanceRow>
      );
    }

    const formatted = showAmount(usdTotal);
    const parts = formatted.split('.');

    return (
      <BalanceRow>
        <BalanceDollars>{parts[0]}</BalanceDollars>
        {parts[1] && <BalanceDecimals>.{parts[1]}</BalanceDecimals>}
        <EyeButton onClick={handleToggleVisibility} aria-label="Hide balance">
          <EyeIcon sx={{ fontSize: componentSizes.eyeIcon }} />
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
            size={componentSizes.changeArrowIcon}
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
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
        <CircularProgress size={40} sx={{ color: colors.text.primary }} />
      ) : (
        renderBalance()
      )}

      {/* 24h change */}
      {!loading && renderChange()}

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
