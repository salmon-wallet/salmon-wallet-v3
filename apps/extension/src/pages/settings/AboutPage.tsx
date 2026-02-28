/**
 * AboutPage - About information page for browser extension
 *
 * This page displays information about the Salmon Wallet:
 * - App version
 * - Links to website, documentation, and support
 * - Terms of service and privacy policy links
 * - Social media links
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LanguageIcon from '@mui/icons-material/Language';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import PolicyIcon from '@mui/icons-material/Policy';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '@salmon/shared';
import { SettingsPageLayout } from '@/components';

// ============================================================================
// Types
// ============================================================================

export interface AboutPageProps {
  /** Callback to navigate back to home */
  onBack: () => void;
}

interface LinkItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  url: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * App version - would typically come from package.json
 */
const APP_VERSION = '3.0.0';

/**
 * External links configuration
 */
const GENERAL_LINKS: LinkItem[] = [
  {
    id: 'website',
    labelKey: 'settings.about_website',
    icon: <LanguageIcon />,
    url: 'https://salmonwallet.io',
  },
  {
    id: 'docs',
    labelKey: 'settings.about_documentation',
    icon: <DescriptionIcon />,
    url: 'https://docs.salmonwallet.io',
  },
];

const LEGAL_LINKS: LinkItem[] = [
  {
    id: 'terms',
    labelKey: 'settings.about_terms',
    icon: <PolicyIcon />,
    url: 'https://salmonwallet.io/terms',
  },
  {
    id: 'privacy',
    labelKey: 'settings.about_privacy',
    icon: <SecurityIcon />,
    url: 'https://salmonwallet.io/privacy',
  },
];

const SOCIAL_LINKS: LinkItem[] = [
  {
    id: 'github',
    labelKey: 'GitHub',
    icon: <GitHubIcon />,
    url: 'https://github.com/nicholasyoder/salmon-wallet',
  },
  {
    id: 'twitter',
    labelKey: 'Twitter',
    icon: <TwitterIcon />,
    url: 'https://twitter.com/nicholasyoder',
  },
  {
    id: 'telegram',
    labelKey: 'Telegram',
    icon: <TelegramIcon />,
    url: 'https://t.me/nicholasyoder',
  },
];

// ============================================================================
// Styled Components
// ============================================================================

const LogoSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${spacing.xl}px ${spacing.lg}px`,
  gap: spacing.md,
});

const LogoContainer = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: borderRadius.xl,
  backgroundColor: colors.background.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.md,
});

const AppName = styled(Typography)({
  fontSize: 20,
  fontWeight: 700,
  color: colors.text.primary,
});

const VersionText = styled(Typography)({
  fontSize: 13,
  color: colors.text.secondary,
});

const SectionTitle = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: colors.text.secondary,
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.sm}px`,
  marginTop: spacing.sm,
});

const StyledList = styled(List)({
  padding: 0,
});

const StyledListItemButton = styled(ListItemButton)({
  padding: `${spacing.md}px ${spacing.lg}px`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: 40,
  color: colors.text.secondary,
});

const ExternalIcon = styled(OpenInNewIcon)({
  color: colors.text.secondary,
  fontSize: 16,
});

const StyledDivider = styled(Divider)({
  backgroundColor: colors.border.default,
  margin: `${spacing.sm}px ${spacing.lg}px`,
});

const FooterText = styled(Typography)({
  fontSize: 12,
  color: colors.text.secondary,
  textAlign: 'center',
  padding: `${spacing.lg}px`,
  opacity: 0.6,
});

// ============================================================================
// Component
// ============================================================================

export function AboutPage({ onBack }: AboutPageProps): React.ReactElement {
  const { t } = useTranslation();

  const handleLinkClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const renderLinkItem = useCallback(
    (link: LinkItem) => (
      <ListItem key={link.id} disablePadding>
        <StyledListItemButton onClick={() => handleLinkClick(link.url)}>
          <StyledListItemIcon>{link.icon}</StyledListItemIcon>
          <ListItemText
            primary={
              link.labelKey.startsWith('settings.')
                ? t(link.labelKey, link.labelKey.replace('settings.about_', ''))
                : link.labelKey
            }
            primaryTypographyProps={{
              sx: {
                color: colors.text.primary,
                fontSize: 14,
                fontWeight: 500,
              },
            }}
          />
          <ExternalIcon />
        </StyledListItemButton>
      </ListItem>
    ),
    [t, handleLinkClick]
  );

  return (
    <SettingsPageLayout
      title={t('settings.about', 'About')}
      onBack={onBack}
    >
        <LogoSection>
          <LogoContainer>
            <Box
              sx={{
                width: 48,
                height: 48,
                fontSize: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              S
            </Box>
          </LogoContainer>
          <AppName>Salmon Wallet</AppName>
          <VersionText>
            {t('settings.version', 'Version')} {APP_VERSION}
          </VersionText>
        </LogoSection>

        <StyledDivider />

        <SectionTitle>{t('settings.about_general', 'General')}</SectionTitle>
        <StyledList>
          {GENERAL_LINKS.map(renderLinkItem)}
        </StyledList>

        <StyledDivider />

        <SectionTitle>{t('settings.about_legal', 'Legal')}</SectionTitle>
        <StyledList>
          {LEGAL_LINKS.map(renderLinkItem)}
        </StyledList>

        <StyledDivider />

        <SectionTitle>{t('settings.about_social', 'Follow Us')}</SectionTitle>
        <StyledList>
          {SOCIAL_LINKS.map(renderLinkItem)}
        </StyledList>

        <FooterText>
          {t(
            'settings.about_made_with_love',
            'Made with love by the Salmon team'
          )}
        </FooterText>
    </SettingsPageLayout>
  );
}

export default AboutPage;
