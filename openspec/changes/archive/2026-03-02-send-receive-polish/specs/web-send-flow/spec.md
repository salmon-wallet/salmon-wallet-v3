## ADDED Requirements

### Requirement: StepTokenSelect has top padding below header
The `StepTokenSelect` Container in `packages/ui/src/components/SendPage/StepTokenSelect.tsx` SHALL include `paddingTop: spacing.xl` (20px) so the search bar has visual breathing room below the PageShell header border.

#### Scenario: Send page opened on web/extension
- **WHEN** user navigates to the Send page and StepTokenSelect renders
- **THEN** there SHALL be 20px (`spacing.xl`) of vertical space between the PageShell header border and the top of the search bar
