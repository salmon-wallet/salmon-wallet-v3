import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily } from '@salmon/shared';
import { PageShell } from '@salmon/ui';

interface SettingsItem {
  label: string;
  route: string;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SectionTitle = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: colors.text.secondary,
  padding: `${spacing.lg}px ${spacing.xl}px ${spacing.sm}px`,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

const ItemButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${colors.border.default}`,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  textAlign: 'left',
  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
});

export function SettingsPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sections: SettingsSection[] = [
    {
      title: t('settings.section_account', 'Account'),
      items: [
        { label: t('settings.accounts.title', 'Accounts'), route: '/settings/accounts' },
        { label: t('settings.security.title', 'Security'), route: '/settings/security' },
        { label: t('settings.backup', 'Backup Seed Phrase'), route: '/settings/backup' },
        { label: t('settings.address_book', 'Address Book'), route: '/settings/address-book' },
      ],
    },
    {
      title: t('settings.section_preferences', 'Preferences'),
      items: [
        { label: t('settings.network', 'Network'), route: '/settings/network' },
        { label: t('settings.language', 'Language'), route: '/settings/language' },
        { label: t('settings.currency', 'Currency'), route: '/settings/currency' },
        { label: t('settings.explorer', 'Block Explorer'), route: '/settings/explorer' },
      ],
    },
    {
      title: t('settings.section_advanced', 'Advanced'),
      items: [
        { label: t('settings.trusted_apps', 'Connected Apps'), route: '/settings/trusted-apps' },
        { label: t('settings.support', 'Help & Support'), route: '/settings/support' },
        { label: t('settings.about', 'About'), route: '/settings/about' },
      ],
    },
  ];

  return (
    <PageShell title={t('settings.title', 'Settings')} onBack={() => navigate('/home')} backgroundColor="primary" fullHeight={false}>
      <Box>
        {sections.map((section) => (
          <Box key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.items.map((item) => (
              <ItemButton key={item.route} onClick={() => navigate(item.route)}>
                <Typography sx={{ color: colors.text.primary, fontFamily: `${fontFamily.sans}, sans-serif` }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: 20 }}>&#8250;</Typography>
              </ItemButton>
            ))}
          </Box>
        ))}
      </Box>
    </PageShell>
  );
}
