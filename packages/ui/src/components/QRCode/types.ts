import type { CSSProperties } from 'react';
import type { QRCodePropsBase } from '@salmon/shared';

/**
 * Props for the QRCode component (Web/Extension)
 */
export interface QRCodeProps extends QRCodePropsBase<CSSProperties> {
  /** Additional CSS class */
  className?: string;
}
