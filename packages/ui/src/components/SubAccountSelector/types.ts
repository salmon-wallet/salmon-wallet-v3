import type { ViewStyle } from 'react-native';

export interface SubAccount {
  index: number;
  address: string;
}

export interface SubAccountSelectorProps {
  accounts: SubAccount[];
  activeIndex: number;
  onSelect: (index: number) => void;
  pendingIndex?: number; // Index of account being switched to (shows loading indicator)
  style?: ViewStyle;
  testID?: string;
}
