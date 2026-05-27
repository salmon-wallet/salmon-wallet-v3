/**
 * SettingsPanelContent - Shared layout for settings panels
 *
 * This component provides a consistent layout structure for settings panels,
 * including:
 * - Header with back button and title
 * - Content area for panel-specific content
 * - Consistent styling and spacing
 *
 * Used by: BackupPanel, CurrencySelector, AboutPanel, and other settings panels
 */

import React from 'react';
import { spacing } from '@salmon/shared';
import { PageShell } from '../PageShell';
import type { SettingsPanelContentProps } from './types';

// ============================================================================
// Component
// ============================================================================

/**
 * SettingsPanelContent - Reusable layout for settings panels
 */
export function SettingsPanelContent({
  title,
  onBack,
  children,
  className,
}: SettingsPanelContentProps): React.ReactElement {
  return (
    <PageShell
      title={title}
      onBack={onBack}
      backgroundColor="primary"
      scrollContentStyle={{ paddingTop: spacing.lg }}
      className={className}
    >
      {children}
    </PageShell>
  );
}
