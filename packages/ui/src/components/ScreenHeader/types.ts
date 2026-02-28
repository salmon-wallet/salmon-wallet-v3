/**
 * ScreenHeader types for web version
 */

export interface ScreenHeaderProps {
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
