/**
 * SettingsSheet - Slide-out settings panel for browser extension
 *
 * This component provides a settings menu that slides from the right
 * using MUI Drawer component. It displays organized settings options
 * grouped by category with support for navigation, toggles, and actions.
 *
 * Features:
 * - Uses MUI Drawer for smooth slide-in animation from right
 * - Displays settings options grouped into sections
 * - Supports i18n translations via useTranslation
 * - Developer Networks toggle with Switch component
 * - Danger zone with red styling for destructive actions
 *
 * Usage:
 * ```tsx
 * <SettingsSheet
 *   visible={isSettingsOpen}
 *   onClose={() => setIsSettingsOpen(false)}
 *   onNavigate={(screen) => navigate(`/settings/${screen}`)}
 *   developerNetworksEnabled={devNetEnabled}
 *   onDeveloperNetworksToggle={setDevNetEnabled}
 *   onRemoveWallet={handleRemoveWallet}
 *   onRemoveAllWallets={handleRemoveAll}
 * />
 * ```
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

// MUI Icons
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Key';
import LanguageIcon from '@mui/icons-material/Language';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ExploreIcon from '@mui/icons-material/Explore';
import ContactsIcon from '@mui/icons-material/Contacts';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { colors, spacing, fontSize, fontWeight, letterSpacing, shadowsCSS, opacity } from '@salmon/shared';
import type { SettingsScreen } from '@salmon/shared';

import type {
  SettingsSheetProps,
  SettingsSection,
  SettingsItem,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DRAWER_WIDTH = 320;

/**
 * Icon mapping for settings items
 */
const ICON_MAP: Record<string, React.ReactNode> = {
  avatar: <AccountCircleIcon />,
  security: <SecurityIcon />,
  backup: <BackupIcon />,
  privateKey: <VpnKeyIcon />,
  language: <LanguageIcon />,
  currency: <AttachMoneyIcon />,
  explorer: <ExploreIcon />,
  addressBook: <ContactsIcon />,
  trustedApps: <VerifiedUserIcon />,
  developerNetworks: <CodeIcon />,
  removeWallet: <DeleteIcon />,
  removeAll: <DeleteForeverIcon />,
  about: <InfoIcon />,
  support: <HelpOutlineIcon />,
};

/**
 * Settings sections configuration
 */
const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    titleKey: 'settings.sections.account',
    items: [
      {
        id: 'accounts',
        labelKey: 'settings.accounts.title',
        type: 'navigation',
      },
      {
        id: 'avatar',
        labelKey: 'settings.profile_picture',
        type: 'navigation',
      },
      {
        id: 'security',
        labelKey: 'settings.security.title',
        type: 'navigation',
      },
      {
        id: 'backup',
        labelKey: 'settings.backup',
        type: 'navigation',
      },
      {
        id: 'privateKey',
        labelKey: 'settings.private_key',
        type: 'navigation',
      },
    ],
  },
  {
    titleKey: 'settings.sections.preferences',
    items: [
      {
        id: 'language',
        labelKey: 'settings.display_language',
        type: 'navigation',
      },
      {
        id: 'currency',
        labelKey: 'settings.currency',
        type: 'navigation',
      },
      {
        id: 'explorer',
        labelKey: 'settings.explorer',
        type: 'navigation',
      },
    ],
  },
  {
    titleKey: 'settings.sections.advanced',
    items: [
      {
        id: 'addressBook',
        labelKey: 'settings.address_book',
        type: 'navigation',
      },
      {
        id: 'trustedApps',
        labelKey: 'settings.trusted_apps',
        type: 'navigation',
      },
      {
        id: 'developerNetworks',
        labelKey: 'settings.developer_networks',
        descriptionKey: 'settings.developer_networks_desc',
        type: 'toggle',
      },
      {
        id: 'about',
        labelKey: 'settings.about',
        type: 'navigation',
      },
      {
        id: 'support',
        labelKey: 'settings.help_support',
        type: 'navigation',
      },
    ],
  },
  {
    titleKey: 'settings.sections.danger_zone',
    isDanger: true,
    items: [
      {
        id: 'removeWallet',
        labelKey: 'settings.remove_wallet',
        type: 'action',
        isDanger: true,
      },
      {
        id: 'removeAll',
        labelKey: 'settings.remove_all_wallets',
        type: 'action',
        isDanger: true,
      },
    ],
  },
];

// ============================================================================
// Styled Components
// ============================================================================

const DrawerPaper = styled(Box)({
  width: DRAWER_WIDTH,
  height: '100%',
  backgroundColor: colors.background.primary,
  display: 'flex',
  flexDirection: 'column',
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
});

const HeaderTitle = styled(Typography)({
  fontSize: fontSize.lg,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  '&:hover': {
    backgroundColor: colors.background.card,
  },
});

const Content = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: `${spacing.sm}px 0`,
});

const SectionTitle = styled(Typography)<{ $isDanger?: boolean }>(({ $isDanger }) => ({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wider,
  color: $isDanger ? colors.status.error : colors.text.secondary,
  padding: `${spacing.md}px ${spacing.lg}px ${spacing.sm}px`,
  marginTop: spacing.sm,
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
});

const StyledListItemButton = styled(ListItemButton)<{ $isDanger?: boolean }>(
  ({ $isDanger }) => ({
    padding: `${spacing.md}px ${spacing.lg}px`,
    '&:hover': {
      backgroundColor: $isDanger
        ? colors.status.errorBackground
        : colors.background.card,
    },
  })
);

const StyledListItemIcon = styled(ListItemIcon)<{ $isDanger?: boolean }>(
  ({ $isDanger }) => ({
    minWidth: 40,
    color: $isDanger ? colors.status.error : colors.text.secondary,
  })
);

const StyledListItemText = styled(ListItemText)<{ $isDanger?: boolean }>(
  ({ $isDanger }) => ({
    '& .MuiListItemText-primary': {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: $isDanger ? colors.status.error : colors.text.primary,
    },
    '& .MuiListItemText-secondary': {
      fontSize: fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing['2xs'],
    },
  })
);

const StyledSwitch = styled(Switch)({
  '& .MuiSwitch-switchBase': {
    '&.Mui-checked': {
      color: colors.accent.primary,
      '& + .MuiSwitch-track': {
        backgroundColor: colors.accent.primary,
        opacity: opacity.disabled,
      },
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: colors.text.secondary,
  },
});

const StyledDivider = styled(Divider)({
  backgroundColor: colors.border.default,
  margin: `${spacing.sm}px ${spacing.lg}px`,
});

const ChevronIcon = styled(ChevronRightIcon)({
  color: colors.text.secondary,
  fontSize: fontSize.xl,
});

// ============================================================================
// Component
// ============================================================================

export function SettingsSheet({
  visible,
  onClose,
  onNavigate,
  developerNetworksEnabled = false,
  onDeveloperNetworksToggle,
  onRemoveWallet,
  onRemoveAllWallets,
}: SettingsSheetProps): React.ReactElement {
  const { t } = useTranslation();

  /**
   * Handle item click based on type
   */
  const handleItemClick = useCallback(
    (item: SettingsItem) => {
      switch (item.type) {
        case 'navigation':
          if (onNavigate && item.id !== 'developerNetworks') {
            onNavigate(item.id as SettingsScreen);
          }
          break;
        case 'action':
          if (item.id === 'removeWallet' && onRemoveWallet) {
            onRemoveWallet();
          } else if (item.id === 'removeAll' && onRemoveAllWallets) {
            onRemoveAllWallets();
          }
          break;
        // Toggle handled separately
        default:
          break;
      }
    },
    [onNavigate, onRemoveWallet, onRemoveAllWallets]
  );

  /**
   * Handle developer networks toggle
   */
  const handleToggleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onDeveloperNetworksToggle) {
        onDeveloperNetworksToggle(event.target.checked);
      }
    },
    [onDeveloperNetworksToggle]
  );

  /**
   * Render a single settings item
   */
  const renderItem = useCallback(
    (item: SettingsItem) => {
      const icon = ICON_MAP[item.id] || <InfoIcon />;
      const label = t(item.labelKey) || item.labelKey;
      const description = item.descriptionKey
        ? t(item.descriptionKey)
        : undefined;

      if (item.type === 'toggle') {
        return (
          <StyledListItem key={item.id}>
            <StyledListItemButton
              onClick={() => {
                if (onDeveloperNetworksToggle) {
                  onDeveloperNetworksToggle(!developerNetworksEnabled);
                }
              }}
            >
              <StyledListItemIcon>{icon}</StyledListItemIcon>
              <StyledListItemText
                primary={label}
                secondary={description}
              />
              <StyledSwitch
                edge="end"
                checked={developerNetworksEnabled}
                onChange={handleToggleChange}
                onClick={(e) => e.stopPropagation()}
              />
            </StyledListItemButton>
          </StyledListItem>
        );
      }

      return (
        <StyledListItem key={item.id}>
          <StyledListItemButton
            $isDanger={item.isDanger}
            onClick={() => handleItemClick(item)}
          >
            <StyledListItemIcon $isDanger={item.isDanger}>
              {icon}
            </StyledListItemIcon>
            <StyledListItemText
              $isDanger={item.isDanger}
              primary={label}
              secondary={description}
            />
            {item.type === 'navigation' && <ChevronIcon />}
          </StyledListItemButton>
        </StyledListItem>
      );
    },
    [
      t,
      developerNetworksEnabled,
      handleToggleChange,
      handleItemClick,
      onDeveloperNetworksToggle,
    ]
  );

  /**
   * Render a settings section
   */
  const renderSection = useCallback(
    (section: SettingsSection, index: number) => {
      const isLastSection = index === SETTINGS_SECTIONS.length - 1;

      return (
        <React.Fragment key={section.titleKey}>
          <SectionTitle $isDanger={section.isDanger}>
            {t(section.titleKey) || section.titleKey}
          </SectionTitle>
          <List disablePadding>
            {section.items.map(renderItem)}
          </List>
          {!isLastSection && <StyledDivider />}
        </React.Fragment>
      );
    },
    [t, renderItem]
  );

  return (
    <Drawer
      anchor="right"
      open={visible}
      onClose={onClose}
      disableEnforceFocus
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: shadowsCSS.none,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: colors.dialog.overlay,
          },
        },
      }}
    >
      <DrawerPaper>
        <Header>
          <HeaderTitle>{t('settings.title', 'Settings')}</HeaderTitle>
          <CloseButton onClick={onClose} aria-label={t('actions.close', 'Close')}>
            <CloseIcon />
          </CloseButton>
        </Header>
        <Content>{SETTINGS_SECTIONS.map(renderSection)}</Content>
      </DrawerPaper>
    </Drawer>
  );
}

export default SettingsSheet;
