## ADDED Requirements

### Requirement: spacing tokens cover all web UI needs
The `spacing` object in `packages/shared/src/theme/spacing.ts` SHALL include a token `3.5xl` with value 30.

#### Scenario: New token is exported
- **WHEN** a component imports `spacing` from `@salmon/shared`
- **THEN** `spacing['3.5xl']` equals 30

### Requirement: No hardcoded spacing values in packages/ui
Every spacing property (padding, margin, gap, top, bottom, left, right used as spacing) in `packages/ui/src/` SHALL reference a `spacing.*` token from `@salmon/shared`. Hardcoded numeric spacing values SHALL NOT appear in component files.

#### Scenario: Styled component uses token
- **WHEN** a styled component in `packages/ui` sets a spacing property
- **THEN** it uses `spacing.<token>` instead of a raw number

#### Scenario: No raw numeric spacing values
- **WHEN** searching `packages/ui/src/` for hardcoded spacing patterns
- **THEN** zero matches are found for raw numeric padding, margin, or gap values
