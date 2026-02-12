/**
 * RecoverWalletPage - Recover existing wallet using seed phrase
 *
 * Mirrors mobile recover.tsx flow for the extension.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  normalizeMnemonic,
  validateMnemonic,
} from '@salmon/shared';
import {
  ScreenHeader,
  PrimaryButton,
  SecondaryButton,
} from '../../components';

interface RecoverWalletPageProps {
  onComplete: (mnemonic: string) => void;
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
  marginBottom: spacing['3xl'],
  textAlign: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const TextArea = styled('textarea')<{ borderColor: string }>(({ borderColor }) => ({
  width: '100%',
  height: 160,
  backgroundColor: colors.input.background,
  border: `1px solid ${borderColor}`,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  textAlign: 'center',
  resize: 'none',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  '&::placeholder': {
    color: colors.text.placeholder,
  },
}));

const InputContainer = styled(Box)({
  width: '100%',
  marginBottom: spacing['2xl'],
});

const ButtonGroup = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

export function RecoverWalletPage({ onComplete, onBack }: RecoverWalletPageProps) {
  const { t } = useTranslation();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isValidSeedPhrase = useCallback((): boolean => {
    const normalized = normalizeMnemonic(seedPhrase);
    if (!normalized) return false;
    return validateMnemonic(normalized);
  }, [seedPhrase]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSeedPhrase(text);
    } catch {
      // Clipboard API may not be available
    }
  }, []);

  const handleNext = useCallback(() => {
    if (!isValidSeedPhrase()) return;
    const normalized = normalizeMnemonic(seedPhrase);
    onComplete(normalized);
  }, [seedPhrase, isValidSeedPhrase, onComplete]);

  const getBorderColor = () => {
    if (isFocused) return colors.input.borderFocus;
    return colors.input.border;
  };

  const showNextButton = isValidSeedPhrase();

  return (
    <Container>
      <ScreenHeader
        onBack={onBack}
        stepIndicator={{ totalSteps: 2, currentStep: 1 }}
      />
      <Content>
        <LogoImage src="/images/Logo.png" alt="Salmon" />

        <Title>{t('wallet.recover.messageTitle')}</Title>
        <Subtitle>{t('wallet.recover.messageBody')}</Subtitle>

        <InputContainer>
          <TextArea
            borderColor={getBorderColor()}
            placeholder="Enter your seed phrase..."
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </InputContainer>

        <ButtonGroup>
          <SecondaryButton onClick={handlePaste}>
            {t('wallet.recover.pasteSeed').toUpperCase()}
          </SecondaryButton>
          {showNextButton && (
            <PrimaryButton onClick={handleNext}>
              {t('actions.next').toUpperCase()}
            </PrimaryButton>
          )}
        </ButtonGroup>
      </Content>
    </Container>
  );
}
