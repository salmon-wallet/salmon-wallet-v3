/**
 * SettingsPageLayout - Shared layout for settings pages
 *
 * This component provides a consistent layout structure for settings pages,
 * including:
 * - Header with back button and title
 * - Content area for page-specific content
 * - Consistent styling and spacing
 *
 * Used by: BackupPage, CurrencyPage, AboutPage, and other settings pages
 */

import React from 'react';
import { PageShell } from './PageShell';

// ============================================================================
// Types
// ============================================================================

export interface SettingsPageLayoutProps {
  /** Page title */
  title: string;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Content to display in the page */
  children: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SettingsPageLayout - Reusable layout for settings pages
 */
export function SettingsPageLayout({
  title,
  onBack,
  children,
  className,
}: SettingsPageLayoutProps): React.ReactElement {
  return (
    <PageShell
      title={title}
      onBack={onBack}
      backgroundColor="primary"
      fullHeight={false}
      className={className}
    >
      {children}
    </PageShell>
  );
}

export default SettingsPageLayout;
