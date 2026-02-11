/**
 * ActionButtonRow - Row of Send/Receive/Activity action buttons
 *
 * Web version using MUI and @emotion/styled for browser extension
 */
import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { colors, spacing, borderRadius, gradients, fontFamily, fontWeight } from '@salmon/shared';
import { SendIcon, ReceiveIcon, ActivityIcon } from '../Icon';
import type { ActionButtonRowProps } from './types';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px`,
  gap: spacing.md,
});

const ButtonWrapper = styled(Box)<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  borderRadius: borderRadius.xl,
  overflow: 'hidden',
  opacity: disabled ? 0.5 : 1,
  transition: 'opacity 0.2s ease',
}));

const PrimaryButton = styled(Button)({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing.lg}px ${spacing.lg}px`,
  gap: spacing.sm,
  background: gradients.primaryCSS,
  borderRadius: borderRadius.xl,
  textTransform: 'none',
  '&:hover': {
    background: gradients.primaryCSS,
    opacity: 0.9,
  },
  '&.Mui-disabled': {
    background: 'linear-gradient(101deg, #666 12%, #444 83%)',
    color: colors.text.primary,
  },
});

const SecondaryButton = styled(Button)({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing.lg}px ${spacing.lg}px`,
  gap: spacing.sm,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: borderRadius.xl,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
});

const ButtonText = styled(Typography)<{ disabled?: boolean }>(({ disabled }) => ({
  fontSize: 16,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: disabled ? '#666' : colors.text.primary,
}));

/**
 * ActionButtonRow component for primary wallet actions
 *
 * Displays three main action buttons:
 * - Send: Primary orange gradient button
 * - Receive: Secondary outlined button
 * - Activity: Secondary outlined button
 *
 * @example
 * ```tsx
 * <ActionButtonRow
 *   onSendPress={() => navigate('/send')}
 *   onReceivePress={() => navigate('/receive')}
 *   onActivityPress={() => navigate('/activity')}
 * />
 * ```
 */
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

  return (
    <Container style={style} className={className}>
      {/* Send Button - Primary */}
      <ButtonWrapper disabled={sendDisabled}>
        <PrimaryButton
          onClick={handleSendPress}
          disabled={sendDisabled}
          aria-label="Send tokens"
        >
          <SendIcon sx={{ fontSize: 22, color: colors.text.primary }} />
          <ButtonText>Send</ButtonText>
        </PrimaryButton>
      </ButtonWrapper>

      {/* Receive Button - Secondary */}
      <ButtonWrapper disabled={receiveDisabled}>
        <SecondaryButton
          onClick={handleReceivePress}
          disabled={receiveDisabled}
          aria-label="Receive tokens"
        >
          <ReceiveIcon sx={{ fontSize: 22, color: receiveDisabled ? '#666' : colors.text.primary }} />
          <ButtonText disabled={receiveDisabled}>Receive</ButtonText>
        </SecondaryButton>
      </ButtonWrapper>

      {/* Activity Button - Secondary */}
      <ButtonWrapper disabled={activityDisabled}>
        <SecondaryButton
          onClick={handleActivityPress}
          disabled={activityDisabled}
          aria-label="View activity"
        >
          <ActivityIcon sx={{ fontSize: 22, color: activityDisabled ? '#666' : colors.text.primary }} />
          <ButtonText disabled={activityDisabled}>Activity</ButtonText>
        </SecondaryButton>
      </ButtonWrapper>
    </Container>
  );
}

export default ActionButtonRow;
