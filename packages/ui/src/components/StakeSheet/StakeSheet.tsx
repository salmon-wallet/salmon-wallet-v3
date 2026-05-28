import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import {
  borderRadius,
  borderWidth,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  getDefaultExplorer,
  getShortAddress,
  getTransactionUrl,
  inspectSerializedSolanaTransactionSigStatus,
  signAndSubmitSerializedSolanaTransaction,
  solToLamports,
  spacing,
} from '@salmon/shared';
import type { Blockchain, NetworkEnvironment, StakeValidator } from '@salmon/shared';

import { styled } from '../../utils/styled';
import { BaseSheetDialog } from '../BaseSheetDialog';
import { PrimaryButton, SecondaryButton } from '../Button';
import { TransactionSuccessScreen } from '../TransactionSuccessScreen';
import type { StakeSheetProps } from './types';

const RESET_DELAY_MS = 250;

const FormContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  width: '100%',
});

const FieldGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
});

const Label = styled(Typography)({
  fontSize: fontSize.base,
  fontFamily: fontFamily.sans,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

const AmountInput = styled('input')({
  height: 56,
  borderRadius: borderRadius.lg,
  border: `${borderWidth.thin}px solid ${colors.input.border}`,
  background: colors.input.background,
  color: colors.text.primary,
  fontSize: fontSize.lg,
  fontFamily: fontFamily.sans,
  fontWeight: fontWeight.semibold,
  padding: `0 ${spacing.lg}px`,
  outline: 'none',
  '&:focus': {
    borderColor: colors.accent.primary,
  },
  '&::placeholder': {
    color: colors.text.tertiary,
  },
});

const LoadingRow = styled(Box)({
  minHeight: 72,
  borderRadius: borderRadius.lg,
  border: `${borderWidth.thin}px solid ${colors.border.subtle}`,
  background: colors.background.card,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
});

const MutedText = styled(Typography)({
  fontSize: fontSize.base,
  fontFamily: fontFamily.sans,
  color: colors.text.secondary,
});

const ValidatorRow = styled(ButtonBase)<{ $selected?: boolean }>(({ $selected }) => ({
  width: '100%',
  minHeight: 72,
  borderRadius: borderRadius.lg,
  border: `${borderWidth.thin}px solid ${$selected ? colors.accent.primary : colors.border.subtle}`,
  background: $selected ? colors.accent.tint : colors.background.card,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: spacing.xs,
  padding: `0 ${spacing.lg}px`,
  textAlign: 'left',
}));

const ValidatorLabel = styled(Typography)({
  fontSize: fontSize.base,
  fontFamily: fontFamily.sans,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const ValidatorAddress = styled(Typography)({
  fontSize: fontSize.sm,
  fontFamily: fontFamily.sans,
  color: colors.text.secondary,
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const ErrorText = styled(Typography)({
  fontSize: fontSize.sm,
  fontFamily: fontFamily.sans,
  color: colors.status.error,
});

const Actions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  paddingTop: spacing.sm,
});

export function StakeSheet({
  visible,
  onClose,
  account,
  networkId,
  getValidators,
  createDelegation,
  onSuccess,
  className,
  style,
}: StakeSheetProps): React.ReactElement {
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

  const canSubmit = !!account
    && !!networkId
    && validatorsEnabled
    && !!selectedValidator
    && !!solToLamports(amount)
    && !submitting;

  const explorerUrl = useMemo(() => {
    if (!account || !successSignature) return null;

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
      const sigStatus = inspectSerializedSolanaTransactionSigStatus(delegation.transaction);
      const result = await signAndSubmitSerializedSolanaTransaction({
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

  return (
    <BaseSheetDialog
      visible={visible}
      onClose={onClose}
      size="small"
      colorScheme="dialog"
      showScalesBackground
      ariaLabelledBy="stake-sheet-title"
      className={className}
      style={style}
    >
      {successSignature ? (
        <BaseSheetDialog.Content padding="xl" style={{ minHeight: 420 }}>
          <TransactionSuccessScreen
            title={t('stake.successTitle')}
            summary={t('stake.successSummary', { amount }) + (
              successStakeAccount
                ? ` - ${t('stake.stakeAccount')}: ${getShortAddress(successStakeAccount) ?? successStakeAccount}`
                : ''
            )}
            explorerUrl={explorerUrl}
            onContinue={onClose}
          />
        </BaseSheetDialog.Content>
      ) : (
        <>
          <BaseSheetDialog.StandardHeader title={t('stake.title')} />
          <BaseSheetDialog.Content padding="xl">
            <FormContent>
              <FieldGroup>
                <Label>{t('stake.amount')}</Label>
                <AmountInput
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.currentTarget.value);
                    setError(null);
                  }}
                  placeholder={t('stake.amountPlaceholder')}
                  inputMode="decimal"
                  autoComplete="off"
                />
              </FieldGroup>

              <FieldGroup>
                <Label>{t('stake.validator')}</Label>
                {loadingValidators ? (
                  <LoadingRow>
                    <CircularProgress size={24} sx={{ color: colors.accent.primary }} />
                    <MutedText>{t('stake.loadingValidators')}</MutedText>
                  </LoadingRow>
                ) : (
                  validators.map((validator) => {
                    const selected = validator.voteAccount === selectedValidator?.voteAccount;

                    return (
                      <ValidatorRow
                        key={validator.voteAccount}
                        $selected={selected}
                        onClick={() => {
                          setSelectedValidator(validator);
                          setError(null);
                        }}
                        aria-pressed={selected}
                      >
                        <ValidatorLabel>{validator.label}</ValidatorLabel>
                        <ValidatorAddress>
                          {getShortAddress(validator.voteAccount, 4) ?? validator.voteAccount}
                        </ValidatorAddress>
                      </ValidatorRow>
                    );
                  })
                )}
              </FieldGroup>

              {error && <ErrorText>{error}</ErrorText>}

              <Actions>
                <SecondaryButton onClick={onClose} disabled={submitting}>
                  {t('actions.cancel')}
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  loading={submitting}
                >
                  {submitting ? t('stake.submitting') : t('stake.submit')}
                </PrimaryButton>
              </Actions>
            </FormContent>
          </BaseSheetDialog.Content>
        </>
      )}
    </BaseSheetDialog>
  );
}
