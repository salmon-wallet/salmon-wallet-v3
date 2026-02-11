/**
 * ActionButtonRow types for @salmon/ui-extension
 */
import type { CSSProperties, ReactNode } from 'react';
import type { ActionButtonBase, ActionButtonRowPropsBase } from '@salmon/shared';

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
