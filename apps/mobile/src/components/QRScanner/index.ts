/**
 * QRScanner Component
 *
 * A cross-platform QR code scanner component.
 *
 * Platform behavior:
 * - Web: Displays a message indicating QR scanning is only available on mobile
 * - Native: Placeholder that requires native camera configuration
 *
 * Usage:
 * ```tsx
 * import { QRScanner } from '@salmon/ui';
 *
 * <QRScanner
 *   visible={showScanner}
 *   onScan={(result) => console.log('Scanned:', result.data)}
 *   onClose={() => setShowScanner(false)}
 *   title="Scan Address"
 * />
 * ```
 *
 * Note: Full QR scanning implementation requires native camera setup:
 * - Expo: expo-camera or expo-barcode-scanner
 * - Bare RN: react-native-camera or react-native-qrcode-scanner
 */

export { QRScanner, QRScanner as default } from './QRScanner';
export type { QRScannerProps, QRScanResult } from './types';
