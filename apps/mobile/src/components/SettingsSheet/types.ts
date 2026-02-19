/**
 * SettingsSheet Component Types
 *
 * Type definitions for the SettingsSheet component which provides
 * a slide-down settings panel using the TopSheet component.
 */

import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';
import type {
  SettingsSheetBaseProps,
  SettingsOptionBase,
  SettingsSectionBase,
} from '@salmon/shared';

/**
 * Props for the SettingsSheet component (React Native specific)
 */
export interface SettingsSheetProps extends SettingsSheetBaseProps {}

/**
 * Settings option item configuration (React Native specific)
 * Extends base with Ionicons icon name
 */
export interface SettingsOption extends SettingsOptionBase {
  /** Ionicons icon name */
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Whether this is a toggle option (switch) instead of navigation */
  isToggle?: boolean;
  /** Whether this is an action (direct callback) instead of navigation */
  isAction?: boolean;
}

/**
 * Settings section configuration
 */
export interface SettingsSection extends SettingsSectionBase {
  /** Options in this section */
  options: SettingsOption[];
}
