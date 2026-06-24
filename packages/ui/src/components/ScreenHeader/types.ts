/**
 * ScreenHeader types for web version
 */
import type { Testable } from '@salmon/shared';

export interface ScreenHeaderProps extends Testable {
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Show step indicator */
  stepIndicator?: {
    totalSteps: number;
    currentStep: number;
  };
  /** Disable back button */
  backDisabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}
