import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  fontFamilyNative,
  ms,
  vs,
  s,
  useSendTransaction,
  getTransactionUrl,
  getDefaultExplorer,
  getShortAddress,
} from '@salmon/shared';
import type { Blockchain, NetworkEnvironment } from '@salmon/shared';
import { useTranslation } from 'react-i18next';

import { BottomSheetContainer } from '../BottomSheetContainer';
import { StepTokenSelect } from './StepTokenSelect';
import { StepAddressAmount } from './StepAddressAmount';
import { StepConfirmation } from './StepConfirmation';
import { TransactionSuccessScreen } from '../TransactionSuccessScreen';
import type { SendSheetProps, SendStep, SendToken } from './types';

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 300;

// ============================================================================
// Component
// ============================================================================

export const SendSheet: React.FC<SendSheetProps> = ({
  visible,
  onClose,
  tokens,
  blockchain,
  account,
  onSuccess,
  showUnverifiedTokens,
  loading,
  style,
}) => {
  // Bitcoin has only one token (BTC), so skip token selection
  const skipTokenSelect = blockchain === 'bitcoin';

  // Step management
  const [step, setStep] = useState<SendStep>(skipTokenSelect ? 'address-amount' : 'token-select');
  const [selectedToken, setSelectedToken] = useState<SendToken | null>(
    skipTokenSelect && tokens.length > 0 ? tokens[0] : null
  );
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [successTxId, setSuccessTxId] = useState<string | null>(null);

  const { t } = useTranslation();

  // Send hook
  const sendHook = useSendTransaction({ account, blockchain });

  // Handle close with state reset
  const handleClose = useCallback(() => {
    onClose();
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
      setSuccessTxId(null);
      sendHook.reset();
    }, ANIMATION_DURATION);
  }, [onClose, sendHook, skipTokenSelect, tokens]);

  const handleSuccessContinue = useCallback(() => {
    if (successTxId) {
      onSuccess?.(successTxId);
    }
    handleClose();
  }, [successTxId, onSuccess, handleClose]);

  // Handle Android back button (step-aware)
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (step === 'success') {
          handleSuccessContinue();
        } else if (step === 'confirmation') {
          setStep('address-amount');
        } else if (step === 'address-amount' && !skipTokenSelect) {
          setStep('token-select');
        } else {
          handleClose();
        }
        return true;
      }
    );

    return () => backHandler.remove();
  }, [visible, step, skipTokenSelect, handleClose, handleSuccessContinue]);

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

  const handleSuccess = useCallback((txId: string) => {
    setSuccessTxId(txId);
    setStep('success');
  }, []);

  // Back button handler for the header
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
  const showHeader = step !== 'success';

  // Custom header content: title row with optional back button
  const headerContent = (
    <View style={styles.titleRow}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={ms(24)}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Send</Text>
      {/* Spacer to keep title centred when back button is shown */}
      {showBackButton && <View style={styles.backButtonSpacer} />}
    </View>
  );

  return (
    <BottomSheetContainer
      visible={visible}
      onClose={handleClose}
      headerContent={showHeader ? headerContent : undefined}
      style={style}
    >
      {/* Content */}
      <View style={styles.content}>
        {step === 'token-select' && (
          <StepTokenSelect
            tokens={tokens}
            onSelectToken={handleSelectToken}
            showUnverifiedTokens={showUnverifiedTokens}
            loading={loading}
          />
        )}

        {step === 'address-amount' && selectedToken && (
          <StepAddressAmount
            token={selectedToken}
            blockchain={blockchain}
            account={account}
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

        {step === 'success' && successTxId && selectedToken && (
          <TransactionSuccessScreen
            title={t('transaction.sendComplete')}
            summary={`${amount} ${selectedToken.symbol} to ${getShortAddress(recipientAddress) ?? recipientAddress}`}
            explorerUrl={getTransactionUrl(
              blockchain.toUpperCase() as Blockchain,
              (account as { network: { networkId: string } }).network.networkId as NetworkEnvironment,
              getDefaultExplorer(blockchain.toUpperCase() as Blockchain),
              successTxId
            )}
            onContinue={handleSuccessContinue}
          />
        )}
      </View>
    </BottomSheetContainer>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(18),
    marginBottom: vs(15),
  },
  backButton: {
    position: 'absolute',
    left: s(18),
    zIndex: 1,
  },
  backButtonSpacer: {
    width: ms(24),
  },
  title: {
    fontSize: ms(24),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: ms(-0.12, 0.3),
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SendSheet;
