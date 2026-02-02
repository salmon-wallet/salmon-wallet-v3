import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle, ColorValue } from 'react-native';
import type { ReactNode } from 'react';

interface GradientBackgroundProps {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: ReactNode;
}

const DEFAULT_COLORS: readonly [ColorValue, ColorValue] = ['#ff5c45', 'rgba(161, 42, 42, 0.9)'];

export const GradientBackground = ({
  colors = DEFAULT_COLORS,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
}: GradientBackgroundProps) => {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
};
