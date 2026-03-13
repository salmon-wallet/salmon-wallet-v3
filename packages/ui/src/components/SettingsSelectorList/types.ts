import type { ReactNode } from 'react';

export interface SettingsSelectorListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  getPrimaryText: (item: T) => string;
  getSecondaryText?: (item: T) => string;
  secondaryTypographyProps?: Record<string, unknown>;
  renderLeadingElement?: (item: T) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}
