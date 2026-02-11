// Web fallback: no-op stubs for expo-haptics

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export async function impactAsync(_style?: ImpactFeedbackStyle): Promise<void> {}
export async function notificationAsync(_type?: NotificationFeedbackType): Promise<void> {}
export async function selectionAsync(): Promise<void> {}

const Haptics = {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  selectionAsync,
};

export default Haptics;
