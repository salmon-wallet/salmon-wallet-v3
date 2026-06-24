/**
 * Testable — shared test-label contract for cross-platform UI components.
 *
 * A single semantic field for stable e2e selection. React Native components
 * forward it to the native `testID`; DOM components forward it to
 * `data-testid` (Playwright's default test-id attribute, and matched by
 * Maestro's `id` selector on native).
 *
 * Any interactive component or `*PropsBase` contract that needs to be
 * targetable from Maestro/Playwright should extend this interface.
 */
export interface Testable {
  /** Stable identifier for Playwright/Maestro selection. RN: `testID`. DOM: `data-testid`. */
  testID?: string;
}
