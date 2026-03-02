/**
 * SettingsSheet Component Types
 *
 * Type definitions for the SettingsSheet component which provides
 * a slide-out settings panel for the browser extension.
 */

import type {
  SettingsSheetBaseProps,
  SettingsOptionBase,
  SettingsSectionBase,
  SettingsScreen,
} from '@salmon/shared';

/**
 * Props for the SettingsSheet component.
 * @deprecated Use SettingsPanelStack instead.
 */
export interface SettingsSheetProps extends SettingsSheetBaseProps {
  /** @deprecated Navigation is now handled internally by SettingsPanelStack */
  onNavigate?: (screen: SettingsScreen) => void;
}

/**
 * Settings item configuration (browser extension specific)
 */
export interface SettingsItem extends SettingsOptionBase {
  /** Type of item: navigation, toggle, or action */
  type: 'navigation' | 'toggle' | 'action';
}

/**
 * Settings section configuration
 */
export interface SettingsSection extends SettingsSectionBase {
  /** Items in this section */
  items: SettingsItem[];
}
