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
  | 'privateKey'
  | 'support'
  | 'addressBook'
  | 'address-book-add'
  | 'address-book-edit'
  | 'explorer'
  | 'trustedApps'
  | 'removeWallet'
  | 'removeAll'
  | 'avatar'
  | 'accounts'
  | 'account-edit'
  | 'account-name'
  | 'account-add';

/**
 * An entry in the settings panel stack.
 */
export interface SettingsPanelEntry {
  /** The screen to render */
  screen: SettingsScreen;
  /** Optional props to pass to the screen component */
  props?: Record<string, unknown>;
}

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

// ============================================================================
// Network Selector
// ============================================================================

/**
 * A network item as displayed in the network selector UI.
 */
export interface NetworkSelectorItem {
  /** Network identifier (e.g. 'solana-mainnet') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Blockchain family (e.g. 'solana', 'bitcoin', 'ethereum') */
  blockchain: string;
}

/**
 * Base props shared between mobile and extension NetworkSelector components.
 */
export interface NetworkSelectorBaseProps {
  /** Available networks to display */
  networks: NetworkSelectorItem[];
  /** Currently active network id */
  activeNetworkId: string;
  /** Called when the user selects a network */
  onSelectNetwork: (networkId: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
  /** Whether the data is still loading */
  loading?: boolean;
}

// ============================================================================
// Explorer Selector
// ============================================================================

/**
 * An explorer item as displayed in the explorer selector UI.
 */
export interface ExplorerSelectorItem {
  /** Explorer key identifier */
  key: string;
  /** Human-readable explorer name */
  name: string;
}

/**
 * Base props shared between mobile and extension ExplorerSelector components.
 */
export interface ExplorerSelectorBaseProps {
  /** Available explorers to display */
  explorers: ExplorerSelectorItem[];
  /** Name of the currently active explorer */
  activeExplorerName: string;
  /** Called when the user selects an explorer */
  onSelectExplorer: (explorerKey: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
  /** Whether the data is still loading */
  loading?: boolean;
}

// ============================================================================
// Language Selector
// ============================================================================

/**
 * A language item as displayed in the language selector UI.
 */
export interface LanguageSelectorItem {
  /** Language code (e.g. 'en', 'es') */
  code: string;
  /** Native name of the language (e.g. 'English', 'Español') */
  nativeName: string;
}

/**
 * Base props shared between mobile and extension LanguageSelector components.
 */
export interface LanguageSelectorBaseProps {
  /** Available languages to display */
  languages: LanguageSelectorItem[];
  /** Currently active language code */
  activeLanguageCode: string;
  /** Called when the user selects a language */
  onSelectLanguage: (code: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
}

// ============================================================================
// Trusted Apps Selector
// ============================================================================

/**
 * A trusted app item as displayed in the trusted apps selector UI.
 */
export interface TrustedAppItem {
  /** Domain/origin of the connected dApp */
  domain: string;
  /** Optional display name */
  name?: string;
  /** Optional icon URL */
  icon?: string;
}

/**
 * Base props shared between mobile and extension TrustedAppsSelector components.
 */
export interface TrustedAppsSelectorBaseProps {
  /** Connected dApps to display */
  apps: TrustedAppItem[];
  /** Called when the user revokes a dApp connection */
  onRevokeApp: (domain: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
  /** Whether the data is still loading */
  loading?: boolean;
}

// ============================================================================
// Support Selector
// ============================================================================

/**
 * A support option item as displayed in the support selector UI.
 */
export interface SupportOptionItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Short description */
  description: string;
  /** Link URL (https or mailto) */
  url: string;
}

/**
 * Base props shared between mobile and extension SupportSelector components.
 */
export interface SupportSelectorBaseProps {
  /** Support options to display */
  options: SupportOptionItem[];
  /** Called when the user taps a support link */
  onOpenLink: (url: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
}

/**
 * Default support options shared across platforms.
 * Icons are platform-specific and mapped by id in each component.
 */
export const SUPPORT_OPTIONS: SupportOptionItem[] = [
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions',
    url: 'https://salmonwallet.io/faq',
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'Learn how to use Salmon Wallet',
    url: 'https://docs.salmonwallet.io',
  },
  {
    id: 'twitter',
    title: 'Twitter / X',
    description: 'Get updates and reach out to us',
    url: 'https://twitter.com/salmonwallet',
  },
  {
    id: 'discord',
    title: 'Discord Community',
    description: 'Join our community for support',
    url: 'https://discord.gg/salmonwallet',
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Contact us directly for help',
    url: 'mailto:support@salmonwallet.io',
  },
];

// ============================================================================
// Currency Selector
// ============================================================================

/**
 * A currency item as displayed in the currency selector UI.
 */
export interface CurrencySelectorItem {
  /** Lowercase currency code (e.g. 'usd') */
  code: string;
  /** Human-readable name (e.g. 'US Dollar') */
  name: string;
  /** Currency symbol (e.g. '$', '€') */
  symbol: string;
}

/**
 * Base props shared between mobile and extension CurrencySelector components.
 */
export interface CurrencySelectorBaseProps {
  /** Available currencies to display */
  currencies: CurrencySelectorItem[];
  /** Currently active currency code */
  activeCurrencyCode: string;
  /** Called when the user selects a currency */
  onSelectCurrency: (code: string) => void;
  /** Called when the user navigates back */
  onBack: () => void;
}

// ============================================================================
// Private Key Reveal
// ============================================================================

/**
 * Account key info extracted for display in the private key reveal UI.
 */
export interface AccountKeyInfo {
  /** BIP44 derivation path (e.g. "m/44'/501'/0'/0'") */
  path: string;
  /** Public receive address */
  address: string;
  /** Private key string (hex, base58, or WIF depending on blockchain) */
  privateKey: string;
}

// ============================================================================
// Settings Options
// ============================================================================

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
// Address Book
// ============================================================================

/**
 * A contact item as displayed in the address book UI.
 */
export interface AddressBookItem {
  name: string;
  address: string;
  networkId: string;
  networkName: string;
  domain?: string | null;
}

/**
 * Base props shared between mobile and extension AddressBookSelector components.
 */
export interface AddressBookSelectorBaseProps {
  contacts: AddressBookItem[];
  activeNetworkId: string;
  onAddContact: () => void;
  onEditContact: (contact: AddressBookItem) => void;
  onRemoveContact: (address: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

/**
 * Base props for the Add Address screen.
 */
export interface AddressBookAddBaseProps {
  activeNetworkId: string;
  activeNetworkName: string;
  activeBlockchain: string;
  onSave: (input: import('./address').AddressInput) => Promise<void>;
  onBack: () => void;
}

/**
 * Base props for the Edit Address screen.
 */
export interface AddressBookEditBaseProps {
  contact: AddressBookItem;
  activeBlockchain: string;
  onSave: (originalAddress: string, input: import('./address').AddressInput) => Promise<void>;
  onBack: () => void;
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
