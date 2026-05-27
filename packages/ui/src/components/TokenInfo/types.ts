import type { CSSProperties } from 'react';
import type { TokenInfoPropsBase } from '@salmon/shared';

/**
 * Props for the TokenInfo component (Web/Extension)
 */
export interface TokenInfoProps extends TokenInfoPropsBase<CSSProperties> {
  /** Optional className for the container */
  className?: string;
}
