import type { CSSProperties } from 'react';
import type { GradientBackgroundPropsBase } from '@salmon/shared';

/**
 * Props for the GradientBackground component (Web/Extension)
 */
export interface GradientBackgroundProps extends GradientBackgroundPropsBase<CSSProperties> {
  /** Optional className for styling */
  className?: string;
}
