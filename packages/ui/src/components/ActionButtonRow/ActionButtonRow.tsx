/**
 * ActionButtonRow - Row of Send/Receive/Activity action buttons
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses responsive scaling (s, vs, ms) from shared to match mobile proportions.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderWidth,
  gradients,
  fontFamily,
  fontSize,
  componentSizes,
  s,
  vs,
  ms,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import { SendIcon, ReceiveIcon, ActivityIcon } from '../Icon';
import type { ActionButtonRowProps } from './types';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: s(spacing.sm),
  paddingLeft: s(spacing.xl),
  paddingRight: s(spacing.xl),
  paddingTop: vs(spacing.md),
  paddingBottom: vs(spacing.md),
});

const ButtonWrapper = styled(Box)<{ $disabled?: boolean }>(({ $disabled }) => ({
  flex: 1,
  height: vs(componentSizes.actionButtonHeight),
  borderRadius: ms(componentSizes.actionButtonRadius),
  overflow: 'hidden',
  opacity: $disabled ? colors.button.disabledOpacity : 1,
  transition: 'opacity 0.2s ease',
}));

const PrimaryButton = styled(Button)({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: s(spacing.sm),
  background: gradients.primaryCSS,
  borderRadius: ms(componentSizes.actionButtonRadius),
  textTransform: 'none',
  minWidth: 0,
  padding: 0,
  '&:hover': {
    background: gradients.primaryCSS,
    opacity: 0.9,
  },
  '&.Mui-disabled': {
    background: gradients.disabledCSS,
    color: colors.text.primary,
  },
});

const SecondaryButton = styled(Button)({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: s(spacing.sm),
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: ms(componentSizes.actionButtonRadius),
  textTransform: 'none',
  minWidth: 0,
  padding: 0,
  '&:hover': {
    backgroundColor: 'transparent',
    opacity: 0.85,
  },
  '&.Mui-disabled': {
    backgroundColor: 'transparent',
  },
});

const ButtonText = styled(Typography)<{ $disabled?: boolean }>(({ $disabled }) => ({
  fontSize: ms(fontSize.actionButton),
  fontWeight: '400',
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: $disabled ? colors.button.disabledText : '#e0e0e0',
}));

export function ActionButtonRow({
  onSendPress,
  onReceivePress,
  onActivityPress,
  sendDisabled = false,
  receiveDisabled = false,
  activityDisabled = false,
  style,
  className,
}: ActionButtonRowProps) {
  const { t } = useTranslation();

  const handleSendPress = useCallback(() => {
    if (!sendDisabled) {
      onSendPress?.();
    }
  }, [onSendPress, sendDisabled]);

  const handleReceivePress = useCallback(() => {
    if (!receiveDisabled) {
      onReceivePress?.();
    }
  }, [onReceivePress, receiveDisabled]);

  const handleActivityPress = useCallback(() => {
    if (!activityDisabled) {
      onActivityPress?.();
    }
  }, [onActivityPress, activityDisabled]);

  const iconSize = ms(componentSizes.actionButtonIcon);

  return (
    <Container style={style} className={className}>
      {/* Send Button - Primary */}
      <ButtonWrapper $disabled={sendDisabled}>
        <PrimaryButton
          onClick={handleSendPress}
          disabled={sendDisabled}
          aria-label="Send tokens"
        >
          <SendIcon sx={{ fontSize: iconSize, color: '#e0e0e0' }} />
          <ButtonText>{t('actions.send', 'Send')}</ButtonText>
        </PrimaryButton>
      </ButtonWrapper>

      {/* Receive Button - Secondary with BlurContainer */}
      <ButtonWrapper $disabled={receiveDisabled}>
        <BlurContainer
          borderColor={colors.accent.primary}
          borderWidth={borderWidth.actionButton}
          style={{ borderRadius: ms(componentSizes.actionButtonRadius), height: '100%' }}
        >
          <SecondaryButton
            onClick={handleReceivePress}
            disabled={receiveDisabled}
            aria-label="Receive tokens"
          >
            <ReceiveIcon sx={{ fontSize: iconSize, color: receiveDisabled ? colors.button.disabledText : '#e0e0e0' }} />
            <ButtonText $disabled={receiveDisabled}>{t('actions.receive', 'Receive')}</ButtonText>
          </SecondaryButton>
        </BlurContainer>
      </ButtonWrapper>

      {/* Activity Button - Secondary with BlurContainer */}
      <ButtonWrapper $disabled={activityDisabled}>
        <BlurContainer
          borderColor={colors.accent.primary}
          borderWidth={borderWidth.actionButton}
          style={{ borderRadius: ms(componentSizes.actionButtonRadius), height: '100%' }}
        >
          <SecondaryButton
            onClick={handleActivityPress}
            disabled={activityDisabled}
            aria-label="View activity"
          >
            <ActivityIcon sx={{ fontSize: iconSize, color: activityDisabled ? colors.button.disabledText : '#e0e0e0' }} />
            <ButtonText $disabled={activityDisabled}>{t('actions.activity', 'Activity')}</ButtonText>
          </SecondaryButton>
        </BlurContainer>
      </ButtonWrapper>
    </Container>
  );
}

export default ActionButtonRow;
