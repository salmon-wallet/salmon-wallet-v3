/**
 * BalanceCard types for @salmon/ui-extension
 */
import type { CSSProperties } from 'react';
import type { BalanceCardPropsBase } from '@salmon/shared';

/**
 * Props for the BalanceCard component (Web/Extension)
 */
export interface BalanceCardProps extends BalanceCardPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
}
