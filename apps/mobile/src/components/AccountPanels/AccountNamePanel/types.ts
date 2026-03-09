/**
 * Props for the mobile AccountNamePanel component
 */
export interface AccountNamePanelProps {
  /** The current account name */
  currentName: string;
  /** Callback when the user saves a new name */
  onSave: (name: string) => void;
  /** Callback to navigate back */
  onBack: () => void;
}
