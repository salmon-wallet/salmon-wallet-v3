/**
 * SettingsSheet - Slide-down settings panel
 *
 * This component provides a settings menu that slides down from the top
 * of the screen using the TopSheet component. It displays a list of
 * settings options that the user can navigate to.
 *
 * Features:
 * - Uses TopSheet for smooth slide-down animation
 * - Displays settings options with icons and labels
 * - Supports i18n translations via useTranslation
 * - Calls onNavigate when a settings option is pressed
 * - Grouped sections with headers
 * - Toggle switch for Developer Networks
 * - Danger zone for destructive actions
 *
 * Usage:
 * ```tsx
 * <SettingsSheet
 *   visible={isSettingsOpen}
 *   onClose={() => setIsSettingsOpen(false)}
 *   onNavigate={(screen) => router.push(`/settings/${screen}`)}
 *   developerNetworksEnabled={showTestnets}
 *   onDeveloperNetworksToggle={setShowTestnets}
 *   onRemoveWallet={handleRemoveWallet}
 *   onRemoveAllWallets={handleRemoveAllWallets}
 * />
 * ```
 */

import React, { useCallback, useMemo } from 'react';
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
import { TopSheet } from '../TopSheet';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  componentSizes,
} from '@salmon/shared';
import type { SettingsScreen } from '@salmon/shared';

import type { SettingsSheetProps, SettingsOption, SettingsSection } from './types';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

/**
 * Danger zone colors
 */
const DANGER_COLORS = {
  text: '#FF4444',
  background: 'rgba(255, 68, 68, 0.1)',
  iconBackground: 'rgba(255, 68, 68, 0.15)',
} as const;

/**
 * Settings sections configuration
 * Each section has a title key and list of options
 */
const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    titleKey: 'settings.sections.account',
    options: [
      {
        id: 'security',
        icon: 'shield-checkmark-outline',
        labelKey: 'settings.security',
      },
      {
        id: 'backup',
        icon: 'key-outline',
        labelKey: 'settings.backup',
      },
      {
        id: 'privateKey',
        icon: 'lock-closed-outline',
        labelKey: 'settings.private_key',
      },
    ],
  },
  {
    titleKey: 'settings.sections.preferences',
    options: [
      {
        id: 'network',
        icon: 'globe-outline',
        labelKey: 'settings.change_network',
      },
      {
        id: 'language',
        icon: 'language-outline',
        labelKey: 'settings.display_language',
      },
      {
        id: 'currency',
        icon: 'cash-outline',
        labelKey: 'settings.currency',
      },
      {
        id: 'explorer',
        icon: 'open-outline',
        labelKey: 'settings.select_explorer',
      },
    ],
  },
  {
    titleKey: 'settings.sections.advanced',
    options: [
      {
        id: 'addressBook',
        icon: 'book-outline',
        labelKey: 'settings.address_book',
      },
      {
        id: 'trustedApps',
        icon: 'apps-outline',
        labelKey: 'settings.trusted_apps',
      },
      {
        id: 'network', // This is a special toggle item, id is used for identification
        icon: 'code-slash-outline',
        labelKey: 'settings.developer_networks',
        isToggle: true,
      },
    ],
  },
  {
    titleKey: 'settings.sections.support',
    options: [
      {
        id: 'support',
        icon: 'help-circle-outline',
        labelKey: 'settings.help_support',
      },
      {
        id: 'about',
        icon: 'information-circle-outline',
        labelKey: 'settings.about',
      },
    ],
  },
  {
    titleKey: 'settings.sections.danger_zone',
    isDanger: true,
    options: [
      {
        id: 'removeWallet',
        icon: 'trash-outline',
        labelKey: 'settings.wallets.remove_wallet',
        isDanger: true,
        isAction: true,
      },
      {
        id: 'removeAll',
        icon: 'log-out-outline',
        labelKey: 'settings.wallets.remove_all_wallets',
        isDanger: true,
        isAction: true,
      },
    ],
  },
];

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

  // Top fade gradient opacity
  const topFadeOpacity = useMemo(() => new Animated.Value(0), []);

  /**
   * Handle settings option press
   */
  const handleOptionPress = useCallback(
    (option: SettingsOption) => {
      // Handle action options (direct callbacks)
      if (option.isAction) {
        if (option.id === 'removeWallet' && onRemoveWallet) {
          onRemoveWallet();
        } else if (option.id === 'removeAll' && onRemoveAllWallets) {
          onRemoveAllWallets();
        }
        onClose();
        return;
      }

      // Handle navigation options
      if (onNavigate && !option.isToggle && option.id !== 'developerNetworks') {
        onNavigate(option.id as SettingsScreen);
        onClose();
      }
    },
    [onNavigate, onClose, onRemoveWallet, onRemoveAllWallets]
  );

  /**
   * Handle developer networks toggle
   */
  const handleDeveloperNetworksToggle = useCallback(
    (value: boolean) => {
      if (onDeveloperNetworksToggle) {
        onDeveloperNetworksToggle(value);
      }
    },
    [onDeveloperNetworksToggle]
  );

  /**
   * Handle scroll to show/hide top fade gradient dynamically
   */
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(offsetY / 30, 1);
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

  /**
   * Render a section header
   */
  const renderSectionHeader = useCallback(
    (section: SettingsSection) => {
      const title = t(section.titleKey) || section.titleKey;

      return (
        <View
          key={`header-${section.titleKey}`}
          style={[
            styles.sectionHeader,
            section.isDanger && styles.sectionHeaderDanger,
          ]}
        >
          <Text
            style={[
              styles.sectionHeaderText,
              section.isDanger && styles.sectionHeaderTextDanger,
            ]}
          >
            {title}
          </Text>
        </View>
      );
    },
    [t]
  );

  /**
   * Render a single settings option row
   */
  const renderOption = useCallback(
    (option: SettingsOption, sectionIsDanger?: boolean) => {
      // Get the translated label, with fallback to the key itself
      const label = t(option.labelKey) || option.labelKey;
      const isDanger = option.isDanger || sectionIsDanger;

      // Render toggle option
      if (option.isToggle) {
        return (
          <View
            key={`toggle-${option.labelKey}`}
            style={styles.optionRow}
            accessibilityRole="switch"
            accessibilityLabel={label}
            accessibilityState={{ checked: developerNetworksEnabled }}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={option.icon}
                size={24}
                color={colors.text.primary}
              />
            </View>

            {/* Label and Description */}
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.optionLabel}>{label}</Text>
              <Text style={styles.toggleDescription}>
                {t('settings.developer_networks_description')}
              </Text>
            </View>

            {/* Switch */}
            <Switch
              value={developerNetworksEnabled}
              onValueChange={handleDeveloperNetworksToggle}
              trackColor={{ false: colors.background.card, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
          </View>
        );
      }

      // Render regular option or danger option
      return (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionRow,
            isDanger && styles.optionRowDanger,
          ]}
          onPress={() => handleOptionPress(option)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              isDanger && styles.iconContainerDanger,
            ]}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={isDanger ? DANGER_COLORS.text : colors.text.primary}
            />
          </View>

          {/* Label */}
          <Text
            style={[
              styles.optionLabel,
              isDanger && styles.optionLabelDanger,
            ]}
          >
            {label}
          </Text>

          {/* Chevron (not for danger actions) */}
          {!option.isAction && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDanger ? DANGER_COLORS.text : colors.text.secondary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [t, handleOptionPress, developerNetworksEnabled, handleDeveloperNetworksToggle]
  );

  /**
   * Render a complete section
   */
  const renderSection = useCallback(
    (section: SettingsSection, index: number) => {
      return (
        <View key={`section-${index}`} style={styles.section}>
          {renderSectionHeader(section)}
          {section.options.map((option) => renderOption(option, section.isDanger))}
        </View>
      );
    },
    [renderSectionHeader, renderOption]
  );

  return (
    <TopSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.title')}
      testID="settings-sheet"
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
      </View>
    </TopSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeaderDanger: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.2)',
    paddingTop: spacing.md,
  },
  sectionHeaderText: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderTextDanger: {
    color: DANGER_COLORS.text,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  optionRowDanger: {
    backgroundColor: DANGER_COLORS.background,
    marginHorizontal: spacing.xs,
    marginVertical: spacing.xs / 2,
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
    fontFamily: FONT_FAMILY.medium,
    fontSize: fontSize.md,
  },
  optionLabelDanger: {
    color: DANGER_COLORS.text,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleDescription: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: componentSizes.sheetFadeGradientHeight,
    zIndex: 1,
  },
});

export default SettingsSheet;
