import type { CSSProperties } from 'react';
import type { BlurContainerPropsBase } from '@salmon/shared';

// Re-export BlurTint for consumers
export type { BlurTint } from '@salmon/shared';

/**
 * Props for the BlurContainer component (Web/Extension)
 */
export interface BlurContainerProps extends BlurContainerPropsBase<CSSProperties> {
  /** Optional className for styling */
  className?: string;
}
