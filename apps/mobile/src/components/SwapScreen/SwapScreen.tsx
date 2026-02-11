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
  const {
    style,
    tokens,
    onSearchTokens,
  } = props;

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
      {/* Input Screen */}
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

      {/* Recipient Screen (Bridge only) */}
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

      {/* Review Screen (Jupiter) */}
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

      {/* Review Screen (StealthEX) */}
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

      {/* Input Token Selection Modal */}
      <TokenSelectorModal
        visible={logic.showInTokenModal}
        onClose={() => logic.setShowInTokenModal(false)}
        tokens={logic.modalInTokens}
        featuredTokens={logic.modalFeaturedTokens}
        onSelect={(token) => {
          const originalToken = tokens.find(
            (t) => t.address === (token.mint || token.address)
          );
          logic.handleInTokenSelect({
            address: token.mint || token.address || '',
            symbol: token.symbol || '',
            name: token.name,
            decimals: originalToken?.decimals || 9,
            logo: token.logo,
            balance: token.uiAmount,
            usdPrice: originalToken?.usdPrice,
            chain: originalToken?.chain,
            networkId: originalToken?.networkId,
          });
        }}
        onSearch={onSearchTokens ? async (query) => {
          const results = await onSearchTokens(query);
          return results.map((t) => ({
            ...t,
            mint: t.address,
            uiAmount: t.balance || 0,
          }));
        } : undefined}
        showNetworkChip={true}
      />

      {/* Output Token Selection Modal */}
      <TokenSelectorModal
        visible={logic.showOutTokenModal}
        onClose={() => logic.setShowOutTokenModal(false)}
        tokens={logic.modalOutTokens}
        onSelect={(token) => {
          const originalToken = logic.outputTokens.find(
            (t) => t.address === (token.mint || token.address) || t.symbol === token.symbol
          );
          logic.handleOutTokenSelect({
            address: token.mint || token.address || '',
            symbol: token.symbol || '',
            name: token.name,
            decimals: originalToken?.decimals || 9,
            logo: token.logo,
            balance: token.uiAmount,
            usdPrice: originalToken?.usdPrice,
            chain: originalToken?.chain,
            networkId: originalToken?.networkId || token.network,
          });
        }}
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
