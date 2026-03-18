import type { ReactNode } from 'react';

/**
 * Gate states representing the unified surface position
 */
export type GateState = 'locked' | 'collapsed' | 'settings' | 'wallets';

/**
 * Header configuration for expanded states (settings/wallets)
 */
export interface GateExpandedHeader {
  /** Title shown in the header bar */
  title?: string;
  /** Back button handler (shows chevron when defined) */
  onBack?: (() => void) | null;
  /** Close button handler */
  onClose: () => void;
}

/**
 * Props for the GateContainer component
 */
export interface GateContainerProps {
  /** Current state of the gate */
  state: GateState;
  /** Content to render when locked (full screen) */
  lockContent: ReactNode;
  /** Content to render when collapsed (header bar) */
  headerContent: ReactNode;
  /** Content to render when expanded to settings */
  settingsContent?: ReactNode;
  /** Content to render when expanded to wallet switcher */
  walletsContent?: ReactNode;
  /** Header config for expanded states */
  expandedHeader?: GateExpandedHeader;
  /** Called when the backdrop is pressed in expanded state */
  onBackdropPress?: () => void;
  /** Called when the unlock slide-up animation completes */
  onUnlockAnimationComplete?: () => void;
}
