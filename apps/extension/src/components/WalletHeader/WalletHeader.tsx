/**
 * WalletHeader - Account info and navigation header
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import MuiAvatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { colors, spacing, borderRadius, fontFamily, fontWeight, fontSize, getAvatarColor, getShortAddress, getInitials } from '@salmon/shared';
import { CopyIcon, SettingsIcon } from '../Icon';
import type { WalletHeaderProps } from './types';


const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.md}px ${spacing.xl}px`,
  backgroundColor: colors.background.primary,
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
  fontSize: fontSize.md,
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
  fontSize: fontSize.sm,
  fontFamily: 'monospace',
  color: colors.text.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const CopyIconStyled = styled(CopyIcon)({
  marginLeft: spacing.sm,
  fontSize: fontSize.base,
  color: colors.text.muted,
});

const ActionButtons = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
});

const HeaderButton = styled(IconButton)({
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
  avatarUrl,
  accountId,
  style,
  className,
}: WalletHeaderProps) {
  const [imgError, setImgError] = useState(false);

  const handleCopyPress = useCallback(() => {
    onCopyAddress?.();
  }, [onCopyAddress]);

  const handleSettingsPress = useCallback(() => {
    onSettingsPress?.();
  }, [onSettingsPress]);

  const handleWalletPress = useCallback(() => {
    onWalletPress?.();
  }, [onWalletPress]);

  const truncatedAddress = getShortAddress(address, 6);

  const { t } = useTranslation();

  const avatarColor = useMemo(
    () => (accountId ? getAvatarColor(accountId) : colors.text.muted),
    [accountId],
  );
  const initials = useMemo(() => getInitials(accountName), [accountName]);

  return (
    <Container style={style} className={className}>
      {/* Left side - Account info (click copies address) */}
      <AccountInfo
        onClick={handleCopyPress}
        role="button"
        aria-label={t('accessibility.copy_address', { address: truncatedAddress })}
      >
        {/* Avatar */}
        {avatarUrl && !imgError ? (
          <MuiAvatar
            src={avatarUrl}
            sx={{ width: 32, height: 32, marginRight: `${spacing.md}px`, cursor: 'pointer' }}
            imgProps={{ onError: () => setImgError(true) }}
            onClick={(e) => {
              e.stopPropagation();
              handleWalletPress();
            }}
          />
        ) : accountId ? (
          <MuiAvatar
            sx={{
              width: 32,
              height: 32,
              marginRight: `${spacing.md}px`,
              backgroundColor: avatarColor,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleWalletPress();
            }}
          >
            {initials}
          </MuiAvatar>
        ) : null}
        <AccountTextContainer>
          <AccountName>{accountName}</AccountName>
          <AddressContainer>
            <Address>{truncatedAddress}</Address>
            <CopyIconStyled />
          </AddressContainer>
        </AccountTextContainer>
      </AccountInfo>

      {/* Right side - Settings + Wallet buttons */}
      <ActionButtons>
        <HeaderButton onClick={handleSettingsPress} aria-label={t('accessibility.open_settings')}>
          <SettingsIcon sx={{ color: colors.text.primary, fontSize: 24 }} />
        </HeaderButton>
      </ActionButtons>
    </Container>
  );
}

export default WalletHeader;
