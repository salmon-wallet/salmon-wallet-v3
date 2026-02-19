/**
 * SuccessPage - Congratulations screen after wallet creation/recovery
 *
 * Mirrors mobile success.tsx flow for the extension.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily } from '@salmon/shared';
import {
  PrimaryButton,
  SecondaryButton,
  TextButton,
  BaseDialog,
} from '../../components';

interface SuccessPageProps {
  onGoToWallet: () => void;
  onCheckDerived: () => void;
}

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
  padding: `0 ${spacing['2xl']}px`,
});

const TopSpacer = styled(Box)({ flex: 1 });

const CenterContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const LogoImage = styled('img')({
  width: 80,
  height: 80,
  objectFit: 'contain',
  marginBottom: spacing['2xl'],
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 32,
  lineHeight: '40px',
  marginBottom: spacing.md,
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  lineHeight: '24px',
  textAlign: 'center',
});

const ButtonsContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  paddingBottom: spacing['2xl'],
  gap: spacing.lg,
});

export function SuccessPage({ onGoToWallet, onCheckDerived }: SuccessPageProps) {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);

  const toggleDialog = useCallback(() => {
    setShowDialog((prev) => !prev);
  }, []);

  return (
    <Container>
      <TopSpacer />

      <CenterContent>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>{t('wallet.create.success_message')}</Title>
        <Subtitle>{t('wallet.create.success_message_body')}</Subtitle>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={onGoToWallet}>
          {t('wallet.create.go_to_my_wallet')}
        </PrimaryButton>
        <SecondaryButton onClick={onCheckDerived}>
          {t('wallet.create.check_derivables')}
        </SecondaryButton>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TextButton onClick={toggleDialog} color={colors.text.secondary}>
            {t('wallet.create.derivable_info_icon')}
          </TextButton>
        </Box>
      </ButtonsContainer>

      {/* Derivable Info Dialog */}
      <BaseDialog visible={showDialog} onClose={toggleDialog}>
        <BaseDialog.Header title={t('wallet.create.derivable_info')} />
        <BaseDialog.Content>
          <Typography
            sx={{
              color: colors.text.secondary,
              fontFamily: `${fontFamily.sans}, sans-serif`,
              fontSize: 14,
              lineHeight: '22px',
              textAlign: 'center',
            }}
          >
            {t('wallet.create.derivable_description')}
          </Typography>
        </BaseDialog.Content>
        <BaseDialog.Actions>
          <BaseDialog.ActionButton onClick={toggleDialog}>
            {t('actions.continue')}
          </BaseDialog.ActionButton>
        </BaseDialog.Actions>
      </BaseDialog>
    </Container>
  );
}
