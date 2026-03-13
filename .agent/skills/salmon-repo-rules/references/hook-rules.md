# Shared Hook Rules

## Ownership

- Shared hooks belong in `packages/shared/src/hooks`
- They should only exist there when more than one platform needs them
- Platform-only hooks stay inside the relevant app

## Naming

- Use `Use*Params` for input types
- Use named exports through public barrels
- Avoid hook-local re-exports of domain types that already have a canonical home

## Design

- Keep the hook API focused on shared behavior
- Extract services, helpers, or mappers when concerns mix
- Keep platform-only behavior out of the shared hook

## Split guidance

- Hook over 300 lines: ask whether to split
- Hook combines storage, network IO, heavy transformation, and UI flow: ask whether responsibilities are too broad

## Common smells

- Shared hook only used by one platform
- Browser or RN dependency inside a supposedly shared hook
- Domain types exported from multiple locations
- Hook file acting as hook + service + mapper + controller
