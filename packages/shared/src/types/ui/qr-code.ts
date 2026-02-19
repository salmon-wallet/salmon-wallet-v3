/**
 * Props for the QRCode component (base - platform-agnostic)
 */
export interface QRCodePropsBase<TStyle> {
  /** The value to encode in the QR code (e.g., wallet address, URL) */
  value: string;
  /** The size of the QR code in pixels */
  size: number;
  /**
   * Background color of the QR code
   * @default '#FFFFFF'
   */
  backgroundColor?: string;
  /**
   * Foreground color of the QR code (the dots/modules)
   * @default '#000000'
   */
  color?: string;
  /** Additional styles */
  style?: TStyle;
}
