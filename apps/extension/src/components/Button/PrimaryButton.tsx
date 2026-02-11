/**
 * PrimaryButton - Main call-to-action button with orange gradient
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {
  colors,
  gradients,
  componentSizes,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
} from '@salmon/shared';
import type { PrimaryButtonProps } from './types';

const StyledButton = styled(Button)<{ fullWidth?: boolean }>(({ fullWidth }) => ({
  width: fullWidth ? '100%' : 'auto',
  minWidth: 120,
  height: componentSizes.buttonHeight,
  background: gradients.primaryCSS,
  borderRadius: componentSizes.buttonRadius,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.md,
  fontWeight: fontWeight.bold,
  letterSpacing: letterSpacing.widest,
  color: colors.text.primary,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'opacity 0.2s ease, transform 0.1s ease',
  '&:hover': {
    background: gradients.primaryCSS,
    opacity: 0.9,
    boxShadow: 'none',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    background: gradients.primaryCSS,
    opacity: colors.button.disabledOpacity,
    color: colors.text.primary,
  },
}));

const LoaderWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function PrimaryButton({
  onClick,
  children,
  disabled,
  loading,
  style,
  className,
  fullWidth = true,
  type = 'button',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      onClick={onClick}
      disabled={isDisabled}
      fullWidth={fullWidth}
      type={type}
      style={style}
      className={className}
      disableRipple={false}
    >
      {loading ? (
        <LoaderWrapper>
          <CircularProgress size={24} sx={{ color: colors.text.primary }} />
        </LoaderWrapper>
      ) : (
        children
      )}
    </StyledButton>
  );
}

export default PrimaryButton;
