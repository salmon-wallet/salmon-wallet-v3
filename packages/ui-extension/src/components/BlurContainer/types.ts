import type { CSSProperties, ReactNode } from 'react';

export type BlurTint = 'light' | 'dark' | 'default';

export interface BlurContainerProps {
  children: ReactNode;
  /**
   * Additional CSS styles
   */
  style?: CSSProperties;
  /**
   * Blur intensity in pixels
   * @default 8
   */
  blurIntensity?: number;
  /**
   * Blur tint (affects background overlay color)
   * @default 'dark'
   */
  blurTint?: BlurTint;
  /**
   * Background color for the container
   * @default colors.background.tokenItem (#383F52 at 10% opacity)
   */
  backgroundColor?: string;
  /**
   * Border color for the container
   * @default colors.border.default (#404962)
   */
  borderColor?: string;
  /**
   * Border width for the container
   * @default 1
   */
  borderWidth?: number;
  /**
   * Optional className for styling
   */
  className?: string;
}
