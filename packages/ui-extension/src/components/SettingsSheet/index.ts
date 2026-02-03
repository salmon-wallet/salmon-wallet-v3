/**
 * SettingsSheet Component
 *
 * A slide-out settings panel for the browser extension that provides
 * organized access to wallet settings, preferences, and actions.
 *
 * Usage:
 * ```tsx
 * import { SettingsSheet } from '@salmon/ui-extension';
 *
 * <SettingsSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onNavigate={(screen) => navigate(`/settings/${screen}`)}
 * />
 * ```
 */

export { SettingsSheet, default } from './SettingsSheet';
export type {
  SettingsSheetProps,
  SettingsSection,
  SettingsItem,
} from './types';
