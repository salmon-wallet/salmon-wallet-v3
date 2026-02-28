/**
 * TextButton - Text-only button without background
 *
 * Used for tertiary actions or links.
 * Web version using @emotion/styled for browser extension.
 */
import { styled } from '../../utils/styled';
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
import type { TextButtonProps } from './types';

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'customColor',
})<{ customColor?: string }>(
  ({ customColor }) => ({
    minWidth: 'auto',
    height: componentSizes.buttonHeightSmall,
    paddingLeft: 16,
    paddingRight: 16,
    background: 'transparent',
    borderRadius: 0,
    fontFamily: `${fontFamily.sans}, sans-serif`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
    color: customColor || colors.text.primary,
    textTransform: 'none',
    boxShadow: 'none',
    transition: 'opacity 0.2s ease',
    '&:hover': {
      background: 'transparent',
      opacity: 0.6,
      boxShadow: 'none',
    },
    '&:active': {
      background: 'transparent',
    },
    '&.Mui-disabled': {
      background: 'transparent',
      opacity: colors.button.disabledOpacity,
      color: customColor || colors.text.primary,
    },
  })
);

const LoaderWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function TextButton({
  onClick,
  children,
  disabled,
  loading,
  style,
  className,
  color,
  type = 'button',
}: TextButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      onClick={onClick}
      disabled={isDisabled}
      type={type}
      style={style}
      className={className}
      customColor={color}
      disableRipple={false}
    >
      {loading ? (
        <LoaderWrapper>
          <CircularProgress
            size={20}
            sx={{ color: color || colors.text.primary }}
          />
        </LoaderWrapper>
      ) : (
        children
      )}
    </StyledButton>
  );
}

export default TextButton;
