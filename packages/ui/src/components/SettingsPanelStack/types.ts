import type { SettingsSheetBaseProps, SettingsScreen, SettingsPanelEntry } from '@salmon/shared';

/**
 * Props for the SettingsPanelStack component.
 * Extends SettingsSheetBaseProps (visible, onClose, developer networks, remove wallet).
 */
export interface SettingsPanelStackProps extends SettingsSheetBaseProps {
  /**
   * Registry mapping SettingsScreen to a React component that renders
   * the content for that screen. Each component receives `onBack` and
   * optional extra `props` from the panel entry.
   */
  panelRegistry: PanelRegistry;

  /**
   * Optional list of panels to push immediately when the drawer opens.
   * Useful for deep-linking into a specific settings screen from outside.
   * e.g. WalletSwitcher → Account Edit
   */
  initialPanels?: SettingsPanelEntry[];
}

/**
 * Props that every panel content component receives.
 */
export interface PanelContentProps {
  onBack: () => void;
  onNavigate: (screen: SettingsScreen, props?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

/**
 * A function that renders panel content given the standard props.
 */
export type PanelRenderer = (props: PanelContentProps) => React.ReactElement | null;

/**
 * Map from SettingsScreen to a renderer function.
 */
export type PanelRegistry = Partial<Record<SettingsScreen, PanelRenderer>>;
