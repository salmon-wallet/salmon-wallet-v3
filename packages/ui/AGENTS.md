# AGENTS.md instructions for `packages/ui`

## Responsibility

- shared React DOM component library for web and extension

## Rules

- Keep DOM-only UI here.
- Do not put React Native code here.
- Keep business logic in shared hooks/services unless the logic is truly presentational.

## Testing

- Add or update component tests here when shared DOM behavior changes.
