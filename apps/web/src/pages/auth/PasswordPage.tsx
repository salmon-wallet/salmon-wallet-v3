import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  createAccount,
  fontFamily,
  fontSize,
  generateAccountName,
  MIRROR_NETWORKS,
  ms,
  PASSWORD_CONSTRAINTS,
  s,
  SCAN_NETWORKS,
  spacing,
  useAccountsContext,
  validatePassword,
  vs,
} from '@salmon/shared';
import { LoadingScreen, PasswordInput, PasswordStrengthBar, PrimaryButton, ScreenHeader, styled } from '@salmon/ui';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from './AuthFlowContext';

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
  padding: `0 ${s(spacing['2xl'])}px`,
});

const FormArea = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const LogoImage = styled('img')({
  width: ms(60),
  height: ms(60),
  objectFit: 'contain',
  marginBottom: vs(spacing['2xl']),
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: ms(fontSize['2xl']),
  textAlign: 'center',
  marginBottom: vs(spacing.sm),
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(fontSize.base),
  textAlign: 'center',
  marginBottom: vs(spacing['3xl']),
});

const InputContainer = styled(Box)({
  width: '100%',
  marginBottom: vs(spacing.lg),
});

const StrengthContainer = styled(Box)({
  marginTop: vs(spacing.sm),
  paddingLeft: s(spacing.xs),
  paddingRight: s(spacing.xs),
});

const ErrorText = styled(Typography)({
  color: colors.status.error,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(12),
  textAlign: 'center',
  marginBottom: vs(spacing.lg),
  width: '100%',
});

const TermsText = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(12),
  textAlign: 'center',
  paddingLeft: s(spacing['2xl']),
  paddingRight: s(spacing['2xl']),
});

const TermsLink = styled('span')({
  color: colors.accent.primary,
  cursor: 'pointer',
});

const ButtonContainer = styled(Box)({
  width: '100%',
  paddingBottom: vs(spacing['3xl']),
  paddingTop: vs(spacing.lg),
});

export function PasswordPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, actions] = useAccountsContext();
  const { mnemonic, flowType, setJustCreated } = useAuthFlow();

  const showSingleInput = state.requiredLock;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongPassword, setWrongPassword] = useState(false);

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const isFormValid = useCallback((): boolean => {
    if (showSingleInput) return password.length > 0;
    return passwordValidation.isValid && passwordsMatch;
  }, [showSingleInput, password, passwordValidation.isValid, passwordsMatch]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid()) return;

    if (showSingleInput) {
      setIsChecking(true);
      setError(null);
      try {
        const valid = await actions.checkPassword(password);
        if (!valid) { setWrongPassword(true); setIsChecking(false); return; }
      } catch {
        setError(t('wallet.create.invalid_password') || 'Invalid Password');
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
    }

    setIsLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 100));

    try {
      const name = generateAccountName(state.counter, t('wallet.name_template'));
      const { account } = await createAccount({
        name,
        mnemonic,
        networkIds: [...SCAN_NETWORKS, ...Object.values(MIRROR_NETWORKS)],
        startIndex: 0,
      });
      setJustCreated(true);
      await actions.addAccount(account, password);
      navigate('/auth/success');
    } catch (err) {
      console.error('Failed to create account:', err);
      setError(t('wallet.create.recovery_error') || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, mnemonic, password, actions, showSingleInput, t, state.counter, setJustCreated, navigate]);

  const showPasswordError =
    !showSingleInput && password.length > 0 && password.length < PASSWORD_CONSTRAINTS.MIN_LENGTH;
  const showConfirmError = !showSingleInput && confirmPassword.length > 0 && !passwordsMatch;

  const passwordError = showPasswordError
    ? `Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`
    : wrongPassword
      ? t('wallet.create.invalid_password') || 'Invalid Password'
      : undefined;

  return (
    <>
      <Container>
        <ScreenHeader
          onBack={() => navigate(-1)}
          stepIndicator={{ totalSteps: 2, currentStep: 2 }}
          backDisabled={isLoading || isChecking}
        />
        <Content>
          <FormArea>
            <LogoImage src="/images/Logo.png" alt="Salmon" />
            <Title>
              {showSingleInput
                ? t('wallet.create.enter_your_password', 'Enter your password')
                : t('wallet.create.choose_a_password', 'Choose a Password')}
            </Title>
            {!showSingleInput && (
              <Subtitle>{t('wallet.create.choose_a_password_body', 'You will need it to unlock your wallet')}</Subtitle>
            )}

            <InputContainer>
              <PasswordInput
                value={password}
                onChangeText={(text) => { setPassword(text); setError(null); if (showSingleInput) setWrongPassword(false); }}
                placeholder={showSingleInput ? t('wallet.create.enter_your_password', 'Enter your password') : t('wallet.create.passwordNew', 'New password')}
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
                  onChangeText={(text) => { setConfirmPassword(text); setError(null); }}
                  placeholder={t('wallet.create.passwordRepeat', 'Repeat password')}
                  error={showConfirmError ? t('wallet.create.passwords_dont_match', 'Passwords do not match') : undefined}
                  editable={!isLoading && !isChecking}
                  onSubmitEditing={handleSubmit}
                />
              </InputContainer>
            )}

            {error && <ErrorText>{error}</ErrorText>}

            <TermsText>
              {flowType === 'recover' ? 'By recovering, you accept the ' : 'By creating, you accept the '}
              <TermsLink onClick={() => window.open('https://salmonwallet.io/terms', '_blank')}>
                Terms & Conditions
              </TermsLink>
            </TermsText>
          </FormArea>

          <ButtonContainer>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={!isFormValid() || wrongPassword}
              loading={isLoading || isChecking}
            >
              {isChecking
                ? t('wallet.create.passwordChecking', 'Checking...')
                : flowType === 'create'
                  ? t('wallet.create_wallet', 'CREATE WALLET')
                  : t('wallet.recover_wallet', 'RECOVER ACCOUNT')}
            </PrimaryButton>
          </ButtonContainer>
        </Content>
      </Container>

      <LoadingScreen
        visible={isLoading}
        title={flowType === 'recover' ? 'Recovering Account' : 'Creating Account'}
        subtitle="Please wait while we secure your wallet"
        showTips
        tipInterval={4000}
      />
    </>
  );
}
