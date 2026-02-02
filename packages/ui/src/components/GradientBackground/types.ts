import type { ViewStyle, ColorValue } from 'react-native';
import type { ReactNode } from 'react';

export interface GradientBackgroundProps {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: ReactNode;
}
