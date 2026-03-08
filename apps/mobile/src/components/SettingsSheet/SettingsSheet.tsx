/**
 * SettingsSheet - Slide-down settings panel with stacking sub-panels.
 *
 * Uses TopSheet for the slide-down animation and SettingsPanelStack
 * for horizontal panel transitions when navigating to sub-screens.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopSheet } from '../TopSheet';
import { SettingsPanelStack } from '../SettingsPanelStack';
import { SettingsHeaderContext, type SettingsHeaderState } from '../SettingsHeaderContext';
import {
  colors,
  spacing,
  contentPadding,
  borderRadius,
  fontSize,
  componentSizes,
  fontFamilyNative,
  useSettingsPanelStack,
  type SettingsScreen,
  type SettingsPanelEntry,
letterSpacing, } from '@salmon/shared';

import type { SettingsSheetProps, SettingsOption, SettingsSection } from './types';
import type { MobilePanelRegistry } from '../SettingsPanelStack';

// ============================================================================
// Constants
// ============================================================================

const DANGER_COLORS = {
  text: colors.status.error,
  background: colors.status.errorBackground,
  iconBackground: colors.status.errorBackground,
} as const;

const NEUTRAL_OPTION_COLORS = {
  background: colors.background.card,
} as const;

const SCREEN_TITLE_KEYS: Partial<Record<SettingsScreen, string>> = {
  accounts: 'settings.accounts.title',
  avatar: 'settings.profile_picture',
  security: 'settings.security.title',
  backup: 'settings.backup',
  privateKey: 'settings.private_key',
  language: 'settings.display_language',
  currency: 'settings.currency',
  explorer: 'settings.select_explorer',
  network: 'settings.developer_networks',
  addressBook: 'settings.address_book',
  'address-book-add': 'settings.addressbook.add',
  'address-book-edit': 'settings.addressbook.edit',
  trustedApps: 'settings.trusted_apps',
  support: 'settings.help_support',
  about: 'settings.about',
  'account-edit': 'settings.account_edit.title',
  'account-name': 'settings.account_edit.name_section',
  'account-add': 'settings.account_add.title',
};

const DYNAMIC_HEADER_SCREENS = new Set<SettingsScreen>(['account-add', 'privateKey']);

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    titleKey: 'settings.sections.account',
    options: [
      { id: 'accounts', icon: 'people-outline', labelKey: 'settings.accounts.title' },
      { id: 'avatar', icon: 'person-circle-outline', labelKey: 'settings.profile_picture' },
      { id: 'security', icon: 'shield-checkmark-outline', labelKey: 'settings.security.title' },
      { id: 'backup', icon: 'key-outline', labelKey: 'settings.backup' },
      { id: 'privateKey', icon: 'lock-closed-outline', labelKey: 'settings.private_key' },
    ],
  },
  {
    titleKey: 'settings.sections.preferences',
    options: [
      { id: 'language', icon: 'language-outline', labelKey: 'settings.display_language' },
      { id: 'currency', icon: 'cash-outline', labelKey: 'settings.currency' },
      { id: 'explorer', icon: 'open-outline', labelKey: 'settings.select_explorer' },
    ],
  },
  {
    titleKey: 'settings.sections.advanced',
    options: [
      { id: 'addressBook', icon: 'book-outline', labelKey: 'settings.address_book' },
      { id: 'trustedApps', icon: 'apps-outline', labelKey: 'settings.trusted_apps' },
      { id: 'network', icon: 'code-slash-outline', labelKey: 'settings.developer_networks', isToggle: true },
    ],
  },
  {
    titleKey: 'settings.sections.support',
    options: [
      { id: 'support', icon: 'help-circle-outline', labelKey: 'settings.help_support' },
      { id: 'about', icon: 'information-circle-outline', labelKey: 'settings.about' },
    ],
  },
  {
    titleKey: 'settings.sections.danger_zone',
    isDanger: true,
    options: [
      { id: 'removeWallet', icon: 'trash-outline', labelKey: 'settings.wallets.remove_wallet', isDanger: true, isAction: true },
      { id: 'removeAll', icon: 'log-out-outline', labelKey: 'settings.wallets.remove_all_wallets', isDanger: true, isAction: true },
    ],
  },
];

// ============================================================================
// Extended props (adds panelRegistry)
// ============================================================================

interface SettingsSheetWithPanelsProps extends SettingsSheetProps {
  panelRegistry?: MobilePanelRegistry;
  initialPanels?: SettingsPanelEntry[];
}

// ============================================================================
// Component
// ============================================================================

export function SettingsSheet({
  visible,
  onClose,
  panelRegistry,
  initialPanels,
  developerNetworksEnabled = false,
  onDeveloperNetworksToggle,
  onRemoveWallet,
  onRemoveAllWallets,
}: SettingsSheetWithPanelsProps): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { stack, push, pop, reset, canGoBack } = useSettingsPanelStack();
  const [panelBackAction, setPanelBackAction] = React.useState<(() => void) | null>(null);
  const [headerOverride, setHeaderOverride] = React.useState<SettingsHeaderState | null>(null);
  const headerOverrideBackRef = React.useRef<(() => void) | null>(null);

  // Top fade gradient opacity
  const topFadeOpacity = useMemo(() => new Animated.Value(0), []);

  // Reset stack when sheet closes
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => reset(), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, reset]);

  // Push initial panels when drawer opens
  const initialPanelsPushedRef = React.useRef(false);
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

  const handleOptionPress = useCallback(
    (option: SettingsOption) => {
      if (option.isAction) {
        if (option.id === 'removeWallet' && onRemoveWallet) {
          onRemoveWallet();
        } else if (option.id === 'removeAll' && onRemoveAllWallets) {
          onRemoveAllWallets();
        }
        onClose();
        return;
      }

      // Push panel instead of navigating
      if (!option.isToggle && option.id !== 'developerNetworks' && panelRegistry) {
        push(option.id as SettingsScreen);
      }
    },
    [onClose, onRemoveWallet, onRemoveAllWallets, push, panelRegistry]
  );

  const handleDeveloperNetworksToggle = useCallback(
    (value: boolean) => {
      if (onDeveloperNetworksToggle) {
        onDeveloperNetworksToggle(value);
      }
    },
    [onDeveloperNetworksToggle]
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(offsetY / 30, 1);
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

  const renderSectionHeader = useCallback(
    (section: SettingsSection) => {
      const title = t(section.titleKey) || section.titleKey;
      return (
        <View
          key={`header-${section.titleKey}`}
          style={[styles.sectionHeader, section.isDanger && styles.sectionHeaderDanger]}
        >
          <Text style={[styles.sectionHeaderText, section.isDanger && styles.sectionHeaderTextDanger]}>
            {title}
          </Text>
        </View>
      );
    },
    [t]
  );

  const renderOption = useCallback(
    (option: SettingsOption, sectionIsDanger?: boolean) => {
      const label = t(option.labelKey) || option.labelKey;
      const isDanger = option.isDanger || sectionIsDanger;

      if (option.isToggle) {
        return (
          <View
            key={`toggle-${option.labelKey}`}
            style={[styles.optionRow, styles.optionRowSurface, styles.optionRowNeutral]}
            accessibilityRole="switch"
            accessibilityLabel={label}
            accessibilityState={{ checked: developerNetworksEnabled }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={option.icon} size={24} color={colors.text.primary} />
            </View>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.optionLabel}>{label}</Text>
              <Text style={styles.toggleDescription}>
                {t('settings.developer_networks_description')}
              </Text>
            </View>
            <View style={styles.toggleControl}>
              <Switch
                value={developerNetworksEnabled}
                onValueChange={handleDeveloperNetworksToggle}
                trackColor={{ false: colors.background.card, true: colors.accent.primary }}
                thumbColor={colors.text.primary}
              />
            </View>
          </View>
        );
      }

      return (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionRow,
            styles.optionRowSurface,
            isDanger ? styles.optionRowDanger : styles.optionRowNeutral,
          ]}
          onPress={() => handleOptionPress(option)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={[styles.iconContainer, isDanger && styles.iconContainerDanger]}>
            <Ionicons name={option.icon} size={24} color={isDanger ? DANGER_COLORS.text : colors.text.primary} />
          </View>
          <Text style={[styles.optionLabel, isDanger && styles.optionLabelDanger]}>{label}</Text>
          {!option.isAction && (
            <Ionicons name="chevron-forward" size={20} color={isDanger ? DANGER_COLORS.text : colors.text.secondary} />
          )}
        </TouchableOpacity>
      );
    },
    [t, handleOptionPress, developerNetworksEnabled, handleDeveloperNetworksToggle]
  );

  const renderSection = useCallback(
    (section: SettingsSection, index: number) => (
      <View key={`section-${index}`} style={styles.section}>
        {renderSectionHeader(section)}
        {section.options.map((option) => renderOption(option, section.isDanger))}
      </View>
    ),
    [renderSectionHeader, renderOption]
  );

  const hasPanels = panelRegistry && stack.length > 0;
  const currentPanel = stack.length > 0 ? stack[stack.length - 1] : null;
  const fallbackTitle = currentPanel
    ? t(SCREEN_TITLE_KEYS[currentPanel.screen] || 'settings.title')
    : t('settings.title');
  const currentTitle = headerOverride?.title || fallbackTitle;
  const currentBackAction = currentPanel
    ? headerOverride?.onBack || panelBackAction || undefined
    : undefined;
  const invokeHeaderOverrideBack = useCallback(() => {
    headerOverrideBackRef.current?.();
  }, []);
  const handleHeaderStateChange = useCallback(
    (nextState: SettingsHeaderState | null) => {
      headerOverrideBackRef.current = nextState?.onBack ?? null;
      setHeaderOverride((previousState) => {
        if (!nextState) {
          return previousState === null ? previousState : null;
        }

        const hasSameTitle = previousState?.title === nextState.title;
        if (hasSameTitle && previousState !== null) {
          return previousState;
        }

        return {
          title: nextState.title,
          onBack: invokeHeaderOverrideBack,
        };
      });
    },
    [invokeHeaderOverrideBack],
  );
  const headerContextValue = useMemo(
    () => ({ setHeaderState: handleHeaderStateChange }),
    [handleHeaderStateChange],
  );
  const handlePanelBackActionChange = useCallback(
    (handler: (() => void) | null) => {
      setPanelBackAction(() => handler);
    },
    [],
  );

  useEffect(() => {
    if (!currentPanel || !DYNAMIC_HEADER_SCREENS.has(currentPanel.screen)) {
      headerOverrideBackRef.current = null;
      setHeaderOverride(null);
    }
  }, [currentPanel]);

  return (
    <SettingsHeaderContext.Provider value={headerContextValue}>
      <TopSheet
        visible={visible}
        onClose={onClose}
        title={currentTitle}
        onBack={currentBackAction}
        backAccessibilityLabel={t('actions.back', 'Go back')}
        fullHeight
        showHandle={false}
        style={styles.topSheet}
        contentStyle={styles.topSheetContent}
        testID="settings-sheet"
      >
        <View style={styles.container}>
          {/* Base: Settings Menu (panel 0) */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + spacing['5xl'] },
            ]}
            scrollEnabled
            alwaysBounceVertical
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {SETTINGS_SECTIONS.map(renderSection)}
          </ScrollView>

          {/* Top fade gradient */}
          <Animated.View
            style={[styles.topFadeGradient, { opacity: topFadeOpacity }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[colors.background.secondary, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Stacked panels overlay */}
          {hasPanels && panelRegistry && (
            <View style={styles.panelOverlay}>
              <SettingsPanelStack
                panelRegistry={panelRegistry}
                stack={stack}
                push={push}
                pop={pop}
                canGoBack={canGoBack}
                onBackActionChange={handlePanelBackActionChange}
              />
            </View>
          )}
        </View>
      </TopSheet>
    </SettingsHeaderContext.Provider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  topSheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  topSheetContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: contentPadding.screen,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeaderDanger: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.status.errorBackground,
    paddingTop: spacing.md,
  },
  sectionHeaderText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wider,
  },
  sectionHeaderTextDanger: {
    color: DANGER_COLORS.text,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    borderRadius: borderRadius.md,
  },
  optionRowSurface: {
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs / 2,
  },
  optionRowNeutral: {
    backgroundColor: NEUTRAL_OPTION_COLORS.background,
  },
  optionRowDanger: {
    backgroundColor: DANGER_COLORS.background,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainerDanger: {
    backgroundColor: DANGER_COLORS.iconBackground,
  },
  optionLabel: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
  },
  optionLabelDanger: {
    color: DANGER_COLORS.text,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleControl: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDescription: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xxs,
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: componentSizes.sheetFadeGradientHeight,
    zIndex: 1,
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});

export default SettingsSheet;
