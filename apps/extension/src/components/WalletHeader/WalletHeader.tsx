/**
 * WalletHeader - Account info and navigation header
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { colors, spacing, borderRadius, fontFamily, fontWeight } from '@salmon/shared';
import { CopyIcon, SettingsIcon } from '../Icon';
import type { WalletHeaderProps } from './types';

/**
 * Truncates an address to show first 6 and last 4 characters
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.md}px ${spacing.xl}px`,
  backgroundColor: '#0D0D0D',
  borderBottomLeftRadius: borderRadius['2xl'],
  borderBottomRightRadius: borderRadius['2xl'],
});

const AccountInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: spacing.lg,
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
});

const AccountTextContainer = styled(Box)({
  flex: 1,
});

const AccountName = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const AddressContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const Address = styled(Typography)({
  fontSize: 13,
  fontFamily: 'monospace',
  color: 'rgba(255, 255, 255, 0.6)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const CopyIconStyled = styled(CopyIcon)({
  marginLeft: 6,
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.6)',
});

const SettingsButton = styled(IconButton)({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

/**
 * WalletHeader component for displaying account info and navigation
 *
 * Displays:
 * - Account name + truncated address
 * - Copy button to copy full address
 * - Settings icon for navigation
 *
 * If onWalletPress is provided, clicking the account name area opens the wallet switcher.
 * If only onCopyAddress is provided, clicking the account name area copies the address.
 *
 * @example
 * ```tsx
 * <WalletHeader
 *   accountName="Account 1"
 *   address="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
 *   onCopyAddress={() => navigator.clipboard.writeText(address)}
 *   onSettingsPress={() => navigate('/settings')}
 *   onWalletPress={() => setWalletSwitcherVisible(true)}
 * />
 * ```
 */
export function WalletHeader({
  accountName,
  address,
  onCopyAddress,
  onSettingsPress,
  onWalletPress,
  style,
  className,
}: WalletHeaderProps) {
  const handleAccountInfoClick = useCallback(() => {
    // If onWalletPress is provided, use it; otherwise fall back to copy address
    if (onWalletPress) {
      onWalletPress();
    } else {
      onCopyAddress?.();
    }
  }, [onWalletPress, onCopyAddress]);

  const handleCopyPress = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyAddress?.();
  }, [onCopyAddress]);

  const handleSettingsPress = useCallback(() => {
    onSettingsPress?.();
  }, [onSettingsPress]);

  const truncatedAddress = truncateAddress(address);

  return (
    <Container style={style} className={className}>
      {/* Left side - Account info */}
      <AccountInfo
        onClick={handleAccountInfoClick}
        role="button"
        aria-label={onWalletPress ? `Switch wallet, current: ${accountName}` : `Copy wallet address ${truncatedAddress}`}
      >
        <AccountTextContainer>
          <AccountName>{accountName}</AccountName>
          <AddressContainer onClick={onWalletPress ? handleCopyPress : undefined}>
            <Address>{truncatedAddress}</Address>
            <CopyIconStyled />
          </AddressContainer>
        </AccountTextContainer>
      </AccountInfo>

      {/* Right side - Settings button */}
      <SettingsButton onClick={handleSettingsPress} aria-label="Open settings">
        <SettingsIcon sx={{ color: colors.text.primary, fontSize: 24 }} />
      </SettingsButton>
    </Container>
  );
}

export default WalletHeader;
