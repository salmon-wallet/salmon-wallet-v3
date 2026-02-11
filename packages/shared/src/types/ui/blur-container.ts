/**
 * Blur tint options
 */
export type BlurTint = 'light' | 'dark' | 'default';

/**
 * Props for the BlurContainer component (base - platform-agnostic)
 */
export interface BlurContainerPropsBase<TStyle = any> {
  children: React.ReactNode;
  style?: TStyle;
  /**
   * Blur intensity
   * @default 8
   */
  blurIntensity?: number;
  /**
   * Blur tint
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
}
