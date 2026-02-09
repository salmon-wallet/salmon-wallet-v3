/**
 * SendSheet - Multi-step send dialog for the browser extension
 *
 * Migrated from packages/ui (React Native) to use MUI Dialog.
 * Features:
 * - 3-step send flow: Token Select -> Address & Amount -> Confirmation
 * - ScalesBackground decorative pattern
 * - Back navigation between steps
 * - Bitcoin skips token selection (only BTC available)
 * - State reset on close
 *
 * @example
 * ```tsx
 * <SendSheet
 *   visible={isSendOpen}
 *   onClose={() => setIsSendOpen(false)}
 *   tokens={balanceTokens}
 *   blockchain="solana"
 *   account={activeAccount}
 *   onSuccess={(txId) => console.log('Sent!', txId)}
 * />
 * ```
 */

import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  useSendTransaction,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { StepTokenSelect } from './StepTokenSelect';
import { StepAddressAmount } from './StepAddressAmount';
import { StepConfirmation } from './StepConfirmation';
import type { SendSheetProps, SendStep, SendToken } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.border.default}`,
    minWidth: 380,
    maxWidth: 420,
    height: '85vh',
    maxHeight: 700,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: 0,
  pointerEvents: 'none',
});

const HeaderArea = styled(Box)({
  position: 'relative',
  zIndex: 1,
});

const HandleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: spacing.md,
  paddingBottom: spacing.sm,
});

const Handle = styled(Box)({
  width: 36,
  height: 4,
  borderRadius: 75,
  backgroundColor: colors.sheet.handle,
  opacity: 0.6,
});

const TitleRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: spacing.xl,
  paddingRight: spacing.xl,
  marginBottom: spacing.lg,
  position: 'relative',
  minHeight: 32,
});

const BackButton = styled(IconButton)({
  position: 'absolute',
  left: spacing.xl,
  zIndex: 1,
  color: colors.text.primary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const TitleText = styled(Typography)({
  fontSize: 24,
  fontWeight: 800,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textAlign: 'center',
  flex: 1,
  letterSpacing: -0.12,
});

const ContentArea = styled(Box)({
  flex: 1,
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

// ============================================================================
// Component
// ============================================================================

export function SendSheet({
  visible,
  onClose,
  tokens,
  blockchain,
  account,
  onSuccess,
  showUnverifiedTokens,
  className,
  style,
}: SendSheetProps) {
  // Bitcoin has only one token (BTC), so skip token selection
  const skipTokenSelect = blockchain === 'bitcoin';

  // Step management
  const [step, setStep] = useState<SendStep>(
    skipTokenSelect ? 'address-amount' : 'token-select'
  );
  const [selectedToken, setSelectedToken] = useState<SendToken | null>(
    skipTokenSelect && tokens.length > 0 ? tokens[0] : null
  );
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Send hook
  const sendHook = useSendTransaction({ account, blockchain });

  // Handle close with state reset
  const handleClose = useCallback(() => {
    onClose();
    // Delay reset so the close animation finishes
    setTimeout(() => {
      if (skipTokenSelect && tokens.length > 0) {
        setStep('address-amount');
        setSelectedToken(tokens[0]);
      } else {
        setStep('token-select');
        setSelectedToken(null);
      }
      setRecipientAddress('');
      setAmount('');
      sendHook.reset();
    }, 300);
  }, [onClose, sendHook, skipTokenSelect, tokens]);

  // Reset state when dialog opens
  useEffect(() => {
    if (visible) {
      if (skipTokenSelect && tokens.length > 0) {
        setStep('address-amount');
        setSelectedToken(tokens[0]);
      } else {
        setStep('token-select');
        setSelectedToken(null);
      }
      setRecipientAddress('');
      setAmount('');
    }
  }, [visible, skipTokenSelect, tokens]);

  // Step navigation handlers
  const handleSelectToken = useCallback((token: SendToken) => {
    setSelectedToken(token);
    setStep('address-amount');
  }, []);

  const handleBackToTokenSelect = useCallback(() => {
    setStep('token-select');
  }, []);

  const handleReview = useCallback((address: string, amt: string) => {
    setRecipientAddress(address);
    setAmount(amt);
    setStep('confirmation');
  }, []);

  const handleBackToAddressAmount = useCallback(() => {
    setStep('address-amount');
    sendHook.reset();
  }, [sendHook]);

  const handleSuccess = useCallback(
    (txId: string) => {
      onSuccess?.(txId);
      handleClose();
    },
    [onSuccess, handleClose]
  );

  // Back button handler
  const handleBackPress = useCallback(() => {
    if (step === 'confirmation') {
      handleBackToAddressAmount();
    } else if (step === 'address-amount') {
      if (skipTokenSelect) {
        handleClose();
      } else {
        handleBackToTokenSelect();
      }
    }
  }, [step, skipTokenSelect, handleBackToAddressAmount, handleBackToTokenSelect, handleClose]);

  const showBackButton = step !== 'token-select' || skipTokenSelect;

  return (
    <StyledDialog
      open={visible}
      onClose={handleClose}
      aria-labelledby="send-sheet-title"
      className={className}
      PaperProps={{ style }}
    >
      {/* Decorative background */}
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

      {/* Header Area */}
      <HeaderArea>
        {/* Drag Handle (decorative in web) */}
        <HandleContainer>
          <Handle />
        </HandleContainer>

        {/* Title Row with Back Button */}
        <TitleRow>
          {showBackButton && (
            <BackButton
              onClick={handleBackPress}
              aria-label="Go back"
              size="small"
            >
              <ArrowBackIcon sx={{ fontSize: 24 }} />
            </BackButton>
          )}
          <TitleText id="send-sheet-title">Send</TitleText>
        </TitleRow>
      </HeaderArea>

      {/* Content */}
      <ContentArea>
        {step === 'token-select' && (
          <StepTokenSelect
            tokens={tokens}
            onSelectToken={handleSelectToken}
            showUnverifiedTokens={showUnverifiedTokens}
          />
        )}

        {step === 'address-amount' && selectedToken && (
          <StepAddressAmount
            token={selectedToken}
            blockchain={blockchain}
            onBack={handleBackToTokenSelect}
            onReview={handleReview}
            onCancel={handleClose}
          />
        )}

        {step === 'confirmation' && selectedToken && (
          <StepConfirmation
            token={selectedToken}
            recipientAddress={recipientAddress}
            amount={amount}
            blockchain={blockchain}
            account={account}
            onBack={handleBackToAddressAmount}
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </ContentArea>
    </StyledDialog>
  );
}

export default SendSheet;
