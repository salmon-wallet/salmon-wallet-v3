/**
 * SettingsPageLayout - Shared layout for settings pages
 *
 * This component provides a consistent layout structure for settings pages,
 * including:
 * - Header with back button and title
 * - Content area for page-specific content
 * - Consistent styling and spacing
 *
 * Used by: BackupPage, CurrencyPage, AboutPage, and other settings pages
 */

import React from 'react';
import { styled } from '../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface SettingsPageLayoutProps {
  /** Page title */
  title: string;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Content to display in the page */
  children: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
});

const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const Title = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const Content = styled(Box)({
  flex: 1,
  overflowY: 'auto',
});

// ============================================================================
// Component
// ============================================================================

/**
 * SettingsPageLayout - Reusable layout for settings pages
 */
export function SettingsPageLayout({
  title,
  onBack,
  children,
  className,
}: SettingsPageLayoutProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Container className={className}>
      <Header>
        <BackButton onClick={onBack} aria-label={t('actions.back', 'Back')}>
          <ArrowBackIcon />
        </BackButton>
        <Title>{title}</Title>
      </Header>

      <Content>
        {children}
      </Content>
    </Container>
  );
}

export default SettingsPageLayout;
