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

### Live integration tests (dev-machine smoke tests)

Some test files (`bitcoin.test.ts`, `solana.test.ts`, `solana-nft.test.ts`,
`bridge.test.ts`, `dapp.test.ts`, `transactions.test.ts`, `network.test.ts`,
`price.test.ts`, `swap.test.ts`) probe a local salmon-api via
`getReachableBackendBaseUrl()` (`src/api/test-backend.ts`) and only exercise
the live contract when the backend is reachable on one of the candidate URLs.

These are **dev-machine smoke tests by design** — CI does not stand up the
backend, so the live blocks silently skip there. Schema drift is caught the
next time a contributor runs the suite locally against a running salmon-api.

Override the candidate list with `EXPO_PUBLIC_API_URL` / `VITE_API_URL` /
`API_URL` (or `*_API_HOST` + `*_API_PORT`) when targeting a non-default host.
