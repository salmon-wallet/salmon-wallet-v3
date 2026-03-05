import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import {
  colors,
  spacing,
  useSettingsPanelStack,
  type SettingsScreen,
  fontSize,
  fontWeight,
  letterSpacing,
  shadowsCSS,
} from '@salmon/shared';
import { styled } from '../../utils/styled';

import type { SettingsPanelStackProps } from './types';

// Re-use the same section/item types from the old SettingsSheet
interface SettingsItem {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  type: 'navigation' | 'toggle' | 'action';
  isDanger?: boolean;
}

interface SettingsSection {
  titleKey: string;
  isDanger?: boolean;
  items: SettingsItem[];
}

// ============================================================================
// Constants
// ============================================================================

const DRAWER_WIDTH = 320;
const PUSH_DURATION = 250;
const POP_DURATION = 200;

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
  accounts: <AccountCircleIcon />,
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    titleKey: 'settings.sections.account',
    items: [
      { id: 'accounts', labelKey: 'settings.accounts.title', type: 'navigation' },
      { id: 'avatar', labelKey: 'settings.profile_picture', type: 'navigation' },
      { id: 'security', labelKey: 'settings.security.title', type: 'navigation' },
      { id: 'backup', labelKey: 'settings.backup', type: 'navigation' },
      { id: 'privateKey', labelKey: 'settings.private_key', type: 'navigation' },
    ],
  },
  {
    titleKey: 'settings.sections.preferences',
    items: [
      { id: 'language', labelKey: 'settings.display_language', type: 'navigation' },
      { id: 'currency', labelKey: 'settings.currency', type: 'navigation' },
      { id: 'explorer', labelKey: 'settings.explorer', type: 'navigation' },
    ],
  },
  {
    titleKey: 'settings.sections.advanced',
    items: [
      { id: 'addressBook', labelKey: 'settings.address_book', type: 'navigation' },
      { id: 'trustedApps', labelKey: 'settings.trusted_apps', type: 'navigation' },
      { id: 'developerNetworks', labelKey: 'settings.developer_networks', descriptionKey: 'settings.developer_networks_desc', type: 'toggle' },
      { id: 'about', labelKey: 'settings.about', type: 'navigation' },
      { id: 'support', labelKey: 'settings.help_support', type: 'navigation' },
    ],
  },
  {
    titleKey: 'settings.sections.danger_zone',
    isDanger: true,
    items: [
      { id: 'removeWallet', labelKey: 'settings.remove_wallet', type: 'action', isDanger: true },
      { id: 'removeAll', labelKey: 'settings.remove_all_wallets', type: 'action', isDanger: true },
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
  position: 'relative',
  overflow: 'hidden',
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  flexShrink: 0,
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

const MenuContent = styled(Box)({
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
        opacity: 0.5,
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

export function SettingsPanelStack({
  visible,
  onClose,
  panelRegistry,
  initialPanels,
  developerNetworksEnabled = false,
  onDeveloperNetworksToggle,
  onRemoveWallet,
  onRemoveAllWallets,
}: SettingsPanelStackProps): React.ReactElement {
  const { t } = useTranslation();
  const { stack, push, pop, reset, canGoBack } = useSettingsPanelStack();

  // Track animation state for the top panel
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');
  const animationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialPanelsPushedRef = useRef(false);

  // Push initial panels when drawer opens (no animation, instant)
  useEffect(() => {
    if (visible && initialPanels && initialPanels.length > 0 && !initialPanelsPushedRef.current) {
      initialPanelsPushedRef.current = true;
      for (const entry of initialPanels) {
        push(entry.screen, entry.props);
      }
    }
    if (!visible) {
      initialPanelsPushedRef.current = false;
    }
  }, [visible, initialPanels, push]);

  // Reset stack when drawer closes
  useEffect(() => {
    if (!visible) {
      // Delay reset to allow drawer close animation
      const timer = setTimeout(() => {
        reset();
        setAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, reset]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const handlePush = useCallback(
    (screen: SettingsScreen, props?: Record<string, unknown>) => {
      if (animating) return;
      setSlideDirection('in');
      setAnimating(true);
      push(screen, props);
      animationTimerRef.current = setTimeout(() => {
        setAnimating(false);
      }, PUSH_DURATION);
    },
    [push, animating],
  );

  const handlePop = useCallback(() => {
    if (animating || !canGoBack) return;
    // Animate out first, then pop after animation completes
    setSlideDirection('out');
    setAnimating(true);
    animationTimerRef.current = setTimeout(() => {
      pop();
      setAnimating(false);
    }, POP_DURATION);
  }, [pop, canGoBack, animating]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ---- Settings menu (panel 0) ----

  const handleItemClick = useCallback(
    (item: SettingsItem) => {
      if (item.type === 'navigation') {
        handlePush(item.id as SettingsScreen);
      } else if (item.type === 'action') {
        if (item.id === 'removeWallet' && onRemoveWallet) {
          onRemoveWallet();
        } else if (item.id === 'removeAll' && onRemoveAllWallets) {
          onRemoveAllWallets();
        }
      }
    },
    [handlePush, onRemoveWallet, onRemoveAllWallets],
  );

  const handleToggleChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>) => {
      if (onDeveloperNetworksToggle) {
        onDeveloperNetworksToggle(!developerNetworksEnabled);
      }
    },
    [onDeveloperNetworksToggle, developerNetworksEnabled],
  );

  const renderItem = useCallback(
    (item: SettingsItem) => {
      const icon = ICON_MAP[item.id] || <InfoIcon />;
      const label = t(item.labelKey) || item.labelKey;
      const description = item.descriptionKey ? t(item.descriptionKey) : undefined;

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
              <StyledListItemText primary={label} secondary={description} />
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
            <StyledListItemText $isDanger={item.isDanger} primary={label} secondary={description} />
            {item.type === 'navigation' && <ChevronIcon />}
          </StyledListItemButton>
        </StyledListItem>
      );
    },
    [t, developerNetworksEnabled, handleToggleChange, handleItemClick, onDeveloperNetworksToggle],
  );

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
    [t, renderItem],
  );

  return (
    <Drawer
      anchor="right"
      open={visible}
      onClose={handleClose}
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
        {/* Base: Settings Menu (panel 0) */}
        <Header>
          <HeaderTitle>{t('settings.title', 'Settings')}</HeaderTitle>
          <CloseButton onClick={handleClose} aria-label={t('actions.close', 'Close')}>
            <CloseIcon />
          </CloseButton>
        </Header>
        <MenuContent>
          {SETTINGS_SECTIONS.map(renderSection)}
        </MenuContent>

        {/* Stacked panels */}
        {stack.map((entry, idx) => {
          const isTop = idx === stack.length - 1;
          // Only render top 2 panels for performance
          if (idx < stack.length - 2) return null;
          const isExiting = isTop && animating && slideDirection === 'out';
          const Panel = panelRegistry[entry.screen];
          if (!Panel) return null;
          return (
            <PanelWrapper
              key={`${entry.screen}-${idx}`}
              $isTop={isTop}
              $animating={animating && isTop}
              $direction={isTop && animating ? slideDirection : 'idle'}
            >
              <Panel
                onBack={isExiting ? () => {} : handlePop}
                onNavigate={isExiting ? () => {} : handlePush}
                {...(entry.props || {})}
              />
            </PanelWrapper>
          );
        })}
      </DrawerPaper>
    </Drawer>
  );
}

// ============================================================================
// Panel Wrapper with animation
// ============================================================================

const PanelWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== '$isTop' && prop !== '$animating' && prop !== '$direction',
})<{ $isTop: boolean; $animating: boolean; $direction: 'in' | 'out' | 'idle' }>(
  ({ $isTop, $animating, $direction }) => {
    const isSlideIn = $animating && $isTop && $direction === 'in';
    const isSlideOut = $animating && $isTop && $direction === 'out';

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background.primary,
      display: 'flex',
      flexDirection: 'column',
      zIndex: $isTop ? 2 : 1,
      transform: 'translateX(0)',
      ...(isSlideIn
        ? {
            animation: `slideInFromRight ${PUSH_DURATION}ms ease-out forwards`,
          }
        : {}),
      ...(isSlideOut
        ? {
            animation: `slideOutToRight ${POP_DURATION}ms ease-in forwards`,
          }
        : {}),
      '@keyframes slideInFromRight': {
        from: { transform: 'translateX(100%)' },
        to: { transform: 'translateX(0)' },
      },
      '@keyframes slideOutToRight': {
        from: { transform: 'translateX(0)' },
        to: { transform: 'translateX(100%)' },
      },
    };
  },
);

export default SettingsPanelStack;
