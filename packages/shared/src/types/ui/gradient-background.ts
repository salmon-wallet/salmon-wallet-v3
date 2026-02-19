/**
 * Props for the GradientBackground component (base - platform-agnostic)
 */
export interface GradientBackgroundPropsBase<TStyle> {
  /** Array of color stops for the gradient (at least 2 colors) */
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
  /** Additional styles */
  style?: TStyle;
  /** Child elements to render inside the gradient */
  children?: React.ReactNode;
}
