/**
 * SendPage - Full-page multi-step send flow
 *
 * Replaces the former SendSheet dialog.
 * Renders as a full page with back navigation, matching the
 * page-navigation pattern used by other extension pages.
 *
 * Content: 3-step send flow (Token Select -> Address & Amount -> Confirmation)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  colors,
  spacing,
  useSendTransaction,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { StepTokenSelect } from './StepTokenSelect';
import { StepAddressAmount } from './StepAddressAmount';
import { StepConfirmation } from './StepConfirmation';
import type { SendPageProps, SendStep, SendToken } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.background.secondary,
  position: 'relative',
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const Title = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const ScrollContent = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
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

export function SendPage({
  tokens,
  blockchain,
  account,
  onBack,
  onSuccess,
  showUnverifiedTokens,
}: SendPageProps) {
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

  // Reset state on mount
  useEffect(() => {
    if (skipTokenSelect && tokens.length > 0) {
      setStep('address-amount');
      setSelectedToken(tokens[0]);
    } else {
      setStep('token-select');
      setSelectedToken(null);
    }
    setRecipientAddress('');
    setAmount('');
  }, [skipTokenSelect, tokens]);

  // Exit handler (navigates back to home)
  const handleExit = useCallback(() => {
    sendHook.reset();
    onBack();
  }, [onBack, sendHook]);

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
      onBack();
    },
    [onSuccess, onBack]
  );

  // Header back button handler
  const handleBackPress = useCallback(() => {
    if (step === 'confirmation') {
      handleBackToAddressAmount();
    } else if (step === 'address-amount') {
      if (skipTokenSelect) {
        handleExit();
      } else {
        handleBackToTokenSelect();
      }
    } else {
      // token-select step: go back to home
      handleExit();
    }
  }, [step, skipTokenSelect, handleBackToAddressAmount, handleBackToTokenSelect, handleExit]);

  return (
    <Container>
      <ScalesBackground
        strokeColor="rgba(255, 255, 255, 0.03)"
        strokeWidth={1}
        patternHeight={26}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      />

      <Header>
        <BackButton onClick={handleBackPress} aria-label="Back">
          <ArrowBackIcon />
        </BackButton>
        <Title>Send</Title>
      </Header>

      <ScrollContent>
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
              account={account}
              onBack={handleBackToTokenSelect}
              onReview={handleReview}
              onCancel={handleExit}
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
              onCancel={handleExit}
              onSuccess={handleSuccess}
            />
          )}
        </ContentArea>
      </ScrollContent>
    </Container>
  );
}

export default SendPage;
