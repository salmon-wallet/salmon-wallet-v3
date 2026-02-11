import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSwapScreenLogic } from '@salmon/shared';
import { SwapInputScreen } from './SwapInputScreen';
import { SwapReviewScreen } from './SwapReviewScreen';
import { TokenSelectorModal } from '../TokenSelector';
import { BridgeRecipientScreen } from '../BridgeScreen/BridgeRecipientScreen';
import { BridgeReviewScreen } from '../BridgeScreen/BridgeReviewScreen';
import type { SwapScreenProps } from './types';

/**
 * SwapScreen - Unified swap/bridge interface (React Native)
 *
 * Automatically detects whether to use:
 * - Jupiter: for same-chain Solana swaps
 * - StealthEX: for cross-chain bridges
 */
export const SwapScreen: React.FC<SwapScreenProps> = (props) => {
  const { style } = props;

  const logic = useSwapScreenLogic({
    ...props,
    onBridgeInitiated: (exchange, inAmount, inSymbol, outSymbol) => {
      Alert.alert(
        'Swap Initiated',
        `Please send ${inAmount} ${inSymbol} to:\n\n${exchange.depositAddress}\n\nYou will receive approximately ${exchange.amountOut} ${outSymbol}`,
        [{ text: 'OK' }]
      );
    },
  });

  return (
    <View style={[styles.container, style]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default SwapScreen;
