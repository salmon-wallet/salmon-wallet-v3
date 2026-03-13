# Design Token Compliance

## Purpose

Ensures all styling across web and extension apps uses design tokens from `@salmon/shared` instead of hardcoded values, maintaining visual consistency and theme support.

## Requirements

### Requirement: All styling values use design tokens

All color, typography, spacing, and border-radius values in `apps/web` and `apps/extension` screen files SHALL reference design tokens from `@salmon/shared` rather than hardcoded values.

#### Scenario: No hardcoded hex colors in screen files
- **WHEN** a screen file in `apps/web/src/pages/` or `apps/extension/src/pages/` references a color
- **THEN** it SHALL use a `colors.*` token from `@salmon/shared`

#### Scenario: No hardcoded pixel values for typography
- **WHEN** a screen file sets `fontSize`, `letterSpacing`, or `lineHeight`
- **THEN** it SHALL use `fontSize.*`, `letterSpacing.*`, or `lineHeight.*` tokens

#### Scenario: No hardcoded pixel values for spacing
- **WHEN** a screen file sets `padding`, `margin`, or `gap` values
- **THEN** it SHALL use `spacing.*` tokens

#### Scenario: No hardcoded pixel values for border radius
- **WHEN** a screen file sets `borderRadius`
- **THEN** it SHALL use `borderRadius.*` tokens

### Requirement: Extension pages use consistent styling approach

Extension page files that define styled components SHALL NOT mix `sx` prop usage with `styled()` components in the same file.

#### Scenario: Styled components preferred over sx props
- **WHEN** a page file in `apps/extension/src/pages/` uses `styled()` for some elements
- **THEN** all styled elements in that file SHALL use `styled()` components
