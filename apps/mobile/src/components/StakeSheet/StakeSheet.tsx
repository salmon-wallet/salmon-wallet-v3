import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  borderRadius,
  borderWidth,
  colors,
  fontFamilyNative,
  fontSize,
  getDefaultExplorer,
  getShortAddress,
  getTransactionUrl,
  ms,
  s,
  spacing,
  vs,
} from '@salmon/shared';
import type { Blockchain, NetworkEnvironment, StakeValidator } from '@salmon/shared';

import { inspectTransactionSigStatus, signAndSubmitActionTransaction } from '../../blinks';
import { BottomSheetContainer } from '../BottomSheetContainer';
import { BottomSheetTitleHeader } from '../BottomSheetTitleHeader';
import { PrimaryButton, SecondaryButton } from '../Button';
import { TransactionSuccessScreen } from '../TransactionSuccessScreen';
import type { StakeSheetProps } from './types';
import { solToLamports } from './utils';

const RESET_DELAY_MS = 300;

export const StakeSheet: React.FC<StakeSheetProps> = ({
  visible,
  onClose,
  account,
  networkId,
  getValidators,
  createDelegation,
  onSuccess,
  style,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [validators, setValidators] = useState<StakeValidator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<StakeValidator | null>(null);
  const [validatorsEnabled, setValidatorsEnabled] = useState(false);
  const [loadingValidators, setLoadingValidators] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSignature, setSuccessSignature] = useState<string | null>(null);
  const [successStakeAccount, setSuccessStakeAccount] = useState<string | null>(null);
  const previousVisibleRef = useRef(visible);

  const isReady = !!account && !!networkId;
  const canSubmit = isReady && validatorsEnabled && !!selectedValidator && !!solToLamports(amount) && !submitting;

  const explorerUrl = useMemo(() => {
    if (!account || !successSignature) return undefined;

    return getTransactionUrl(
      'SOLANA' as Blockchain,
      account.getNetworkId() as NetworkEnvironment,
      getDefaultExplorer('SOLANA' as Blockchain),
      successSignature,
    );
  }, [account, successSignature]);

  const resetState = useCallback(() => {
    setAmount('');
    setValidators([]);
    setSelectedValidator(null);
    setValidatorsEnabled(false);
    setLoadingValidators(false);
    setSubmitting(false);
    setError(null);
    setSuccessSignature(null);
    setSuccessStakeAccount(null);
  }, []);

  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = visible;

    if (!visible && wasVisible) {
      const timer = setTimeout(resetState, RESET_DELAY_MS);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [resetState, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    if (!networkId) {
      setValidatorsEnabled(false);
      setValidators([]);
      setSelectedValidator(null);
      setError(t('stake.unsupportedNetwork'));
      return undefined;
    }

    let cancelled = false;
    setLoadingValidators(true);
    setError(null);

    getValidators(networkId)
      .then((response) => {
        if (cancelled) return;

        setValidatorsEnabled(response.enabled);
        setValidators(response.validators);
        setSelectedValidator(response.validators[0] ?? null);
        if (!response.enabled || response.validators.length === 0) {
          setError(t('stake.validatorsUnavailable'));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setValidatorsEnabled(false);
        setValidators([]);
        setSelectedValidator(null);
        setError(t('stake.validatorsUnavailable'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingValidators(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getValidators, networkId, t, visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!account || !networkId) {
      setError(t('stake.unsupportedNetwork'));
      return;
    }

    if (!selectedValidator) {
      setError(t('stake.selectValidator'));
      return;
    }

    const amountLamports = solToLamports(amount);
    if (!amountLamports) {
      setError(t('stake.invalidAmount'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const delegation = await createDelegation({
        networkId,
        account: account.getReceiveAddress(),
        amountLamports,
        validator: selectedValidator.voteAccount,
      });
      const connection = await account.getConnection();
      const sigStatus = inspectTransactionSigStatus(delegation.transaction);
      const result = await signAndSubmitActionTransaction({
        serializedTransactionBase64: delegation.transaction,
        account,
        connection,
        partialSigned: sigStatus.partialSigned,
      });

      setSuccessSignature(result.signature);
      setSuccessStakeAccount(delegation.stakeAccount);
      onSuccess?.(result.signature);
    } catch {
      setError(t('stake.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [account, amount, createDelegation, networkId, onSuccess, selectedValidator, t]);

  const headerContent = (
    <BottomSheetTitleHeader
      title={t('stake.title')}
      backAccessibilityLabel={t('general.back', 'Back')}
    />
  );

  return (
    <BottomSheetContainer
      visible={visible}
      onClose={handleClose}
      headerContent={successSignature ? undefined : headerContent}
      style={style}
    >
      {successSignature ? (
        <TransactionSuccessScreen
          title={t('stake.successTitle')}
          summary={t('stake.successSummary', { amount }) + (
            successStakeAccount
              ? ` - ${t('stake.stakeAccount')}: ${getShortAddress(successStakeAccount) ?? successStakeAccount}`
              : ''
          )}
          explorerUrl={explorerUrl ?? null}
          onContinue={handleClose}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('stake.amount')}</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(value);
                  setError(null);
                }}
                placeholder={t('stake.amountPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('stake.validator')}</Text>
              {loadingValidators ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.accent.primary} />
                  <Text style={styles.mutedText}>{t('stake.loadingValidators')}</Text>
                </View>
              ) : (
                validators.map((validator) => {
                  const selected = validator.voteAccount === selectedValidator?.voteAccount;

                  return (
                    <TouchableOpacity
                      key={validator.voteAccount}
                      style={[styles.validatorRow, selected && styles.validatorRowSelected]}
                      onPress={() => {
                        setSelectedValidator(validator);
                        setError(null);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.validatorLabel} numberOfLines={1}>
                        {validator.label}
                      </Text>
                      <Text style={styles.validatorAddress} numberOfLines={1}>
                        {getShortAddress(validator.voteAccount, 4) ?? validator.voteAccount}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actions}>
              <SecondaryButton onPress={handleClose} disabled={submitting}>
                {t('actions.cancel')}
              </SecondaryButton>
              <PrimaryButton
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              >
                {submitting ? t('stake.submitting') : t('stake.submit')}
              </PrimaryButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(spacing['3xl']),
    gap: vs(spacing.lg),
  },
  fieldGroup: {
    gap: vs(spacing.sm),
  },
  label: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  input: {
    height: vs(56),
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.input.border,
    backgroundColor: colors.input.background,
    color: colors.text.primary,
    fontSize: ms(fontSize.lg),
    fontFamily: fontFamilyNative.medium,
    paddingHorizontal: s(spacing.lg),
  },
  loadingRow: {
    minHeight: vs(72),
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(spacing.sm),
  },
  mutedText: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
  },
  validatorRow: {
    minHeight: vs(72),
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    paddingHorizontal: s(spacing.lg),
    gap: vs(spacing.xs),
  },
  validatorRowSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.tint,
  },
  validatorLabel: {
    fontSize: ms(fontSize.base),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  validatorAddress: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.status.error,
  },
  actions: {
    gap: vs(spacing.md),
    paddingTop: vs(spacing.sm),
  },
});

export default StakeSheet;
