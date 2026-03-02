/**
 * StepAddressAmount - Address and amount entry step for the SendSheet (web/extension version)
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 * Features:
 * - Selected token display card (clickable to go back)
 * - Recipient address input
 * - Amount input with quick-fill percentage buttons (25%, 50%, MAX)
 * - USD conversion display
 * - Cancel and Review & Send action buttons
 */

import React, { useCallback, useMemo, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  gradients,
  fontFamily,
  fontWeight,
  useAddressValidation,
  useCurrencyContext,
  useSendContacts,
  getShortAddress,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import type { StepAddressAmountProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const QUICK_FILL_OPTIONS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: 'MAX', value: 1 },
] as const;

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
});

const ScrollContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  paddingLeft: spacing.xl,
  paddingRight: spacing.xl,
  paddingBottom: spacing.lg,
  // Scrollbar styling
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
});

// Token Card
const TokenCardButton = styled(ButtonBase)({
  width: '100%',
  display: 'block',
  textAlign: 'left',
  borderRadius: 14,
  marginBottom: spacing.xl,
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.85,
  },
});

const TokenCardContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 14,
  padding: `${spacing.lg}px ${spacing.lg}px`,
});

const TokenCardLeft = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
});

const TokenCardLogo = styled('img')({
  width: 36,
  height: 36,
  borderRadius: 18,
  objectFit: 'cover',
  marginRight: spacing.md,
  flexShrink: 0,
});

const TokenCardLogoFallback = styled(Box)({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.background.card,
  border: `1px solid ${colors.border.default}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.md,
  flexShrink: 0,
});

const TokenCardLogoFallbackText = styled(Typography)({
  fontSize: 12,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

const TokenCardName = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const TokenCardBalance = styled(Typography)({
  fontSize: 16,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  flexShrink: 0,
  marginLeft: spacing.sm,
});

// Fields
const FieldGroup = styled(Box)({
  marginBottom: spacing.lg,
});

const FieldLabel = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  marginBottom: spacing.sm,
});

const StyledInput = styled(InputBase)({
  width: '100%',
  color: colors.text.primary,
  fontSize: 15,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  '& .MuiInputBase-input': {
    padding: '12px 0',
    '&::placeholder': {
      color: colors.text.secondary,
      opacity: 1,
    },
  },
});

const AddressInputRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 12,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const ValidationIndicatorBox = styled(Box)({
  marginLeft: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const ValidationMessage = styled(Typography)<{
  $messageType?: 'error' | 'warning' | null;
}>(({ $messageType }) => ({
  fontSize: 12,
  lineHeight: '16px',
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginTop: spacing.xs,
  color:
    $messageType === 'error'
      ? colors.status.error
      : $messageType === 'warning'
      ? colors.status.warning
      : colors.text.secondary,
}));

const AmountInputRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 12,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const QuickFillButtons = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing.xs,
});

const QuickFillButton = styled(ButtonBase)({
  backgroundColor: '#2A384E',
  borderRadius: 6,
  padding: `${spacing.xs}px ${spacing.md}px`,
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.8,
  },
});

const QuickFillText = styled(Typography)({
  fontSize: 12,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textTransform: 'uppercase',
});

// USD Conversion
const UsdConversion = styled(Typography)({
  fontSize: 20,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textAlign: 'center',
  marginTop: spacing.xs,
});

// Bottom Buttons
const BottomButtons = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  paddingLeft: spacing.xl,
  paddingRight: spacing.xl,
  paddingBottom: spacing.xl,
  paddingTop: spacing.md,
  gap: spacing.md,
});

const CancelButton = styled(ButtonBase)({
  flex: 1,
  height: 48,
  borderRadius: 12,
  border: '1px solid rgba(255, 92, 69, 0.8)',
  backgroundColor: '#1f232f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 12px rgba(0, 0, 0, 0.64)',
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.85,
  },
});

const CancelButtonText = styled(Typography)({
  fontSize: 13,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

const ReviewButton = styled(ButtonBase)<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: 48,
  borderRadius: 12,
  overflow: 'hidden',
  border: disabled
    ? `1px solid ${colors.border.default}`
    : '1px solid rgba(255, 92, 69, 0.8)',
  opacity: disabled ? 0.5 : 1,
  boxShadow: '0 0 12px rgba(0, 0, 0, 0.64)',
  transition: 'opacity 0.15s ease',
  cursor: disabled ? 'not-allowed' : 'pointer',
  '&:hover': {
    opacity: disabled ? 0.5 : 0.85,
  },
}));

const ReviewButtonGradient = styled(Box)<{ $isDisabled?: boolean }>(({ $isDisabled }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  background: $isDisabled ? gradients.disabledCSS : gradients.primaryCSS,
}));

const ReviewButtonText = styled(Typography)({
  fontSize: 15,
  fontWeight: 800,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
});

// Contact / Wallet sections
const ContactSection = styled(Box)({
  marginBottom: spacing.lg,
});

const ContactSectionHeader = styled(Typography)({
  fontSize: 13,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  marginBottom: spacing.sm,
});

const ContactRow = styled(ButtonBase)({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 10,
  padding: `${spacing.md}px ${spacing.lg}px`,
  marginBottom: spacing.xs,
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.8,
  },
});

const ContactInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
  marginRight: spacing.sm,
  textAlign: 'left',
});

const ContactName = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
});

const ContactAddress = styled(Typography)({
  fontSize: 12,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  textAlign: 'left',
});

const BlockchainBadge = styled(Box)({
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 6,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  flexShrink: 0,
});

const BlockchainBadgeText = styled(Typography)({
  fontSize: 11,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
});

// ============================================================================
// Component
// ============================================================================

export function StepAddressAmount({
  token,
  blockchain,
  account,
  onBack,
  onReview,
  onCancel,
}: StepAddressAmountProps) {
  const { t } = useTranslation();
  const [{ currency }, { formatPrecise }] = useCurrencyContext();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Address book contacts and own wallets
  const senderAddress = account.getReceiveAddress();
  const { contacts, ownWallets } = useSendContacts(senderAddress);

  // Address validation — account owns its own connection/provider
  const {
    validationState,
    isValidating,
    isValid: isAddressValid,
    message: addressMessage,
    messageType: addressMessageType,
  } = useAddressValidation(address, account, {
    debounceMs: 500,
  });

  // Parse balance
  const tokenBalance = useMemo(() => {
    return typeof token.uiAmount === 'string'
      ? parseFloat(token.uiAmount)
      : token.uiAmount;
  }, [token.uiAmount]);

  // Fiat conversion
  const fiatDisplay = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (!token.price || numAmount === 0) return `${formatPrecise(0)} ${currency.toUpperCase()}`;
    return `${formatPrecise(numAmount * token.price)} ${currency.toUpperCase()}`;
  }, [amount, token.price, formatPrecise, currency]);

  // Balance display
  const balanceDisplay = useMemo(() => {
    if (tokenBalance === 0) return `0 ${token.symbol}`;
    return `${Number(tokenBalance.toFixed(4))} ${token.symbol}`;
  }, [tokenBalance, token.symbol]);

  // Validate form (address must be validated AND amount must be valid)
  const isValid = useMemo(() => {
    const numAmount = parseFloat(amount);
    const amountValid = !isNaN(numAmount) && numAmount > 0 && numAmount <= tokenBalance;
    return isAddressValid && !isValidating && amountValid;
  }, [isAddressValid, isValidating, amount, tokenBalance]);

  // Handle quick fill
  const handleQuickFill = useCallback(
    (percentage: number) => {
      const fillAmount = tokenBalance * percentage;
      const decimals = token.decimals ?? 9;
      const truncated = Math.floor(fillAmount * 10 ** decimals) / 10 ** decimals;
      setAmount(truncated > 0 ? truncated.toString() : '0');
    },
    [tokenBalance, token.decimals]
  );

  // Handle review press
  const handleReview = useCallback(() => {
    if (isValid) {
      onReview(address.trim(), amount);
    }
  }, [isValid, address, amount, onReview]);

  // Handle input changes
  const handleAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(e.target.value);
    },
    []
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(e.target.value);
    },
    []
  );

  // Placeholder text based on blockchain
  const addressPlaceholder = useMemo(() => {
    switch (blockchain) {
      case 'solana':
        return 'Solana Address';
      case 'ethereum':
        return 'Ethereum Address';
      case 'bitcoin':
        return 'Bitcoin Address';
      default:
        return 'Recipient Address';
    }
  }, [blockchain]);

  return (
    <Container>
      <ScrollContent>
        {/* Selected Token Card */}
        <TokenCardButton
          onClick={onBack}
          aria-label={`Selected token: ${token.name}`}
        >
          <BlurContainer style={{ borderRadius: 14 }}>
            <TokenCardContent>
              <TokenCardLeft>
                {token.logo ? (
                  <TokenCardLogo
                    src={token.logo}
                    alt={token.symbol}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <TokenCardLogoFallback>
                    <TokenCardLogoFallbackText>
                      {token.symbol?.slice(0, 2).toUpperCase() || '?'}
                    </TokenCardLogoFallbackText>
                  </TokenCardLogoFallback>
                )}
                <TokenCardName>{token.symbol}</TokenCardName>
              </TokenCardLeft>
              <TokenCardBalance>{balanceDisplay}</TokenCardBalance>
            </TokenCardContent>
          </BlurContainer>
        </TokenCardButton>

        {/* Recipient */}
        <FieldGroup>
          <FieldLabel>Recipient</FieldLabel>
          <BlurContainer style={{
            borderRadius: 12,
            border: validationState === 'invalid'
              ? `1px solid ${colors.status.error}`
              : validationState === 'warning'
              ? `1px solid ${colors.status.warning}`
              : validationState === 'valid'
              ? `1px solid ${colors.status.success}`
              : undefined,
          }}>
            <AddressInputRow>
              <StyledInput
                placeholder={addressPlaceholder}
                value={address}
                onChange={handleAddressChange}
                autoComplete="off"
                inputProps={{
                  autoCapitalize: 'none',
                  autoCorrect: 'off',
                  spellCheck: false,
                }}
                sx={{ flex: 1 }}
              />
              {/* Validation indicator */}
              {address.length > 0 && isValidating && (
                <ValidationIndicatorBox>
                  <CircularProgress
                    size={16}
                    sx={{ color: colors.text.secondary }}
                  />
                </ValidationIndicatorBox>
              )}
              {address.length > 0 && !isValidating && validationState === 'valid' && (
                <ValidationIndicatorBox>
                  <span style={{ color: colors.status.success, fontSize: 16 }}>{'\u2713'}</span>
                </ValidationIndicatorBox>
              )}
              {address.length > 0 && !isValidating && validationState === 'invalid' && (
                <ValidationIndicatorBox>
                  <span style={{ color: colors.status.error, fontSize: 16 }}>{'\u2715'}</span>
                </ValidationIndicatorBox>
              )}
              {address.length > 0 && !isValidating && validationState === 'warning' && (
                <ValidationIndicatorBox>
                  <span style={{ color: colors.status.warning, fontSize: 16 }}>{'\u26A0'}</span>
                </ValidationIndicatorBox>
              )}
            </AddressInputRow>
          </BlurContainer>
          {/* Validation message */}
          {addressMessage && (
            <ValidationMessage $messageType={addressMessageType}>
              {addressMessage}
            </ValidationMessage>
          )}
        </FieldGroup>

        {/* My Wallets */}
        {address.length === 0 && ownWallets.length > 0 && (
          <ContactSection>
            <ContactSectionHeader>{t('token.send.myWallets')}</ContactSectionHeader>
            {ownWallets.map((wallet) => (
              <ContactRow
                key={wallet.address}
                onClick={() => setAddress(wallet.address)}
              >
                <ContactName>{wallet.accountName}</ContactName>
                <ContactAddress>{getShortAddress(wallet.address)}</ContactAddress>
              </ContactRow>
            ))}
          </ContactSection>
        )}

        {/* Address Book */}
        {address.length === 0 && contacts.length > 0 && (
          <ContactSection>
            <ContactSectionHeader>{t('token.send.addressBook')}</ContactSectionHeader>
            {contacts.map((contact) => (
              <ContactRow
                key={contact.address}
                onClick={() => setAddress(contact.address)}
              >
                <ContactInfo>
                  <ContactName>{contact.name}</ContactName>
                  <ContactAddress>{getShortAddress(contact.address)}</ContactAddress>
                </ContactInfo>
                <BlockchainBadge>
                  <BlockchainBadgeText>
                    {contact.blockchain.charAt(0).toUpperCase() + contact.blockchain.slice(1)}
                  </BlockchainBadgeText>
                </BlockchainBadge>
              </ContactRow>
            ))}
          </ContactSection>
        )}

        {/* Amount */}
        <FieldGroup>
          <FieldLabel>Amount</FieldLabel>
          <BlurContainer style={{ borderRadius: 12 }}>
            <AmountInputRow>
              <StyledInput
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                autoComplete="off"
                inputProps={{
                  inputMode: 'decimal',
                  autoCorrect: 'off',
                }}
                sx={{ flex: 1 }}
              />
              <QuickFillButtons>
                {QUICK_FILL_OPTIONS.map((option) => (
                  <QuickFillButton
                    key={option.label}
                    onClick={() => handleQuickFill(option.value)}
                  >
                    <QuickFillText>{option.label}</QuickFillText>
                  </QuickFillButton>
                ))}
              </QuickFillButtons>
            </AmountInputRow>
          </BlurContainer>
        </FieldGroup>

        {/* USD Conversion */}
        <UsdConversion>{fiatDisplay}</UsdConversion>
      </ScrollContent>

      {/* Bottom Buttons */}
      <BottomButtons>
        <CancelButton onClick={onCancel}>
          <CancelButtonText>Cancel</CancelButtonText>
        </CancelButton>

        <ReviewButton
          onClick={handleReview}
          disabled={!isValid}
        >
          <ReviewButtonGradient $isDisabled={!isValid}>
            <ReviewButtonText>Review & Send</ReviewButtonText>
          </ReviewButtonGradient>
        </ReviewButton>
      </BottomButtons>
    </Container>
  );
}

export default StepAddressAmount;
