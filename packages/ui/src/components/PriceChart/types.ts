import type { CSSProperties } from 'react';
import type { PriceChartPropsBase } from '@salmon/shared';

/**
 * Props for the PriceChart component (Web/Extension)
 */
export interface PriceChartProps extends PriceChartPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
}
