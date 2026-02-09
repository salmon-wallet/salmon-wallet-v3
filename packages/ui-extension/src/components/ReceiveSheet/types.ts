/**
 * ReceiveSheet types for web version
 */

export interface ReceiveSheetProps {
  /**
   * Whether the sheet/dialog is visible
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
   * Callback when the copy button is pressed.
   * If not provided, the component will use the built-in
   * copyToClipboard utility from @salmon/shared.
   */
  onCopy?: () => void;

  /** Additional CSS class for the dialog */
  className?: string;

  /** Additional inline styles for the dialog paper */
  style?: React.CSSProperties;
}
