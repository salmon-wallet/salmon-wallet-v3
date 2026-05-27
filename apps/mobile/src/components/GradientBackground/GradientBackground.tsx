import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle, ColorValue } from 'react-native';
import type { ReactNode } from 'react';
import { gradients } from '@salmon/shared';

interface GradientBackgroundProps {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: ReactNode;
}

export const GradientBackground = ({
  colors = gradients.primary.colors,
  start = gradients.primary.start,
  end = gradients.primary.end,
  style,
  children,
}: GradientBackgroundProps) => {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
};
