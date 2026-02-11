/**
 * Props for the ReceiveSheet component (base - platform-agnostic)
 */
export interface ReceiveSheetPropsBase<TStyle = any> {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** The wallet address to display and encode in QR code */
  address: string;
  /** Callback when the copy button is pressed */
  onCopy?: () => void;
  /** Additional styles */
  style?: TStyle;
}
