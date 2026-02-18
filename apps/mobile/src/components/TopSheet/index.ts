/**
 * TopSheet Component Exports
 *
 * A slide-down modal component that appears from the top of the screen.
 * Designed for settings panels, wallet switchers, and other overlay content
 * that benefits from top-anchored positioning.
 *
 * @example
 * ```tsx
 * import { TopSheet } from '../components';
 *
 * function MyComponent() {
 *   const [visible, setVisible] = useState(false);
 *
 *   return (
 *     <TopSheet
 *       visible={visible}
 *       onClose={() => setVisible(false)}
 *       title="Settings"
 *     >
 *       <SettingsContent />
 *     </TopSheet>
 *   );
 * }
 * ```
 */

export { TopSheet, default } from './TopSheet';
export type {
  TopSheetProps,
  TopSheetAnimationConfig,
  TopSheetRef,
} from './types';
