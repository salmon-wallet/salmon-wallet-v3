/**
 * SwapAmountInput - Input field for swap amounts with token selector
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import {
  borderRadius,
  colors,
  fontFamily,
  fontWeight,
  formatTokenBalance,
  spacing,
  useCurrencyContext,
} from '@salmon/shared';
import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import type { SwapAmountInputProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

const Label = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: 0.02,
  lineHeight: '18px',
});

const InputContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: `1px solid ${colors.border.default}`,
  borderRadius: borderRadius.md,
  height: 58,
  padding: `0 ${spacing.md}px`,
});

const LoadingContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
});

const StyledInput = styled(InputBase)({
  flex: 1,
  fontSize: 16,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  height: '100%',
  '& .MuiInputBase-input': {
    padding: 0,
    height: '100%',
  },
  '& .MuiInputBase-input::placeholder': {
    color: colors.text.placeholder,
    opacity: 1,
  },
  '&.Mui-disabled .MuiInputBase-input': {
    color: colors.text.primary,
    WebkitTextFillColor: colors.text.primary,
  },
});

const TokenDropdown = styled(ButtonBase)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.button.secondaryBackground,
  borderRadius: borderRadius.sm + 2,
  padding: `2px ${spacing.sm}px`,
  gap: spacing.sm - 1,
  height: 36,
  minWidth: 100,
  boxShadow: '0 3px 3px rgba(0, 0, 0, 0.25)',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
  '&:hover': {
    opacity: 0.85,
  },
});

const TokenIcon = styled('img')({
  width: 22,
  height: 22,
  borderRadius: 11,
  objectFit: 'cover',
});

const TokenIconPlaceholder = styled(Box)({
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: colors.skeleton.base,
});

const TokenSymbol = styled(Typography)({
  fontSize: 14,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  opacity: 0.9,
  letterSpacing: 0.018,
  lineHeight: '18px',
});

const InfoRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const UsdValue = styled(Typography)({
  fontSize: 12,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: 0.018,
  lineHeight: '21px',
});

const AvailableBalance = styled(Typography)({
  fontSize: 12,
  fontWeight: fontWeight.light,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: 0.018,
  lineHeight: '21px',
});

// ============================================================================
// SwapAmountInput Component
// ============================================================================

/**
 * SwapAmountInput - Input field for swap amounts with token selector
 */
export function SwapAmountInput({
  label,
  value,
  onChangeValue,
  token,
  onTokenPress,
  usdValue,
  availableBalance,
  editable = true,
  placeholder = 'Enter an amount',
  style,
  isLoading = false,
}: SwapAmountInputProps): React.ReactElement {
  const [{ currency }, { formatPrecise }] = useCurrencyContext();

  const handleChangeText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      // Allow only valid numeric input with decimal
      const sanitized = text.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = sanitized.split('.');
      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
      onChangeValue(formatted);
    },
    [onChangeValue]
  );

  return (
    <Container style={style}>
      {/* Label */}
      <Label>{label}</Label>

      {/* Input Row */}
      <InputContainer>
        {isLoading ? (
          <LoadingContainer>
            <CircularProgress size={20} sx={{ color: colors.text.secondary }} />
          </LoadingContainer>
        ) : (
          <StyledInput
            value={value}
            onChange={handleChangeText}
            placeholder={placeholder}
            disabled={!editable}
            inputProps={{
              inputMode: 'decimal',
              pattern: '[0-9.]*',
            }}
          />
        )}

        {/* Token Dropdown */}
        <TokenDropdown onClick={onTokenPress} aria-label={`Select token: ${token?.symbol || 'Select'}`}>
          {token?.logo ? (
            <TokenIcon
              src={token.logo}
              alt={token.symbol}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <TokenIconPlaceholder />
          )}
          <TokenSymbol>{token?.symbol || 'Select'}</TokenSymbol>
        </TokenDropdown>
      </InputContainer>

      {/* USD Value and Balance Row */}
      {(usdValue !== undefined || availableBalance !== undefined) && (
        <InfoRow>
          <UsdValue>{formatPrecise(usdValue)} {currency.toUpperCase()}</UsdValue>
          {availableBalance !== undefined && token && (
            <AvailableBalance>
              Available: {formatTokenBalance(availableBalance)} {token.symbol}
            </AvailableBalance>
          )}
        </InfoRow>
      )}
    </Container>
  );
}

export default SwapAmountInput;
