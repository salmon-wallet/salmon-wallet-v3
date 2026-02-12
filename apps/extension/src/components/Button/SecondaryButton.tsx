/**
 * SecondaryButton - Secondary action button (outline/ghost)
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {
  colors,
  componentSizes,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
} from '@salmon/shared';
import type { SecondaryButtonProps } from './types';

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'buttonVariant',
})<{
  fullWidth?: boolean;
  buttonVariant?: 'filled' | 'outline';
}>(({ fullWidth, buttonVariant = 'filled' }) => ({
  width: fullWidth ? '100%' : 'auto',
  minWidth: 120,
  height: componentSizes.buttonHeight,
  backgroundColor:
    buttonVariant === 'outline' ? 'transparent' : colors.button.secondaryBackground,
  border: buttonVariant === 'outline' ? `1px solid ${colors.border.default}` : 'none',
  borderRadius: componentSizes.buttonRadius,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.md,
  fontWeight: fontWeight.bold,
  letterSpacing: letterSpacing.widest,
  color: colors.button.secondaryText,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'opacity 0.2s ease, transform 0.1s ease, background-color 0.2s ease',
  '&:hover': {
    backgroundColor:
      buttonVariant === 'outline'
        ? 'rgba(255, 255, 255, 0.05)'
        : colors.button.secondaryBackground,
    opacity: 0.9,
    boxShadow: 'none',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    backgroundColor:
      buttonVariant === 'outline' ? 'transparent' : colors.button.secondaryBackground,
    opacity: colors.button.disabledOpacity,
    color: colors.button.secondaryText,
    border: buttonVariant === 'outline' ? `1px solid ${colors.border.default}` : 'none',
  },
}));

const LoaderWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function SecondaryButton({
  onClick,
  children,
  disabled,
  loading,
  style,
  className,
  fullWidth = true,
  variant = 'filled',
  type = 'button',
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      onClick={onClick}
      disabled={isDisabled}
      fullWidth={fullWidth}
      buttonVariant={variant}
      type={type}
      style={style}
      className={className}
      disableRipple={false}
    >
      {loading ? (
        <LoaderWrapper>
          <CircularProgress size={24} sx={{ color: colors.button.secondaryText }} />
        </LoaderWrapper>
      ) : (
        children
      )}
    </StyledButton>
  );
}

export default SecondaryButton;
