/**
 * Individual action button configuration (base - platform-agnostic)
 */
export interface ActionButtonBase {
  /** Button identifier */
  id: string;
  /** Button label */
  label: string;
  /** Whether this is a primary (gradient) or secondary (outlined) button */
  variant: 'primary' | 'secondary';
  /** Button press callback */
  onPress?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
}

/**
 * Props for the ActionButtonRow component (base - platform-agnostic)
 */
export interface ActionButtonRowPropsBase<TStyle> {
  /** Callback when Send button is pressed */
  onSendPress?: () => void;
  /** Callback when Receive button is pressed */
  onReceivePress?: () => void;
  /** Callback when Activity button is pressed */
  onActivityPress?: () => void;
  /** Callback when Stake button is pressed */
  onStakePress?: () => void;
  /** Whether Send is disabled */
  sendDisabled?: boolean;
  /** Whether Receive is disabled */
  receiveDisabled?: boolean;
  /** Whether Activity is disabled */
  activityDisabled?: boolean;
  /** Whether Stake is disabled */
  stakeDisabled?: boolean;
  /** Optional custom styles for the container */
  style?: TStyle;
}
