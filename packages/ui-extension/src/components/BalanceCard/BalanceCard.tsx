/**
 * BalanceCard - Portfolio balance display with gradient background
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
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
} from '@salmon/shared';
import { EyeIcon, EyeOffIcon, ChevronDownIcon } from '../Icon';
import type { BalanceCardProps, NetworkInfo } from './types';

/**
 * Default network logos
 */
const NETWORK_LOGOS: Record<string, string> = {
  'mainnet-beta': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'devnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'testnet': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
};

/**
 * Color mapping for percentage change labels
 */
const LABEL_COLORS: Record<string, string> = {
  positive: '#00C853',
  negative: '#FF5252',
  neutral: 'rgba(255, 255, 255, 0.6)',
};

const Container = styled(Box)({
  background: 'linear-gradient(135deg, #4A1A8C 0%, #2D1052 50%, #1A0A33 100%)',
  borderRadius: borderRadius['2xl'],
  padding: spacing.xl,
  margin: `0 ${spacing.lg}px`,
});

const NetworkContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: borderRadius.xl,
  padding: `${spacing.xs + 2}px ${spacing.md}px`,
  marginBottom: spacing.lg,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

const NetworkLogo = styled('img')({
  width: 20,
  height: 20,
  borderRadius: 10,
  marginRight: spacing.sm,
  objectFit: 'cover',
});

const NetworkName = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

const BalanceContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing.sm,
});

const Balance = styled(Typography)({
  fontSize: 42,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  flex: 1,
  marginRight: spacing.md,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const VisibilityButton = styled(IconButton)({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

const ChangeContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.lg,
});

const ChangeText = styled(Typography)<{ changeColor?: string }>(({ changeColor }) => ({
  fontSize: 16,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: changeColor || 'rgba(255, 255, 255, 0.6)',
}));

const ChangeAbsolute = styled(Typography)<{ changeColor?: string }>(({ changeColor }) => ({
  fontSize: 14,
  fontWeight: fontWeight.regular,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: changeColor || 'rgba(255, 255, 255, 0.6)',
}));

const Pagination = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
});

const PaginationDot = styled(Box)<{ active?: boolean }>(({ active }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: active ? colors.text.primary : 'rgba(255, 255, 255, 0.3)',
  margin: `0 ${spacing.xs}px`,
}));

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
export function BalanceCard({
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
  className,
}: BalanceCardProps) {
  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility?.();
  }, [onToggleVisibility]);

  const handleNetworkPress = useCallback(() => {
    onNetworkPress?.();
  }, [onNetworkPress]);

  // Determine the label type for coloring
  const labelType = getLabelValue(changePercent);
  const changeColor = LABEL_COLORS[labelType];

  // Get network logo
  const networkLogo = network.logo || NETWORK_LOGOS[network.id] || NETWORK_LOGOS['mainnet-beta'];

  // Format display values
  const displayBalance = hiddenBalance ? hiddenValue : showAmount(usdTotal);
  const displayPercentage = showPercentage(changePercent);
  const displayAbsChange = showAbsoluteChange(changeAmount);

  return (
    <Container style={style} className={className}>
      {/* Network selector */}
      <NetworkContainer
        onClick={handleNetworkPress}
        role="button"
        aria-label={`Current network: ${network.name}`}
      >
        <NetworkLogo src={networkLogo} alt={network.name} />
        <NetworkName>{network.name}</NetworkName>
        <ChevronDownIcon sx={{ marginLeft: 0.5, fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' }} />
      </NetworkContainer>

      {/* Balance display */}
      <BalanceContainer>
        {loading ? (
          <CircularProgress size={40} sx={{ color: colors.text.primary }} />
        ) : (
          <Balance>{displayBalance}</Balance>
        )}

        {/* Visibility toggle */}
        <VisibilityButton
          onClick={handleToggleVisibility}
          aria-label={hiddenBalance ? 'Show balance' : 'Hide balance'}
        >
          {hiddenBalance ? (
            <EyeOffIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 22 }} />
          ) : (
            <EyeIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 22 }} />
          )}
        </VisibilityButton>
      </BalanceContainer>

      {/* 24h change */}
      {!loading && (
        <ChangeContainer>
          {hiddenBalance ? (
            <ChangeText>{hiddenValue}</ChangeText>
          ) : (
            <>
              <ChangeText changeColor={changeColor}>{displayPercentage}</ChangeText>
              {displayAbsChange && (
                <ChangeAbsolute changeColor={changeColor}>
                  {' '}({displayAbsChange})
                </ChangeAbsolute>
              )}
            </>
          )}
        </ChangeContainer>
      )}

      {/* Pagination dots */}
      {totalCount > 1 && (
        <Pagination>
          {Array.from({ length: totalCount }).map((_, index) => (
            <PaginationDot key={index} active={index === currentIndex} />
          ))}
        </Pagination>
      )}
    </Container>
  );
}

export default BalanceCard;
