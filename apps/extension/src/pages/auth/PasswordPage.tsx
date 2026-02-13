/**
 * PasswordPage - Set password for wallet encryption
 *
 * Mirrors mobile password.tsx flow for the extension.
 * Supports both new password creation and existing password verification.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  createAccount,
  generateAccountName,
  PASSWORD_CONSTRAINTS,
  validatePassword,
  useAccountsContext,
} from '@salmon/shared';
import {
  ScreenHeader,
  PrimaryButton,
  PasswordInput,
  PasswordStrengthBar,
  LoadingScreen,
} from '../../components';

interface PasswordPageProps {
  mnemonic: string;
  flowType: 'create' | 'recover';
  onCreating?: () => void;
  onSuccess: () => void;
  onBack: () => void;
}

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
});

const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `0 ${spacing['2xl']}px`,
});

const LogoImage = styled('img')({
  width: 60,
  height: 60,
  objectFit: 'contain',
  marginBottom: spacing['2xl'],
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 28,
  lineHeight: '36px',
  marginBottom: spacing.sm,
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  lineHeight: '24px',
  marginBottom: spacing['3xl'],
  textAlign: 'center',
});

const InputContainer = styled(Box)({
  width: '100%',
  marginBottom: spacing.lg,
});

const StrengthContainer = styled(Box)({
  marginTop: spacing.sm,
  paddingLeft: spacing.xs,
  paddingRight: spacing.xs,
});

const ErrorText = styled(Typography)({
  color: colors.status.error,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 12,
  lineHeight: '16px',
  marginBottom: spacing.lg,
  textAlign: 'center',
  width: '100%',
});

const TermsText = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 12,
  lineHeight: '18px',
  textAlign: 'center',
  marginBottom: spacing['2xl'],
  paddingLeft: spacing['2xl'],
  paddingRight: spacing['2xl'],
});

const TermsLink = styled('span')({
  color: colors.step?.active ?? colors.accent.primary,
  cursor: 'pointer',
});

const ButtonContainer = styled(Box)({
  width: '100%',
  marginTop: 'auto',
  marginBottom: spacing['3xl'],
});

export function PasswordPage({ mnemonic, flowType, onCreating, onSuccess, onBack }: PasswordPageProps) {
  const { t } = useTranslation();
  const [state, actions] = useAccountsContext();

  const requiredLock = state.requiredLock;
  const isRecoverFlow = flowType === 'recover';
  const showSingleInput = requiredLock && !isRecoverFlow;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongPassword, setWrongPassword] = useState(false);

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const isFormValid = useCallback((): boolean => {
    if (showSingleInput) {
      return password.length > 0;
    }
    return passwordValidation.isValid && passwordsMatch;
  }, [showSingleInput, password, passwordValidation.isValid, passwordsMatch]);

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      setError(null);
      if (showSingleInput) setWrongPassword(false);
    },
    [showSingleInput]
  );

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    setError(null);
  }, []);

  const handleTermsPress = useCallback(() => {
    window.open('https://salmonwallet.io/terms.html', '_blank');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid()) return;

    if (showSingleInput) {
      setIsChecking(true);
      setError(null);
      try {
        const isValidPassword = await actions.checkPassword(password);
        if (!isValidPassword) {
          setWrongPassword(true);
          setIsChecking(false);
          return;
        }
      } catch {
        setError(t('wallet.create.invalid_password') || 'Invalid Password');
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    }

    setIsLoading(true);
    setError(null);

    // Yield to UI so LoadingScreen renders
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const accountName = generateAccountName(state.counter, t('wallet.name_template'));
      const { account } = await createAccount({
        name: accountName,
        mnemonic,
        networkIds: [
          'solana-mainnet', 'solana-devnet',
          'bitcoin-mainnet', 'bitcoin-testnet',
          'ethereum-mainnet', 'ethereum-sepolia',
        ],
        startIndex: 0,
      });

      onCreating?.();
      await actions.addAccount(account, password);
      onSuccess();
    } catch (err) {
      console.error('Failed to create account:', err);
      setError(
        t('wallet.create.recovery_error') ||
        'Failed to create account. Please check your seed phrase and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, mnemonic, password, actions, showSingleInput, t, state.counter, onCreating, onSuccess]);

  const showPasswordError =
    !showSingleInput && password.length > 0 && password.length < PASSWORD_CONSTRAINTS.MIN_LENGTH;
  const showConfirmError =
    !showSingleInput &&
    confirmPassword.length > 0 &&
    !passwordsMatch &&
    password.length >= PASSWORD_CONSTRAINTS.MIN_LENGTH;

  const getButtonText = () => {
    if (isChecking) return t('wallet.create.passwordChecking') || 'Checking...';
    if (flowType === 'create') return t('wallet.create_wallet') || 'CREATE WALLET';
    return t('wallet.recover_wallet') || 'RECOVER ACCOUNT';
  };

  const passwordError = showPasswordError
    ? `Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`
    : wrongPassword
      ? t('wallet.create.invalid_password') || 'Invalid Password'
      : undefined;

  const confirmError = showConfirmError
    ? t('wallet.create.passwords_dont_match') || 'Passwords do not match'
    : undefined;

  const loadingTitle = flowType === 'recover' ? 'Recovering Account' : 'Creating Account';

  return (
    <>
      <Container>
        <ScreenHeader
          onBack={onBack}
          stepIndicator={{ totalSteps: 2, currentStep: 2 }}
          backDisabled={isLoading || isChecking}
        />
        <Content>
          <LogoImage src="/images/Logo.png" alt="Salmon" />

          <Title>
            {showSingleInput
              ? t('wallet.create.enter_your_password') || 'Enter your password'
              : t('wallet.create.choose_a_password') || 'Choose a Password'}
          </Title>

          {!showSingleInput && (
            <Subtitle>
              {t('wallet.create.choose_a_password_body') || 'You will need it to unlock your wallet'}
            </Subtitle>
          )}

          <InputContainer>
            <PasswordInput
              value={password}
              onChangeText={handlePasswordChange}
              placeholder={
                showSingleInput
                  ? t('wallet.create.enter_your_password') || 'Enter your password'
                  : t('wallet.create.passwordNew') || 'New password'
              }
              error={passwordError}
              editable={!isLoading && !isChecking}
              onSubmitEditing={showSingleInput ? handleSubmit : undefined}
            />
            {!showSingleInput && password.length > 0 && (
              <StrengthContainer>
                <PasswordStrengthBar strength={passwordValidation.strength} t={t} />
              </StrengthContainer>
            )}
          </InputContainer>

          {!showSingleInput && (
            <InputContainer>
              <PasswordInput
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder={t('wallet.create.passwordRepeat') || 'Repeat password'}
                error={confirmError}
                editable={!isLoading && !isChecking}
                onSubmitEditing={handleSubmit}
              />
            </InputContainer>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <TermsText>
            {flowType === 'recover' ? 'By recovering, you accept the ' : 'By creating, you accept the '}
            <TermsLink onClick={handleTermsPress}>Terms & Conditions</TermsLink>
          </TermsText>

          <ButtonContainer>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={!isFormValid() || wrongPassword}
              loading={isLoading || isChecking}
            >
              {getButtonText()}
            </PrimaryButton>
          </ButtonContainer>
        </Content>
      </Container>

      <LoadingScreen
        visible={isLoading}
        title={loadingTitle}
        subtitle="Please wait while we secure your wallet"
        showTips={true}
        tipInterval={4000}
      />
    </>
  );
}
