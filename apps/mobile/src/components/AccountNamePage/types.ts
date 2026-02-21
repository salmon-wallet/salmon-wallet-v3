/**
 * Props for the mobile AccountNamePage component
 */
export interface AccountNamePageProps {
  /** The current account name */
  currentName: string;
  /** Callback when the user saves a new name */
  onSave: (name: string) => void;
  /** Callback to navigate back */
  onBack: () => void;
}
