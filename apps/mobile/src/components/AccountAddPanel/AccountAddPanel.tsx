/**
 * AccountAddPanel - Multi-step account creation flow for mobile
 *
 * Steps:
 * 1. select-method: Choose between deriving or importing
 * 2. derive-scan: Scan for derived accounts using DerivedAccountCard
 * 3. import-seed: Enter seed phrase using SeedPhrase component
 * 4. set-name: Choose account name
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  fontSize,
  fontFamilyNative,
  useAccountsContext,
  scanDerivedAccounts,
  validateMnemonic,
  normalizeMnemonic,
  createAccount,
  NETWORK_DISPLAY,
  SCAN_NETWORKS,
  type AccountAddStep,
  type DerivedAccountInfo,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';
import { useSettingsHeaderOverride } from '../SettingsHeaderContext';
import { PrimaryButton } from '../Button';
import { DerivedAccountCard } from '../DerivedAccountCard';
import { LoadingScreen } from '../LoadingScreen';
import type { AccountAddPanelProps } from './types';

// ============================================================================
// Component
// ============================================================================

export function AccountAddPanel({
  onComplete,
  onBack,
}: AccountAddPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const [accountState, accountActions] = useAccountsContext();
  const { accounts, activeAccount } = accountState;

  // Step state
  const [step, setStep] = useState<AccountAddStep>('select-method');

  // Derive flow state
  const [derivedAccounts, setDerivedAccounts] = useState<DerivedAccountInfo[]>([]);
  const [selectedDerived, setSelectedDerived] = useState<DerivedAccountInfo | null>(null);
  const [scanning, setScanning] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Import flow state
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');

  // Name step state
  const defaultName = useMemo(
    () => t('settings.account_add.default_name', { number: accounts.length + 1 }),
    [accounts.length, t],
  );
  const [accountName, setAccountName] = useState('');

  // ========================================================================
  // Step handlers
  // ========================================================================

  const handleSelectDerive = useCallback(async () => {
    if (!activeAccount?.mnemonic) return;
    setStep('derive-scan');
    setScanning(true);
    try {
      const results = await scanDerivedAccounts(
        activeAccount.mnemonic,
        [...SCAN_NETWORKS],
      );
      setDerivedAccounts(results);
    } catch {
      setDerivedAccounts([]);
    } finally {
      setScanning(false);
    }
  }, [activeAccount]);

  const handleSelectImport = useCallback(() => {
    setStep('import-seed');
  }, []);

  const handleDerivedSelect = useCallback((account: DerivedAccountInfo) => {
    setSelectedDerived(prev => prev?.address === account.address ? null : account);
  }, []);

  const handleDerivedContinue = useCallback(() => {
    if (!selectedDerived) return;
    setAccountName(defaultName);
    setStep('set-name');
  }, [selectedDerived, defaultName]);

  const handleSeedSubmit = useCallback(() => {
    const normalized = normalizeMnemonic(seedPhrase);
    if (!validateMnemonic(normalized)) {
      setSeedError(t('wallet.create.invalidSeed'));
      return;
    }
    setSeedError('');
    setSeedPhrase(normalized);
    setAccountName(defaultName);
    setStep('set-name');
  }, [seedPhrase, defaultName, t]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;
    const name = accountName.trim() || defaultName;
    setLoading(true);
    try {
      const mnemonic = selectedDerived ? (activeAccount?.mnemonic || '') : seedPhrase;
      const startIndex = selectedDerived ? selectedDerived.index : 0;
      const { account } = await createAccount({
        name,
        mnemonic,
        networkIds: [...SCAN_NETWORKS],
        startIndex,
      });
      await accountActions.addAccount(account);
      onComplete();
    } catch {
      setLoading(false);
      Alert.alert(t('general.error'), t('settings.account_add.creation_error'));
    }
  }, [loading, accountName, defaultName, selectedDerived, activeAccount, seedPhrase, accountActions, onComplete, t]);

  const handleStepBack = useCallback(() => {
    if (step === 'set-name') {
      setStep(selectedDerived ? 'derive-scan' : 'import-seed');
    } else if (step === 'derive-scan' || step === 'import-seed') {
      setStep('select-method');
    } else {
      onBack();
    }
  }, [step, selectedDerived, onBack]);

  // ========================================================================
  // Render helpers
  // ========================================================================

  const renderSelectMethod = () => (
    <View style={styles.methodContainer}>
      <TouchableOpacity
        style={styles.methodCard}
        onPress={handleSelectDerive}
        activeOpacity={0.7}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="git-branch-outline" size={28} color={colors.accent.primary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>{t('settings.account_add.create_new')}</Text>
          <Text style={styles.methodDescription}>
            {t('settings.account_add.create_new_description')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.methodCard}
        onPress={handleSelectImport}
        activeOpacity={0.7}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="document-text-outline" size={28} color={colors.accent.primary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>{t('settings.account_add.import_seed')}</Text>
          <Text style={styles.methodDescription}>
            {t('settings.account_add.import_seed_description')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderDeriveScan = () => (
    <View>
      {scanning ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>{t('settings.account_add.scanning')}</Text>
        </View>
      ) : (
        <>
          {derivedAccounts.map((item: DerivedAccountInfo) => (
            <DerivedAccountCard
              key={`${item.networkId}-${item.address}`}
              address={item.address}
              networkName={item.networkName}
              path={item.path}
              balanceFormatted={item.balanceFormatted}
              selected={selectedDerived?.address === item.address}
              dimmed={item.balance === 0}
              onToggle={() => handleDerivedSelect(item)}
              blockchain={NETWORK_DISPLAY[item.networkId]?.blockchain}
            />
          ))}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              onPress={handleDerivedContinue}
              disabled={!selectedDerived}
            >
              {t('actions.continue')}
            </PrimaryButton>
          </View>
        </>
      )}
    </View>
  );

  const renderImportSeed = () => (
    <View>
      <Text style={styles.inputLabel}>{t('settings.account_add.import_seed')}</Text>
      <TextInput
        style={styles.seedInput}
        value={seedPhrase}
        onChangeText={(text: string) => {
          setSeedPhrase(text);
          if (seedError) setSeedError('');
        }}
        placeholder={t('settings.account_add.seed_placeholder', 'Enter your seed phrase...')}
        placeholderTextColor={colors.text.tertiary}
        multiline
        numberOfLines={4}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
      />
      {seedError ? <Text style={styles.errorText}>{seedError}</Text> : null}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleSeedSubmit}>
          {t('actions.continue')}
        </PrimaryButton>
      </View>
    </View>
  );

  const renderSetName = () => (
    <View>
      <Text style={styles.inputLabel}>{t('settings.account_add.set_name')}</Text>
      <TextInput
        style={styles.input}
        value={accountName}
        onChangeText={setAccountName}
        placeholder={t('settings.account_add.set_name_placeholder')}
        placeholderTextColor={colors.text.tertiary}
        autoFocus
        maxLength={32}
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleConfirm}>
          {t('settings.account_add.confirm')}
        </PrimaryButton>
      </View>
    </View>
  );

  // ========================================================================
  // Main render
  // ========================================================================

  const stepTitles: Record<AccountAddStep, string> = {
    'select-method': t('settings.account_add.title'),
    'derive-scan': t('settings.account_add.create_new'),
    'import-seed': t('settings.account_add.import_seed'),
    'set-name': t('settings.account_add.set_name'),
    'complete': t('settings.account_add.title'),
  };
  const currentTitle = stepTitles[step];

  useSettingsHeaderOverride({
    title: currentTitle,
    onBack: handleStepBack,
  });

  return (
    <>
      <LoadingScreen
        visible={loading}
        title={selectedDerived
          ? t('settings.account_add.confirm_create')
          : t('settings.account_add.confirm_import')}
        subtitle={t('general.loading')}
      />
      <SettingsScreenLayout title={currentTitle} onBack={handleStepBack}>
        {step === 'select-method' && renderSelectMethod()}
        {step === 'derive-scan' && renderDeriveScan()}
        {step === 'import-seed' && renderImportSeed()}
        {step === 'set-name' && renderSetName()}
      </SettingsScreenLayout>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  methodContainer: {
    gap: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  methodTitle: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
    marginBottom: spacing.xxs,
  },
  methodDescription: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.status.error,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
  },
  seedInput: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
    minHeight: 120,
  },
});
