export type ValidationState = 'idle' | 'correct' | 'incorrect';

export interface SeedWordGridProps {
  /** Array of mnemonic words */
  words: string[];
  /** Number of columns (default: 3) */
  columns?: number;
}

export interface SeedWordInputProps {
  /** Word position (1-indexed) */
  position: number;
  /** Current input value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Validation state */
  validationState?: ValidationState;
  /** Auto focus this input */
  autoFocus?: boolean;
  /** Called when user submits */
  onSubmitEditing?: () => void;
}
