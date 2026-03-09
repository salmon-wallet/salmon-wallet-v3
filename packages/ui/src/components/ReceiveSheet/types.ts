import type { CSSProperties } from 'react';
import type { ReceiveSheetPropsBase } from '@salmon/shared';

/**
 * Props for the ReceiveSheet component (Web/Extension)
 */
export interface ReceiveSheetProps extends ReceiveSheetPropsBase<CSSProperties> {
  /** Additional CSS class for the dialog */
  className?: string;
}
