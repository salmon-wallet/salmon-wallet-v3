/**
 * SettingsSheet Component Exports
 *
 * Provides a slide-down settings panel using the TopSheet component.
 * Displays a list of settings options with icons and navigation.
 *
 * Usage:
 * ```tsx
 * import { SettingsSheet } from '../components';
 *
 * function MyScreen() {
 *   const [settingsVisible, setSettingsVisible] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onPress={() => setSettingsVisible(true)}>
 *         Open Settings
 *       </Button>
 *       <SettingsSheet
 *         visible={settingsVisible}
 *         onClose={() => setSettingsVisible(false)}
 *         onNavigate={(screen) => router.push(`/settings/${screen}`)}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

export { SettingsSheet, default } from './SettingsSheet';
export type { SettingsSheetProps, SettingsOption, SettingsSection } from './types';
