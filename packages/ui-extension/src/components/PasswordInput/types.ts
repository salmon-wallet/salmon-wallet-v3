/**
 * PasswordInput types for web version
 */
import type { PasswordStrength } from '@salmon/shared';

export interface PasswordInputProps {
  /** Current password value */
  value: string;
  /** Callback when password text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text (defaults to "Enter password") */
  placeholder?: string;
  /** Error message to display below the input */
  error?: string;
  /** Whether the input is editable (defaults to true) */
  editable?: boolean;
  /** Whether to auto-focus the input on mount */
  autoFocus?: boolean;
  /** Callback when Enter key is pressed */
  onSubmitEditing?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export interface PasswordStrengthBarProps {
  /** Password strength level */
  strength: PasswordStrength;
  /** Optional translation function (i18next) */
  t?: (key: string) => string;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}
