# AGENTS.md instructions for `packages/shared/src/api`

## Responsibility

- shared backend client configuration
- shared API services and adapters used across apps

## Rules

- Centralize backend-facing contracts here when they are consumed by multiple apps.
- Keep endpoint wrappers and shared client behavior here instead of reimplementing them in apps.
- If an endpoint change affects frontend behavior, check sibling backend repo `../salmon-api`.

## Testing

- Add or update focused API-service tests when request/response behavior changes.
