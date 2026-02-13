/**
 * CreateWalletPage - Create new wallet with seed phrase backup
 *
 * 3 internal steps: message → seedPhrase → validate
 * Mirrors mobile create.tsx flow for the extension.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  generateMnemonic,
  generateValidationPositions,
  validateMnemonicWords,
} from '@salmon/shared';
import {
  ScreenHeader,
  PrimaryButton,
  SecondaryButton,
  SeedWordGrid,
  SeedWordInput,
} from '../../components';

// ============================================================================
// Types
// ============================================================================

type Step = 'message' | 'seedPhrase' | 'validate';

interface CreateWalletPageProps {
  onComplete: (mnemonic: string) => void;
  onBack: () => void;
}

interface ValidationWord {
  position: number;
  expectedWord: string;
  userInput: string;
}

// ============================================================================
// Styled Components
// ============================================================================

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
  padding: `0 ${spacing['2xl']}px`,
  overflowY: 'auto',
});

const LogoImage = styled('img')({
  width: 60,
  height: 60,
  objectFit: 'contain',
  marginBottom: spacing.lg,
  marginTop: spacing.lg,
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '32px',
  marginBottom: spacing.md,
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
  lineHeight: '20px',
  marginBottom: spacing['2xl'],
  textAlign: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const BodyText = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  lineHeight: '24px',
  marginBottom: spacing['3xl'],
  textAlign: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const Spacer = styled(Box)({ flex: 1 });

const ButtonContainer = styled(Box)({
  width: '100%',
  marginBottom: spacing['2xl'],
});

const SeedGridContainer = styled(Box)({
  width: '100%',
  marginBottom: spacing['2xl'],
});

const ValidationInputs = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

const ToastOverlay = styled(Box)({
  position: 'fixed',
  bottom: 100,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
});

const Toast = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.md,
  borderRadius: 24,
  gap: spacing.sm,
});

const ToastText = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
});

// ============================================================================
// Step Components
// ============================================================================

function MessageStep({ onNext, onBack, t }: { onNext: () => void; onBack: () => void; t: (key: string) => string }) {
  return (
    <Container>
      <ScreenHeader onBack={onBack} />
      <Content>
        <Box sx={{ marginTop: spacing['3xl'] }} />
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>{t('wallet.create.messageTitle')}</Title>
        <BodyText>{t('wallet.create.messageBody')}</BodyText>
        <Spacer />
        <ButtonContainer>
          <PrimaryButton onClick={onNext}>
            {t('actions.start').toUpperCase()}
          </PrimaryButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
}

function SeedPhraseStep({
  mnemonic,
  onNext,
  onBack,
  t,
}: {
  mnemonic: string;
  onNext: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const [showToast, setShowToast] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [mnemonic]);

  return (
    <Container>
      <ScreenHeader
        onBack={onBack}
        stepIndicator={{ totalSteps: 3, currentStep: 1 }}
      />
      <Content>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>{t('wallet.create.your_seed_phrase')}</Title>
        <Subtitle>{t('wallet.create.your_seed_phrase_body')}</Subtitle>
        <SeedGridContainer>
          <SeedWordGrid words={words} columns={3} />
        </SeedGridContainer>
        <ButtonContainer>
          <SecondaryButton onClick={handleCopy}>
            {t('wallet.create.copy_key').toUpperCase()}
          </SecondaryButton>
        </ButtonContainer>
        <ButtonContainer>
          <PrimaryButton onClick={onNext}>
            {t('wallet.create.ive_backed_up_seed_phrase').toUpperCase()}
          </PrimaryButton>
        </ButtonContainer>
      </Content>
      {showToast && (
        <ToastOverlay>
          <Toast>
            <ToastText>{t('wallet.copied')}</ToastText>
          </Toast>
        </ToastOverlay>
      )}
    </Container>
  );
}

function ValidateStep({
  mnemonic,
  onComplete,
  onBack,
  t,
}: {
  mnemonic: string;
  onComplete: () => void;
  onBack: () => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}) {
  const words = useMemo(() => mnemonic.split(' '), [mnemonic]);
  const [validationWords, setValidationWords] = useState<ValidationWord[]>([]);

  useEffect(() => {
    const positions = generateValidationPositions(words.length, 3);
    setValidationWords(
      positions.map((pos) => ({
        position: pos,
        expectedWord: words[pos - 1],
        userInput: '',
      }))
    );
  }, [words]);

  const validationResult = useMemo(() => {
    if (validationWords.length === 0) return { isValid: false, results: [] };
    return validateMnemonicWords(
      mnemonic,
      validationWords.map((vw) => vw.position),
      validationWords.map((vw) => vw.userInput)
    );
  }, [mnemonic, validationWords]);

  const handleInputChange = useCallback((index: number, value: string) => {
    setValidationWords((prev) =>
      prev.map((vw, i) => (i === index ? { ...vw, userInput: value } : vw))
    );
  }, []);

  const getValidationState = useCallback(
    (index: number): 'idle' | 'correct' | 'incorrect' => {
      const vw = validationWords[index];
      if (!vw || !vw.userInput) return 'idle';
      const result = validationResult.results[index];
      if (!result) return 'idle';
      return result.isCorrect ? 'correct' : 'incorrect';
    },
    [validationWords, validationResult]
  );

  return (
    <Container>
      <ScreenHeader
        onBack={onBack}
        stepIndicator={{ totalSteps: 3, currentStep: 2 }}
      />
      <Content>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>{t('wallet.create.confirm_seed_phrase')}</Title>
        <Subtitle>{t('wallet.create.confirm_seed_phrase_body')}</Subtitle>
        <ValidationInputs>
          {validationWords.map((vw, index) => (
            <SeedWordInput
              key={`word-${vw.position}`}
              position={vw.position}
              value={vw.userInput}
              onChangeText={(value) => handleInputChange(index, value)}
              validationState={getValidationState(index)}
              autoFocus={index === 0}
              onSubmitEditing={() => {
                if (index === validationWords.length - 1 && validationResult.isValid) {
                  onComplete();
                }
              }}
            />
          ))}
        </ValidationInputs>
        <Spacer />
        <ButtonContainer>
          <PrimaryButton
            onClick={onComplete}
            disabled={!validationResult.isValid}
          >
            {t('actions.next').toUpperCase()}
          </PrimaryButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CreateWalletPage({ onComplete, onBack }: CreateWalletPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('message');
  const [mnemonic, setMnemonic] = useState('');

  const handleStart = useCallback(() => {
    const newMnemonic = generateMnemonic(128);
    setMnemonic(newMnemonic);
    setStep('seedPhrase');
  }, []);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'message':
        onBack();
        break;
      case 'seedPhrase':
        setStep('message');
        break;
      case 'validate':
        setStep('seedPhrase');
        break;
    }
  }, [step, onBack]);

  const handleProceedToValidation = useCallback(() => {
    setStep('validate');
  }, []);

  const handleValidationComplete = useCallback(() => {
    onComplete(mnemonic);
  }, [mnemonic, onComplete]);

  return (
    <>
      {step === 'message' && (
        <MessageStep onNext={handleStart} onBack={handleBack} t={t} />
      )}
      {step === 'seedPhrase' && (
        <SeedPhraseStep
          mnemonic={mnemonic}
          onNext={handleProceedToValidation}
          onBack={handleBack}
          t={t}
        />
      )}
      {step === 'validate' && (
        <ValidateStep
          mnemonic={mnemonic}
          onComplete={handleValidationComplete}
          onBack={handleBack}
          t={t}
        />
      )}
    </>
  );
}
