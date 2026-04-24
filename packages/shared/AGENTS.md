# AGENTS.md instructions for `packages/shared`

## Responsibility

- shared business logic and contracts for mobile, web, and extension
- shared API services
- shared blockchain logic
- shared hooks, types, storage, config, crypto, and theme tokens

## Rules

- Keep this package runtime-agnostic unless there is an established platform shim pattern.
- Do not put React DOM components here.
- Do not put React Native UI here.
- Prefer semantic contracts and reusable logic over app-specific wiring.

## Testing

- New or changed shared behavior should come with targeted tests in this package when practical.
