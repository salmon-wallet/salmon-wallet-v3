import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors, spacing, fontFamily, fontSize, s, vs, ms,
  generateMnemonic, generateValidationPositions, validateMnemonicWords,
} from '@salmon/shared';
import {
  ScreenHeader, PrimaryButton, SecondaryButton,
  SeedWordGrid, SeedWordInput,
} from '@salmon/ui';
import { useAuthFlow } from './AuthFlowContext';

type Step = 'message' | 'seedPhrase' | 'validate';

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

const CenterContent = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: ms(fontSize['2xl']),
  textAlign: 'center',
  marginBottom: vs(spacing.md),
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(fontSize.base),
  textAlign: 'center',
  marginBottom: vs(spacing['2xl']),
  lineHeight: `${ms(22)}px`,
});

const ButtonContainer = styled(Box)({
  width: '100%',
  paddingBottom: vs(spacing['3xl']),
  paddingTop: vs(spacing.lg),
  display: 'flex',
  flexDirection: 'column',
  gap: vs(spacing.md),
});

export function CreatePage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMnemonic } = useAuthFlow();

  const [step, setStep] = useState<Step>('message');
  const [mnemonic, setLocalMnemonic] = useState('');
  const [validationInputs, setValidationInputs] = useState<Record<number, string>>({});

  const words = useMemo(() => (mnemonic ? mnemonic.split(' ') : []), [mnemonic]);
  const positions = useMemo(
    () => (words.length > 0 ? generateValidationPositions(words.length, 3) : []),
    [words],
  );

  const handleStartSeed = useCallback(() => {
    const m = generateMnemonic(128);
    setLocalMnemonic(m);
    setStep('seedPhrase');
  }, []);

  const handleCopySeed = useCallback(() => {
    navigator.clipboard.writeText(mnemonic).catch(() => {});
  }, [mnemonic]);

  const handleGoToValidate = useCallback(() => {
    setStep('validate');
  }, []);

  const handleValidationChange = useCallback((pos: number, value: string) => {
    setValidationInputs((prev) => ({ ...prev, [pos]: value }));
  }, []);

  const isValidationCorrect = useMemo(() => {
    if (positions.length === 0) return false;
    const result = validateMnemonicWords(
      mnemonic,
      positions,
      positions.map((pos) => (validationInputs[pos] || '').trim().toLowerCase()),
    );
    return result.isValid;
  }, [mnemonic, positions, validationInputs]);

  const handleComplete = useCallback(() => {
    setMnemonic(mnemonic);
    navigate('/auth/password');
  }, [mnemonic, setMnemonic, navigate]);

  const handleBack = useCallback(() => {
    if (step === 'validate') setStep('seedPhrase');
    else if (step === 'seedPhrase') setStep('message');
    else navigate('/auth/select');
  }, [step, navigate]);

  const currentStep = step === 'message' ? 0 : step === 'seedPhrase' ? 1 : 2;

  return (
    <Container>
      <ScreenHeader
        onBack={handleBack}
        stepIndicator={step !== 'message' ? { totalSteps: 3, currentStep } : undefined}
      />
      <Content>
        {step === 'message' && (
          <>
            <CenterContent>
              <Title>{t('wallet.create.backup_title', 'Back up your seed phrase')}</Title>
              <Subtitle>
                {t(
                  'wallet.create.backup_body',
                  'Your seed phrase is the only way to recover your wallet. Write it down and store it somewhere safe.',
                )}
              </Subtitle>
            </CenterContent>
            <ButtonContainer>
              <PrimaryButton onClick={handleStartSeed}>
                {t('actions.continue', 'CONTINUE').toUpperCase()}
              </PrimaryButton>
            </ButtonContainer>
          </>
        )}

        {step === 'seedPhrase' && (
          <>
            <CenterContent>
              <Title>{t('wallet.create.seed_phrase_title', 'Your Seed Phrase')}</Title>
              <SeedWordGrid words={words} />
            </CenterContent>
            <ButtonContainer>
              <SecondaryButton onClick={handleCopySeed}>
                {t('actions.copy', 'COPY').toUpperCase()}
              </SecondaryButton>
              <PrimaryButton onClick={handleGoToValidate}>
                {t('actions.continue', 'CONTINUE').toUpperCase()}
              </PrimaryButton>
            </ButtonContainer>
          </>
        )}

        {step === 'validate' && (
          <>
            <CenterContent>
              <Title>{t('wallet.create.validate_title', 'Verify Seed Phrase')}</Title>
              <Subtitle>
                {t('wallet.create.validate_body', 'Enter the following words from your seed phrase')}
              </Subtitle>
              {positions.map((pos) => (
                <Box key={pos} sx={{ width: '100%', mb: 2 }}>
                  <SeedWordInput
                    position={pos}
                    value={validationInputs[pos] || ''}
                    onChangeText={(val: string) => handleValidationChange(pos, val)}
                    validationState={
                      validationInputs[pos]
                        ? validationInputs[pos].trim().toLowerCase() === words[pos - 1]
                          ? 'correct'
                          : 'incorrect'
                        : 'idle'
                    }
                  />
                </Box>
              ))}
            </CenterContent>
            <ButtonContainer>
              <PrimaryButton onClick={handleComplete} disabled={!isValidationCorrect}>
                {t('actions.continue', 'CONTINUE').toUpperCase()}
              </PrimaryButton>
            </ButtonContainer>
          </>
        )}
      </Content>
    </Container>
  );
}
