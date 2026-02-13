/**
 * RecoverWalletPage - Recover existing wallet using seed phrase
 *
 * Mirrors mobile recover.tsx flow for the extension.
 * Uses responsive scaling (s, vs, ms) from shared.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontFamily,
  s,
  vs,
  ms,
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
  lineHeight: `${ms(32)}px`,
  marginBottom: vs(spacing.md),
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(fontSize.base),
  lineHeight: `${ms(20)}px`,
  marginBottom: vs(spacing['3xl']),
  textAlign: 'center',
  paddingLeft: s(spacing.lg),
  paddingRight: s(spacing.lg),
});

const TextArea = styled('textarea')<{ $borderColor: string }>(({ $borderColor }) => ({
  width: '100%',
  height: vs(160),
  backgroundColor: colors.input.background,
  border: `1px solid ${$borderColor}`,
  borderRadius: ms(borderRadius.lg),
  padding: s(spacing.lg),
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(fontSize.md),
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
  marginBottom: vs(spacing['2xl']),
});

const ButtonGroup = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vs(spacing.lg),
  paddingBottom: vs(spacing['3xl']),
  paddingTop: vs(spacing.lg),
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
        <FormArea>
          <LogoImage src="/images/Logo.png" alt="Salmon" />

          <Title>{t('wallet.recover.messageTitle')}</Title>
          <Subtitle>{t('wallet.recover.messageBody')}</Subtitle>

          <InputContainer>
            <TextArea
              $borderColor={getBorderColor()}
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
        </FormArea>

        <ButtonGroup>
          <SecondaryButton onClick={handlePaste}>
            {t('wallet.recover.pasteSeed').toUpperCase()}
          </SecondaryButton>
          {/* Always reserve space for the Next button to prevent layout shift */}
          <Box sx={{ visibility: showNextButton ? 'visible' : 'hidden' }}>
            <PrimaryButton onClick={handleNext}>
              {t('actions.next').toUpperCase()}
            </PrimaryButton>
          </Box>
        </ButtonGroup>
      </Content>
    </Container>
  );
}
