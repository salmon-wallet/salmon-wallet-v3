/**
 * SupportPage - Help & Support page for browser extension
 *
 * This page provides help resources and support options for users
 * including FAQs, documentation, and contact information.
 *
 * Features:
 * - List of support options with icons
 * - External links to help resources
 * - Security notice about seed phrase protection
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import TwitterIcon from '@mui/icons-material/Twitter';
import ForumIcon from '@mui/icons-material/Forum';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '@salmon/shared';
import { SettingsPageLayout } from '../../components/SettingsPageLayout';

// ============================================================================
// Types
// ============================================================================

export interface SupportPageProps {
  /** Callback to navigate back */
  onBack: () => void;
}

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORT_OPTIONS: SupportOption[] = [
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions',
    icon: <HelpOutlineIcon />,
    url: 'https://salmonwallet.io/faq',
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'Learn how to use Salmon Wallet',
    icon: <DescriptionIcon />,
    url: 'https://docs.salmonwallet.io',
  },
  {
    id: 'twitter',
    title: 'Twitter / X',
    description: 'Get updates and reach out to us',
    icon: <TwitterIcon />,
    url: 'https://twitter.com/salmonwallet',
  },
  {
    id: 'discord',
    title: 'Discord Community',
    description: 'Join our community for support',
    icon: <ForumIcon />,
    url: 'https://discord.gg/salmonwallet',
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Contact us directly for help',
    icon: <EmailIcon />,
    url: 'mailto:support@salmonwallet.io',
  },
];

// ============================================================================
// Styled Components
// ============================================================================

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
  color: colors.accent.primary,
});

const ExternalIcon = styled(OpenInNewIcon)({
  color: colors.text.secondary,
  fontSize: 16,
});

const SecurityNotice = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing.sm,
  backgroundColor: 'rgba(255, 179, 0, 0.1)',
  borderRadius: borderRadius.md,
  padding: spacing.md,
  margin: `${spacing.lg}px ${spacing.lg}px`,
});

const SecurityIcon = styled(ShieldIcon)({
  color: colors.status.warning,
  fontSize: 20,
  marginTop: 2,
});

const SecurityText = styled(Typography)({
  fontSize: 13,
  color: colors.text.secondary,
  lineHeight: 1.4,
  flex: 1,
});

// ============================================================================
// Component
// ============================================================================

export function SupportPage({ onBack }: SupportPageProps): React.ReactElement {
  const { t } = useTranslation();

  const handleLinkClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const renderSupportOption = useCallback(
    (option: SupportOption) => (
      <ListItem key={option.id} disablePadding>
        <StyledListItemButton onClick={() => handleLinkClick(option.url)}>
          <StyledListItemIcon>{option.icon}</StyledListItemIcon>
          <ListItemText
            primary={option.title}
            secondary={option.description}
            primaryTypographyProps={{
              sx: {
                color: colors.text.primary,
                fontSize: 14,
                fontWeight: 500,
              },
            }}
            secondaryTypographyProps={{
              sx: {
                color: colors.text.secondary,
                fontSize: 12,
              },
            }}
          />
          <ExternalIcon />
        </StyledListItemButton>
      </ListItem>
    ),
    [handleLinkClick]
  );

  return (
    <SettingsPageLayout
      title={t('settings.help_support', 'Help & Support')}
      onBack={onBack}
    >
      <StyledList>{SUPPORT_OPTIONS.map(renderSupportOption)}</StyledList>

      <SecurityNotice>
        <SecurityIcon />
        <SecurityText>
          Salmon Wallet team will never ask for your seed phrase or private keys.
          Never share this information with anyone.
        </SecurityText>
      </SecurityNotice>
    </SettingsPageLayout>
  );
}

export default SupportPage;
