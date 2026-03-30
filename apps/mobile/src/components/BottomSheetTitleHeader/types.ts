import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface BottomSheetTitleHeaderProps {
  title: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  titleNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}
