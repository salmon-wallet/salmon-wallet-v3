# web-font-size-tokens Specification

## Purpose

Add the `title`, `iconMd`, and `iconLg` font size tokens needed by web UI components to `packages/shared/src/theme/typography.ts`, preserve existing values, and forbid hardcoded numeric `fontSize` properties anywhere in `packages/ui/src/` so every component references a `fontSize.*` token.

## Requirements

### Requirement: fontSize tokens cover all web UI needs
The `fontSize` object in `packages/shared/src/theme/typography.ts` SHALL include tokens for every font size used in `packages/ui` components. The following tokens SHALL be added: `title` (22), `iconMd` (28), `iconLg` (40).

#### Scenario: New tokens are exported
- **WHEN** a component imports `fontSize` from `@salmon/shared`
- **THEN** `fontSize.title` equals 22
- **THEN** `fontSize.iconMd` equals 28
- **THEN** `fontSize.iconLg` equals 40

#### Scenario: Existing tokens are unchanged
- **WHEN** a component imports `fontSize` from `@salmon/shared`
- **THEN** all pre-existing token values (xs=10, sm=12, base=14, md=16, lg=18, xl=20, 2xl=24, 3xl=30, 4xl=36, 5xl=48, balance=60, tokenChange=11.375, tokenNamePrice=13.65, actionButton=14.5) remain unchanged

### Requirement: No hardcoded fontSize values in packages/ui
Every `fontSize` property in styled components, sx props, and inline styles within `packages/ui/src/` SHALL reference a `fontSize.*` token from `@salmon/shared`. Hardcoded numeric fontSize values (e.g., `fontSize: 12`, `fontSize: 16`) SHALL NOT appear in any component file.

#### Scenario: Styled component uses token
- **WHEN** a styled component in `packages/ui` sets a fontSize
- **THEN** it uses `fontSize.<token>` (e.g., `fontSize: fontSize.sm`) instead of a raw number

#### Scenario: MUI sx prop uses token
- **WHEN** an MUI component in `packages/ui` sets fontSize via sx prop
- **THEN** it uses `fontSize.<token>` (e.g., `sx={{ fontSize: fontSize.xl }}`) instead of a raw number

#### Scenario: Grep finds no hardcoded fontSize
- **WHEN** searching `packages/ui/src/` for pattern `fontSize:\s*\d+` excluding lines containing `fontSize.`
- **THEN** zero matches are found
