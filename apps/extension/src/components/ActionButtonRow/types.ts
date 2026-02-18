import type { ActionButtonBase, ActionButtonRowPropsBase } from '@salmon/shared';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Individual action button configuration (Web/Extension)
 */
export interface ActionButton extends ActionButtonBase {
  /** Icon element to display */
  icon?: ReactNode;
}

/**
 * Props for the ActionButtonRow component (Web/Extension)
 */
export interface ActionButtonRowProps extends ActionButtonRowPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
}
