import React from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, gradients } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '@salmon/ui-extension';

interface SelectOptionsPageProps {
  onCreateWallet: () => void;
  onRecoverWallet: () => void;
}

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: spacing['2xl'],
  backgroundColor: colors.background.primary,
});

const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  maxWidth: 320,
  margin: '0 auto',
  width: '100%',
});

const LogoContainer = styled(Box)({
  marginBottom: spacing['2xl'],
});

const Logo = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.primaryEnd} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const LogoText = styled(Typography)({
  fontSize: 36,
  fontWeight: 700,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

const Title = styled(Typography)({
  fontSize: 28,
  fontWeight: 700,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginBottom: spacing.md,
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  fontSize: 15,
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginBottom: spacing['3xl'],
  textAlign: 'center',
  lineHeight: 1.5,
});

const ButtonGroup = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

const Footer = styled(Box)({
  paddingTop: spacing['2xl'],
  textAlign: 'center',
});

const FooterText = styled(Typography)({
  fontSize: 12,
  color: colors.text.muted,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

export function SelectOptionsPage({ onCreateWallet, onRecoverWallet }: SelectOptionsPageProps) {
  const { t } = useTranslation();

  return (
    <Container>
      <Content>
        <LogoContainer>
          <Logo>
            <LogoText>S</LogoText>
          </Logo>
        </LogoContainer>

        <Title>{t('wallet.onboarding.title1', 'Welcome to Salmon')}</Title>
        <Subtitle>{t('wallet.onboarding.content1', 'The secure multi-chain wallet for everyone')}</Subtitle>

        <ButtonGroup>
          <PrimaryButton onClick={onCreateWallet}>
            {t('wallet.onboarding.create', 'Create New Wallet')}
          </PrimaryButton>
          <SecondaryButton onClick={onRecoverWallet}>
            {t('wallet.onboarding.recover', 'I Already Have a Wallet')}
          </SecondaryButton>
        </ButtonGroup>
      </Content>

      <Footer>
        <FooterText>
          {t('wallet.onboarding.terms_notice', 'By continuing, you agree to our Terms of Service')}
        </FooterText>
      </Footer>
    </Container>
  );
}

export default SelectOptionsPage;
