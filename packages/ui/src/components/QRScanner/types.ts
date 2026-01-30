/**
 * QRScanner Component Types
 *
 * This component provides QR code scanning functionality.
 * Note: Full implementation requires native camera configuration
 * (expo-camera or react-native-camera).
 */

/**
 * Data returned when a QR code is successfully scanned
 */
export interface QRScanResult {
  /** The decoded data from the QR code */
  data: string;
  /** The type of barcode/QR code scanned */
  type?: string;
  /** Raw bytes of the scanned data (if available) */
  rawData?: string;
}

/**
 * Props for the QRScanner component
 */
export interface QRScannerProps {
  /** Controls visibility of the scanner modal */
  visible: boolean;
  /** Callback fired when a QR code is successfully scanned */
  onScan: (result: QRScanResult) => void;
  /** Callback fired when the scanner is closed */
  onClose: () => void;
  /** Optional title displayed in the scanner header */
  title?: string;
  /** Optional custom styles for the container */
  containerStyle?: object;
}
