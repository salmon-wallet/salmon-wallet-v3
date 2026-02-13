import React from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, fontSize, componentSizes, contentPadding } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../../components';

interface SelectOptionsPageProps {
  onCreateWallet: () => void;
  onRecoverWallet: () => void;
}

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: `0 ${contentPadding.screen}px`,
  paddingBottom: spacing['3xl'],
  backgroundColor: colors.background.primary,
});

const CenterContent = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const WelcomeText = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: fontSize['2xl'],
  lineHeight: '32px',
  textAlign: 'center',
  marginBottom: spacing['3xl'],
});

const LogoImage = styled('img')({
  width: componentSizes.logoSizeMedium,
  height: componentSizes.logoSizeMedium,
  objectFit: 'contain',
  marginBottom: spacing['2xl'],
});

const BrandName = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 32,
  lineHeight: '40px',
  textAlign: 'center',
});

const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

export function SelectOptionsPage({ onCreateWallet, onRecoverWallet }: SelectOptionsPageProps) {
  const { t } = useTranslation();

  return (
    <Container>
      <CenterContent>
        <WelcomeText>{t('wallet.onboarding.titleWelcome', 'Welcome')}</WelcomeText>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <BrandName>Salmon</BrandName>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={onCreateWallet}>
          {t('wallet.create_wallet', 'CREATE ACCOUNT').toUpperCase()}
        </PrimaryButton>
        <SecondaryButton onClick={onRecoverWallet}>
          {t('wallet.recover_wallet', 'RECOVER ACCOUNT').toUpperCase()}
        </SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}

export default SelectOptionsPage;
