import type { ViewStyle } from 'react-native';

export interface ReceiveSheetProps {
  /**
   * Whether the sheet is visible
   */
  visible: boolean;

  /**
   * Callback when the sheet should close
   */
  onClose: () => void;

  /**
   * The wallet address to display and encode in QR code
   */
  address: string;

  /**
   * Callback when the copy button is pressed
   */
  onCopy?: () => void;

  /**
   * Additional styles for the sheet container
   */
  style?: ViewStyle;
}
