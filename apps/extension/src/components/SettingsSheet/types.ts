/**
 * SettingsSheet Component Types
 *
 * Type definitions for the SettingsSheet component which provides
 * a slide-out settings panel for the browser extension.
 */

/**
 * Available settings screens that can be navigated to
 */
export type SettingsScreen =
  | 'security'
  | 'network'
  | 'language'
  | 'currency'
  | 'backup'
  | 'about'
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
   * When true, the sheet slides into view from the right.
   * When false, the sheet slides out of view.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   * Called when:
   * - User clicks on the backdrop
   * - User clicks the close button
   * - User presses Escape key
   */
  onClose: () => void;

  /**
   * Optional callback when user navigates to a settings screen.
   * Called with the screen type when a settings option is clicked.
   */
  onNavigate?: (screen: SettingsScreen) => void;

  /**
   * Whether developer networks (e.g., devnet, testnet) are enabled.
   */
  developerNetworksEnabled?: boolean;

  /**
   * Callback when developer networks toggle is changed.
   */
  onDeveloperNetworksToggle?: (enabled: boolean) => void;

  /**
   * Callback when user requests to remove the current wallet.
   */
  onRemoveWallet?: () => void;

  /**
   * Callback when user requests to remove all wallets.
   */
  onRemoveAllWallets?: () => void;
}

/**
 * Settings section configuration
 */
export interface SettingsSection {
  /** Section title translation key */
  titleKey: string;
  /** Items in this section */
  items: SettingsItem[];
  /** Whether this is a danger zone section */
  isDanger?: boolean;
}

/**
 * Settings item configuration
 */
export interface SettingsItem {
  /** Unique identifier for the item */
  id: SettingsScreen | 'developerNetworks';
  /** Translation key for the label */
  labelKey: string;
  /** Optional description translation key */
  descriptionKey?: string;
  /** Type of item: navigation or toggle */
  type: 'navigation' | 'toggle' | 'action';
  /** Whether this is a danger action */
  isDanger?: boolean;
}
