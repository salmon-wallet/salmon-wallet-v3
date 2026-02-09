/**
 * SwapInputScreen - First step of swap flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses CSS gradients instead of expo-linear-gradient.
 */
import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import {
  colors,
  spacing,
  borderRadius,
  gradients,
  fontFamily,
  fontWeight,
} from '@salmon/shared';
import { SwapAmountInput } from './SwapAmountInput';
import { PrimaryButton } from '../Button';
import type { SwapInputScreenProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: `${spacing['3xl'] + spacing['3xl']}px ${spacing.headerPadding}px ${spacing['2xl']}px`,
  position: 'relative',
});

const InputsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing['2xl'],
});

const ButtonContainer = styled(Box)({
  position: 'absolute',
  bottom: spacing['2xl'],
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
});

const GradientButton = styled('div')<{ $canReview: boolean }>(({ $canReview }) => ({
  borderRadius: borderRadius.lg,
  border: '0.8px solid rgba(255, 92, 69, 0.8)',
  boxShadow: '0 0 12px rgba(0, 0, 0, 0.64)',
  background: $canReview ? gradients.primaryCSS : gradients.disabledCSS,
  minWidth: 180,
}));

// ============================================================================
// SwapInputScreen Component
// ============================================================================

/**
 * SwapInputScreen - First step of swap flow
 * Shows input/output token selectors and amounts
 */
export function SwapInputScreen({
  inToken,
  outToken,
  inAmount,
  outAmount,
  onInAmountChange,
  onInTokenPress,
  onOutTokenPress,
  inUsdValue,
  isLoadingQuote = false,
  canReview,
  onReview,
  style,
}: SwapInputScreenProps): React.ReactElement {
  return (
    <Container style={style}>
      {/* Input Fields */}
      <InputsContainer>
        {/* You Send */}
        <SwapAmountInput
          label="You Send"
          value={inAmount}
          onChangeValue={onInAmountChange}
          token={inToken}
          onTokenPress={onInTokenPress}
          usdValue={inUsdValue}
          availableBalance={inToken?.balance}
          editable={true}
          placeholder="Enter an amount"
        />

        {/* You Receive */}
        <SwapAmountInput
          label="You Receive"
          value={outAmount}
          onChangeValue={() => {}}
          token={outToken}
          onTokenPress={onOutTokenPress}
          editable={false}
          placeholder="0"
          isLoading={isLoadingQuote}
        />
      </InputsContainer>

      {/* Review Button */}
      <ButtonContainer>
        <GradientButton $canReview={canReview}>
          <PrimaryButton
            onClick={onReview}
            disabled={!canReview}
            style={{
              minWidth: 180,
              height: 42,
              background: 'transparent',
            }}
          >
            Review & Swap
          </PrimaryButton>
        </GradientButton>
      </ButtonContainer>
    </Container>
  );
}

export default SwapInputScreen;
