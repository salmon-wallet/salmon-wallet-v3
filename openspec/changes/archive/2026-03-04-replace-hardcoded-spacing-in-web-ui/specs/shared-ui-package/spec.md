## ADDED Requirements

### Requirement: Components use design tokens for spacing
All components in `packages/ui/src/components/` SHALL use `spacing.*` token references from `@salmon/shared` for every spacing property (padding, margin, gap). Raw numeric values for spacing SHALL NOT be used.

#### Scenario: Component imports spacing token
- **WHEN** a component in `packages/ui` needs to set spacing
- **THEN** it imports `spacing` from `@salmon/shared` and uses a token reference

#### Scenario: No raw numeric spacing values
- **WHEN** reviewing any `.tsx` or `.ts` file in `packages/ui/src/`
- **THEN** no spacing property has a raw numeric value without a token reference
