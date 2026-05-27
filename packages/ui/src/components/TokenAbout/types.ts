import type { CSSProperties } from 'react';
import type { TokenAboutPropsBase } from '@salmon/shared';

/**
 * Props for the TokenAbout component (Web/Extension)
 */
export interface TokenAboutProps extends TokenAboutPropsBase<CSSProperties> {
  /** Optional className for the container */
  className?: string;
}
