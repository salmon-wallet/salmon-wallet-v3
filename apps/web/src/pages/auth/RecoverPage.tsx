import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors, spacing, fontFamily, fontSize, s, vs, ms,
  validateMnemonic, normalizeMnemonic,
} from '@salmon/shared';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '@salmon/ui';
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
  marginBottom: vs(spacing['2xl']),
});

const SeedTextArea = styled('textarea')({
  width: '100%',
  minHeight: 120,
  backgroundColor: colors.input.background,
  border: `1px solid ${colors.input.border}`,
  borderRadius: 12,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  padding: spacing.lg,
  resize: 'none',
  outline: 'none',
  '&:focus': {
    borderColor: colors.input.borderFocus,
  },
});

const ButtonContainer = styled(Box)({
  width: '100%',
  paddingBottom: vs(spacing['3xl']),
  paddingTop: vs(spacing.lg),
  display: 'flex',
  flexDirection: 'column',
  gap: vs(spacing.md),
});

export function RecoverPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMnemonic } = useAuthFlow();
  const [input, setInput] = useState('');

  const isValid = validateMnemonic(input.trim());

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      // clipboard access denied
    }
  }, []);

  const handleNext = useCallback(() => {
    const normalized = normalizeMnemonic(input);
    setMnemonic(normalized);
    navigate('/auth/password');
  }, [input, setMnemonic, navigate]);

  return (
    <Container>
      <ScreenHeader
        onBack={() => navigate('/auth/select')}
        stepIndicator={{ totalSteps: 2, currentStep: 1 }}
      />
      <Content>
        <CenterContent>
          <Title>{t('wallet.recover.title', 'Enter Seed Phrase')}</Title>
          <SeedTextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('wallet.recover.placeholder', 'Enter your 12 or 24-word seed phrase...')}
            spellCheck={false}
            autoComplete="off"
          />
        </CenterContent>
        <ButtonContainer>
          <SecondaryButton onClick={handlePaste}>
            {t('actions.paste', 'PASTE').toUpperCase()}
          </SecondaryButton>
          <PrimaryButton
            onClick={handleNext}
            disabled={!isValid}
            style={{ visibility: isValid ? 'visible' : 'hidden' }}
          >
            {t('actions.next', 'NEXT').toUpperCase()}
          </PrimaryButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
}
