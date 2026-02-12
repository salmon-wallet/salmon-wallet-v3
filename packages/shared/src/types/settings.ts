/**
 * Shared Settings Types for Salmon Wallet
 * Used by both mobile and extension settings components
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
 * Base props shared between mobile and extension SettingsSheet
 */
export interface SettingsSheetBaseProps {
  /**
   * Whether the settings sheet is visible.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   */
  onClose: () => void;

  /**
   * Optional callback when user navigates to a settings screen.
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
   */
  onRemoveWallet?: () => void;

  /**
   * Callback when remove all wallets action is triggered.
   */
  onRemoveAllWallets?: () => void;
}

/**
 * Settings option/item configuration (mobile uses SettingsOption, extension uses SettingsItem)
 */
export interface SettingsOptionBase {
  /** Unique identifier for the option */
  id: SettingsScreen | 'developerNetworks';
  /** Translation key for the label */
  labelKey: string;
  /** Optional description translation key */
  descriptionKey?: string;
  /** Whether this is a danger/destructive option */
  isDanger?: boolean;
}

/**
 * Settings section configuration (shared structure)
 */
export interface SettingsSectionBase {
  /** Section header translation key */
  titleKey: string;
  /** Whether this section contains danger items */
  isDanger?: boolean;
}

/**
 * Avatar color palette for deterministic account colors.
 * Used by WalletSwitcherSheet components.
 */
export const AVATAR_COLORS = [
  '#FF5C45', // Salmon accent
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const;

/**
 * Get a deterministic color from the palette based on a string (e.g., account ID)
 */
export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ============================================================================
// Feature flag types (from backend GET /v1/switches)
// ============================================================================

/**
 * Feature flags within a section
 */
export interface SwitchSectionFeatures {
  send?: boolean;
  receive?: boolean;
  list_tokens?: boolean;
  import_tokens?: boolean;
  collectibles?: boolean;
}

/**
 * A section within a network's switch configuration
 */
export interface SwitchSection {
  active: boolean;
  features?: SwitchSectionFeatures;
  [key: string]: unknown;
}

/**
 * Feature switch configuration for a single network.
 *
 * Backend returns a Record<networkId, NetworkSwitch>.
 */
export interface NetworkSwitch {
  enable: boolean;
  sections: {
    overview: SwitchSection;
    token_detail: SwitchSection;
    collectibles: SwitchSection;
    swap: { active: boolean };
    exchange: { active: boolean };
    transactions: { active: boolean };
  };
}

/**
 * Response from the switches API endpoint: object keyed by network ID.
 */
export type SwitchesResponse = Record<string, NetworkSwitch>;

/**
 * Map of network IDs to their enabled state for quick lookup
 */
export type SwitchMap = Record<string, boolean>;
