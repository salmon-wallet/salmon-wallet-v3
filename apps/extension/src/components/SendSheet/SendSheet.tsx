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
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import {
  useSendTransaction,
} from '@salmon/shared';
import { BaseSheetDialog } from '../BaseSheetDialog';
import { StepTokenSelect } from './StepTokenSelect';
import { StepAddressAmount } from './StepAddressAmount';
import { StepConfirmation } from './StepConfirmation';
import type { SendSheetProps, SendStep, SendToken } from './types';

// ============================================================================
// Styled Components
// ============================================================================

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
    <BaseSheetDialog
      visible={visible}
      onClose={handleClose}
      size="large"
      colorScheme="secondary"
      showScalesBackground={true}
      ariaLabelledBy="send-sheet-title"
      className={className}
      style={style}
    >
      <BaseSheetDialog.HandleHeader
        title="Send"
        showBackButton={showBackButton}
        onBack={handleBackPress}
      />

      <BaseSheetDialog.Content padding="none">
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
      </BaseSheetDialog.Content>
    </BaseSheetDialog>
  );
}

export default SendSheet;
