import type { CSSProperties } from 'react';

export interface TexturedBackgroundProps {
  fillColor?: string;
  edgeColor?: string;
  backgroundColor?: string;
  scaleSize?: number;
  opacity?: number;
  topOffset?: number;
  style?: CSSProperties;
  className?: string;
}
