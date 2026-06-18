import React from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { formatOrigin, fontFamily, fontSize, spacing } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';
import {
  ButtonsContainer,
  AppIdentityIcon,
  AppIdentityName,
  AppIdentityRow,
  AppIdentityText,
  Card,
  Container,
  Content,
  FooterNote,
  Header,
  Label,
  LogoWrap,
  LogoImage,
  MonoValue,
  ScrollArea,
  Subtitle,
  Title,
  Value,
} from './common';
import type { DAppSignMessageApprovalViewProps } from './types';

const MessageBox = Box;

export function DAppSignMessageApprovalView({
  origin,
  appName,
  appIcon,
  messageText,
  disabled = false,
  loading = false,
  onApprove,
  onReject,
}: DAppSignMessageApprovalViewProps): React.ReactElement {
  const { t } = useTranslation();
  const displayOrigin = formatOrigin(origin);
  const hasIdentity = !!appName || !!appIcon;

  return (
    <Container>
      <Content>
        <Header>
          <LogoWrap>
            <LogoImage src="/images/Logo.png" alt="Salmon" />
          </LogoWrap>
          <Title>{t('dapp.sign_message_title', 'Sign Message')}</Title>
          <Subtitle>
            {t(
              'dapp.sign_message_subtitle',
              'This app is requesting you to sign a message. This will not submit a transaction.',
            )}
          </Subtitle>
        </Header>

        <ScrollArea>
          <Card>
            <Label>{t('dapp.requesting_site', 'Requesting site')}</Label>
            {hasIdentity ? (
              <AppIdentityRow>
                {appIcon ? <AppIdentityIcon src={appIcon} alt={appName || displayOrigin} /> : null}
                <AppIdentityText>
                  {appName ? <AppIdentityName>{appName}</AppIdentityName> : null}
                  <MonoValue sx={{ marginTop: 0 }}>{displayOrigin}</MonoValue>
                </AppIdentityText>
              </AppIdentityRow>
            ) : (
              <Value sx={{ fontSize: 20 }}>{displayOrigin}</Value>
            )}
            <FooterNote sx={{ marginTop: 1.5 }}>
              {t(
                'dapp.sign_message_hint',
                'Read the message carefully. Message signatures can still authorize actions off-chain.',
              )}
            </FooterNote>
          </Card>

          <Card>
            <Label>{t('dapp.message', 'Message')}</Label>
            <MessageBox
              sx={{
                width: '100%',
                maxHeight: 220,
                overflowY: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 2,
                padding: `${spacing.lg}px`,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Value
                sx={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize.sm,
                  fontWeight: 400,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {messageText}
              </Value>
            </MessageBox>
          </Card>
        </ScrollArea>

        <ButtonsContainer>
          <PrimaryButton onClick={onApprove} loading={loading} disabled={disabled || loading}>
            {t('dapp.sign', 'Sign').toUpperCase()}
          </PrimaryButton>
          <SecondaryButton onClick={onReject} disabled={loading}>
            {t('dapp.reject', 'Reject').toUpperCase()}
          </SecondaryButton>
        </ButtonsContainer>
      </Content>
    </Container>
  );
}
