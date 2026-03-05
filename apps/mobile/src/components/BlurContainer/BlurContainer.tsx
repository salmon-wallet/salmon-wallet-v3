import { colors } from '@salmon/shared';
import { BlurView } from 'expo-blur';
import React, { useId, useState } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { BlurContainerProps } from './types';

const ANDROID_BG = 'rgba(56, 63, 82, 0.35)';

/** Radial gradient stops for glassy border effect (Figma "Glassy_BORDER") */
const GLASSY_BORDER_STOPS = [
  { offset: 0.2, opacity: 1 },
  { offset: 0.4, opacity: 0 },
  { offset: 0.6, opacity: 0 },
  { offset: 0.8, opacity: 1 },
] as const;
const GLASSY_BORDER_WIDTH = 0.75;

// sqrt(2) / 0.8 — so the 80% stop lands at the far corner (distance sqrt(2) in OBB space)
const OBB_RADIUS = Math.sqrt(2) / 0.8;

/**
 * Extract a numeric borderRadius from a style prop.
 */
function extractBorderRadius(style: BlurContainerProps['style']): number {
  if (!style) return 0;
  const flat = StyleSheet.flatten(style);
  return (flat?.borderRadius as number) ?? 0;
}

function GradientBorderOverlay({
  width,
  height,
  borderRadius,
  color,
  strokeWidth,
}: {
  width: number;
  height: number;
  borderRadius: number;
  color: string;
  strokeWidth: number;
}) {
  const gradientId = useId();
  const inset = strokeWidth / 2;

  if (width <= 0 || height <= 0) return null;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient
          id={gradientId}
          cx="0"
          cy="0"
          rx={String(OBB_RADIUS)}
          ry={String(OBB_RADIUS)}
          gradientUnits="objectBoundingBox"
        >
          {GLASSY_BORDER_STOPS.map((stop, i) => (
            <Stop
              key={i}
              offset={stop.offset}
              stopColor={color}
              stopOpacity={stop.opacity}
            />
          ))}
        </RadialGradient>
      </Defs>
      <Rect
        x={inset}
        y={inset}
        width={width - strokeWidth}
        height={height - strokeWidth}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function BlurContainer({
  children,
  style,
  blurIntensity = 4,
  blurTint = 'dark',
  backgroundColor = colors.background.tokenItem,
  borderColor = colors.border.default,
  borderWidth = 1,
  useGradientBorder = true,
}: BlurContainerProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) =>
      prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  };

  const borderRadius = extractBorderRadius(style);

  const solidBorderStyle = !useGradientBorder
    ? { borderColor, borderWidth }
    : undefined;

  if (Platform.OS === 'android') {
    return (
      <View
        onLayout={useGradientBorder ? handleLayout : undefined}
        style={[
          styles.container,
          { backgroundColor: ANDROID_BG },
          solidBorderStyle,
          style,
        ]}
      >
        {children}
        {useGradientBorder && (
          <GradientBorderOverlay
            width={layout.width}
            height={layout.height}
            borderRadius={borderRadius}
            color={borderColor}
            strokeWidth={GLASSY_BORDER_WIDTH}
          />
        )}
      </View>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      tint={blurTint}
      experimentalBlurMethod="dimezisBlurView"
      onLayout={useGradientBorder ? handleLayout : undefined}
      style={[
        styles.container,
        { backgroundColor },
        solidBorderStyle,
        style,
      ]}
    >
      {children}
      {useGradientBorder && (
        <GradientBorderOverlay
          width={layout.width}
          height={layout.height}
          borderRadius={borderRadius}
          color={borderColor}
          strokeWidth={GLASSY_BORDER_WIDTH}
        />
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default BlurContainer;
