/**
 * QRCode types for web version
 */

export interface QRCodeProps {
  /**
   * The value to encode in the QR code (e.g., wallet address, URL)
   */
  value: string;

  /**
   * The size of the QR code in pixels
   */
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

  /** Additional CSS class */
  className?: string;

  /** Additional styles */
  style?: React.CSSProperties;
}
