import type { BlockchainType } from '../blockchain';
import type { ValidationCallbackResult } from '../validation';

/**
 * Props for the InputAddress component (base - platform-agnostic)
 */
export interface InputAddressPropsBase<TStyle = any> {
  /** Current address value */
  address: string;
  /** Callback when address changes */
  onChange: (address: string) => void;
  /** Callback when validation completes */
  onValidation?: (result: ValidationCallbackResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Blockchain type for validation context */
  blockchain?: BlockchainType;
  /** Label to show above input (e.g., "To") */
  label?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
  /** Test ID for testing */
  testID?: string;
  /** Platform-specific style prop */
  style?: TStyle;
}
