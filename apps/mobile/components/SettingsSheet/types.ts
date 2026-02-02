/**
 * SettingsSheet Component Types
 *
 * Type definitions for the SettingsSheet component which provides
 * a slide-down settings panel using the TopSheet component.
 */

/**
 * Available settings screens that can be navigated to
 */
export type SettingsScreen =
  | 'security'
  | 'network'
  | 'language'
  | 'currency'
  | 'about'
  | 'backup'
  | 'support'
  | 'addressBook'
  | 'explorer'
  | 'trustedApps'
  | 'removeWallet'
  | 'removeAll';

/**
 * Props for the SettingsSheet component
 */
export interface SettingsSheetProps {
  /**
   * Whether the settings sheet is visible.
   * When true, the sheet slides down into view.
   * When false, the sheet slides up out of view.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   * Called when:
   * - User taps on the backdrop
   * - User presses the close button
   * - User presses the Android back button
   */
  onClose: () => void;

  /**
   * Optional callback when user navigates to a settings screen.
   * Called with the screen type when a settings option is pressed.
   */
  onNavigate?: (screen: SettingsScreen) => void;

  /**
   * Whether developer networks (testnets/devnets) are enabled.
   */
  developerNetworksEnabled?: boolean;

  /**
   * Callback when developer networks toggle is changed.
   */
  onDeveloperNetworksToggle?: (enabled: boolean) => void;

  /**
   * Callback when remove wallet action is triggered.
   * This is a direct action, not navigation.
   */
  onRemoveWallet?: () => void;

  /**
   * Callback when remove all wallets action is triggered.
   * This is a direct action, not navigation.
   */
  onRemoveAllWallets?: () => void;
}

/**
 * Settings option item configuration
 */
export interface SettingsOption {
  /** Unique identifier for the option */
  id: SettingsScreen;
  /** Ionicons icon name */
  icon: string;
  /** Translation key for the label */
  labelKey: string;
  /** Whether this is a toggle option (switch) instead of navigation */
  isToggle?: boolean;
  /** Whether this is a danger/destructive option */
  isDanger?: boolean;
  /** Whether this is an action (direct callback) instead of navigation */
  isAction?: boolean;
}

/**
 * Settings section configuration
 */
export interface SettingsSection {
  /** Section header translation key */
  titleKey: string;
  /** Options in this section */
  options: SettingsOption[];
  /** Whether this section contains danger items */
  isDanger?: boolean;
}
