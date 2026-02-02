import type { ViewStyle } from 'react-native';

/**
 * Individual action button configuration
 */
export interface ActionButton {
  /** Button identifier */
  id: string;
  /** Button label */
  label: string;
  /** Icon name from Ionicons */
  icon: string;
  /** Whether this is a primary (gradient) or secondary (outlined) button */
  variant: 'primary' | 'secondary';
  /** Button press callback */
  onPress?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
}

/**
 * Props for the ActionButtonRow component
 */
export interface ActionButtonRowProps {
  /** Callback when Send button is pressed */
  onSendPress?: () => void;
  /** Callback when Receive button is pressed */
  onReceivePress?: () => void;
  /** Callback when Activity button is pressed */
  onActivityPress?: () => void;
  /** Whether Send is disabled */
  sendDisabled?: boolean;
  /** Whether Receive is disabled */
  receiveDisabled?: boolean;
  /** Whether Activity is disabled */
  activityDisabled?: boolean;
  /** Optional custom styles for the container */
  style?: ViewStyle;
}
