/**
 * Props for the StepIndicator component (fully platform-agnostic)
 */
export interface StepIndicatorProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current step (1-indexed) */
  currentStep: number;
}
