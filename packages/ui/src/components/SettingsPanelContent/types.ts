import type { ReactNode } from 'react';

export interface SettingsPanelContentProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  className?: string;
}
