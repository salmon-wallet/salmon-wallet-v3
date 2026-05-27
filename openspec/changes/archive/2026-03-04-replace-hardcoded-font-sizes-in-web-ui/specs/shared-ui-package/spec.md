## ADDED Requirements

### Requirement: Components use design tokens for font sizes
All components in `packages/ui/src/components/` SHALL use `fontSize.*` token references from `@salmon/shared` for every `fontSize` style property. Raw numeric values for fontSize SHALL NOT be used.

#### Scenario: Component imports fontSize token
- **WHEN** a component in `packages/ui` needs to set a font size
- **THEN** it imports `fontSize` from `@salmon/shared` and uses a token reference (e.g., `fontSize.sm`, `fontSize.base`, `fontSize.md`)

#### Scenario: No raw numeric fontSize values
- **WHEN** reviewing any `.tsx` or `.ts` file in `packages/ui/src/`
- **THEN** no `fontSize` property has a raw numeric value without a token reference
