/**
 * TopSheet Component Types
 *
 * TopSheet is a slide-down modal component that appears from the top of the screen.
 * It's designed for settings panels, wallet switchers, and other overlay content
 * that benefits from top-anchored positioning (similar to a notification shade).
 *
 * Design Specifications:
 * - Slides down from translateY: -sheetHeight to translateY: 0
 * - Backdrop fades from opacity 0 to 0.5
 * - Animation duration: 300ms with cubic easing
 * - Dismissible via backdrop tap or explicit close action
 */

import type { ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';

/**
 * Props for the TopSheet component
 */
export interface TopSheetProps {
  /**
   * Whether the sheet is visible.
   * When changed from false to true, the sheet slides down into view.
   * When changed from true to false, the sheet slides up out of view.
   */
  visible: boolean;

  /**
   * Callback when the sheet should close.
   * Called when:
   * - User taps on the backdrop
   * - User presses the Android back button
   * - Close is triggered programmatically
   */
  onClose: () => void;

  /**
   * Content to render inside the sheet.
   * This should typically include your settings options, wallet list, etc.
   */
  children: ReactNode;

  /**
   * Optional title displayed at the top of the sheet.
   * When provided, renders a header bar with the title and a close button.
   */
  title?: string;

  /**
   * Custom style for the sheet container.
   * Use this to adjust padding, background color, or other container styles.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the sheet content area.
   * Applied to the inner content wrapper below the header.
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Whether to show a drag handle indicator at the bottom of the sheet.
   * Provides visual affordance that the sheet can be dismissed.
   * @default true
   */
  showHandle?: boolean;

  /**
   * Whether tapping the backdrop should close the sheet.
   * Set to false for sheets that require explicit user action to close.
   * @default true
   */
  closeOnBackdropPress?: boolean;

  /**
   * Animation duration in milliseconds.
   * @default 300
   */
  animationDuration?: number;

  /**
   * Backdrop opacity when sheet is fully visible.
   * Value between 0 and 1.
   * @default 0.5
   */
  backdropOpacity?: number;

  /**
   * Whether the sheet should extend to full screen height.
   * When false, the sheet height is determined by its content.
   * @default false
   */
  fullHeight?: boolean;

  /**
   * Maximum height of the sheet as a percentage of screen height (0-1).
   * Only applies when fullHeight is false.
   * @default 0.7 (70% of screen height)
   */
  maxHeightPercentage?: number;

  /**
   * Test ID for testing purposes.
   */
  testID?: string;

  /**
   * Callback fired when the open animation completes.
   */
  onOpenComplete?: () => void;

  /**
   * Callback fired when the close animation completes.
   */
  onCloseComplete?: () => void;
}

/**
 * Configuration for sheet animation
 */
export interface TopSheetAnimationConfig {
  /** Duration of the animation in ms */
  duration: number;
  /** Easing function type */
  easing: 'cubic' | 'ease-out' | 'ease-in-out';
}

/**
 * Ref interface for imperative control of the TopSheet
 */
export interface TopSheetRef {
  /** Programmatically open the sheet */
  open: () => void;
  /** Programmatically close the sheet */
  close: () => void;
  /** Check if the sheet is currently visible */
  isVisible: () => boolean;
}
