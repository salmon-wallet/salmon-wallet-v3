import type { CSSProperties, ReactNode } from 'react';

export interface GradientBackgroundProps {
  /**
   * Array of color stops for the gradient
   * Must have at least 2 colors
   */
  colors?: readonly [string, string, ...string[]];
  /**
   * Start point of the gradient (0-1 for x and y)
   * @default { x: 0, y: 0 }
   */
  start?: { x: number; y: number };
  /**
   * End point of the gradient (0-1 for x and y)
   * @default { x: 1, y: 0 }
   */
  end?: { x: number; y: number };
  /**
   * Additional CSS styles
   */
  style?: CSSProperties;
  /**
   * Child elements to render inside the gradient
   */
  children?: ReactNode;
  /**
   * Optional className for styling
   */
  className?: string;
}
