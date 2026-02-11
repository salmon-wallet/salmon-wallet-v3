/**
 * SwapScreen - Unified swap/bridge interface (Web/Extension)
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Replaces RN Alert with window.alert, uses web TokenSelectorModal.
 */
import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { colors, useSwapScreenLogic } from '@salmon/shared';
import { SwapInputScreen } from './SwapInputScreen';
import { SwapReviewScreen } from './SwapReviewScreen';
import { BridgeRecipientScreen } from '../BridgeScreen/BridgeRecipientScreen';
import { BridgeReviewScreen } from '../BridgeScreen/BridgeReviewScreen';
import { TokenSelectorModal } from '../TokenSelector';
import { ScalesBackground } from '../ScalesBackground';
import type { SwapScreenProps } from './types';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  backgroundColor: colors.background.secondary,
  position: 'relative',
  overflow: 'hidden',
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
});

export function SwapScreen(props: SwapScreenProps): React.ReactElement {
  const { style } = props;

  const logic = useSwapScreenLogic({
    ...props,
    onBridgeInitiated: (exchange, inAmount, inSymbol, outSymbol) => {
      window.alert(
        `Swap Initiated!\n\nPlease send ${inAmount} ${inSymbol} to:\n${exchange.depositAddress}\n\nYou will receive approximately ${exchange.amountOut} ${outSymbol}`
      );
    },
  });

  return (
    <Container style={style}>
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

      {logic.step === 'input' && (
        <SwapInputScreen
          inToken={logic.inToken}
          outToken={logic.outToken}
          inAmount={logic.inAmount}
          outAmount={logic.outAmount}
          onInAmountChange={logic.setInAmount}
          onInTokenPress={() => logic.setShowInTokenModal(true)}
          onOutTokenPress={() => logic.setShowOutTokenModal(true)}
          inUsdValue={logic.inUsdValue}
          isLoadingQuote={logic.isLoadingQuote || logic.isLoadingEstimate}
          canReview={logic.canReview}
          onReview={logic.handleReview}
        />
      )}

      {logic.step === 'review' && logic.swapMode === 'jupiter' && logic.quote && logic.inToken && logic.outToken && (
        <SwapReviewScreen
          quote={logic.quote}
          inToken={logic.inToken}
          outToken={logic.outToken}
          onBack={logic.handleBackFromReview}
          onConfirm={logic.handleConfirmSwap}
          isConfirming={logic.isConfirming}
        />
      )}

      {logic.step === 'recipient' && logic.swapMode === 'stealthex' && (
        <BridgeRecipientScreen
          recipientAddress={logic.recipientAddress}
          onAddressChange={logic.setRecipientAddress}
          targetChain={logic.bridgeTargetChain}
          onBack={logic.handleBackFromRecipient}
          onContinue={logic.handleContinueToReview}
          isValidAddress={logic.addressValidation.valid}
          addressError={logic.addressError}
        />
      )}

      {logic.step === 'review' && logic.swapMode === 'stealthex' && logic.bridgeInToken && logic.bridgeOutToken && (
        <BridgeReviewScreen
          inToken={logic.bridgeInToken}
          outToken={logic.bridgeOutToken}
          inAmount={logic.inAmount}
          outAmount={logic.outAmount}
          recipientAddress={logic.recipientAddress}
          estimate={logic.bridgeEstimateForReview}
          onBack={logic.handleBackFromReview}
          onConfirm={logic.handleConfirmBridge}
          isConfirming={logic.isConfirming}
        />
      )}

      <TokenSelectorModal
        visible={logic.showInTokenModal}
        onClose={() => logic.setShowInTokenModal(false)}
        tokens={logic.modalInTokens}
        featuredTokens={logic.modalFeaturedTokens}
        onSelect={logic.handleInTokenModalSelect}
        onSearch={logic.handleSearchTokens}
        showNetworkChip={true}
      />

      <TokenSelectorModal
        visible={logic.showOutTokenModal}
        onClose={() => logic.setShowOutTokenModal(false)}
        tokens={logic.modalOutTokens}
        onSelect={logic.handleOutTokenModalSelect}
        showNetworkChip={true}
        hiddenBalance={logic.swapMode === 'stealthex'}
      />
    </Container>
  );
}

export default SwapScreen;
