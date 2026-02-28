import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, fontSize, componentSizes, contentPadding, s, vs, ms, useAccountsContext } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '@salmon/ui';
import { useAuthFlow } from './AuthFlowContext';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: `0 ${s(contentPadding.screen)}px`,
  paddingBottom: vs(spacing['3xl']),
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
  fontSize: ms(fontSize['2xl']),
  lineHeight: `${ms(32)}px`,
  textAlign: 'center',
  marginBottom: vs(spacing['3xl']),
});

const LogoImage = styled('img')({
  width: s(componentSizes.logoSizeMedium),
  height: s(componentSizes.logoSizeMedium),
  objectFit: 'contain',
  marginBottom: vs(spacing['2xl']),
});

const BrandName = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: ms(32),
  lineHeight: `${ms(40)}px`,
  textAlign: 'center',
});

const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vs(spacing.lg),
});

export function SelectPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state] = useAccountsContext();
  const { setFlowType } = useAuthFlow();
  const hasAccounts = state.accounts.length > 0;

  const handleCreate = useCallback(() => {
    setFlowType('create');
    navigate('/auth/create');
  }, [navigate, setFlowType]);

  const handleRecover = useCallback(() => {
    setFlowType('recover');
    navigate('/auth/recover');
  }, [navigate, setFlowType]);

  const handleAccess = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  return (
    <Container>
      <CenterContent>
        <WelcomeText>
          {hasAccounts
            ? t('wallet.onboarding.titleOnboarded', 'Add Account')
            : t('wallet.onboarding.titleWelcome', 'Welcome')}
        </WelcomeText>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <BrandName>Salmon</BrandName>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={handleCreate}>
          {t('wallet.create_wallet', 'CREATE ACCOUNT').toUpperCase()}
        </PrimaryButton>
        <SecondaryButton onClick={handleRecover}>
          {t('wallet.recover_wallet', 'RECOVER ACCOUNT').toUpperCase()}
        </SecondaryButton>
        {hasAccounts && (
          <SecondaryButton onClick={handleAccess}>
            {t('wallet.access_existing', 'ACCESS EXISTING ACCOUNT').toUpperCase()}
          </SecondaryButton>
        )}
      </ButtonsContainer>
    </Container>
  );
}
