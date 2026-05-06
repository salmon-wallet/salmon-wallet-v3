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

## Notable namespaces

- `src/api/` — shared HTTP clients and backend services.
- `src/blockchain/` — per-chain logic (`bitcoin`, `ethereum`, `solana`).
- `src/blinks/` — cross-platform Solana Actions / Blinks core. `registry/` fetches and caches the allowlist from `salmon-api` (`GET /v1/blinks/registry`) with persistent storage and a hardcoded fallback; `client/` exposes `fetchActionMetadata` + `requestActionTransaction` (HTTPS-only, registry-gated, 10s timeout, 64 KiB cap); `simulate/` runs mandatory pre-sign simulation with ALT resolution and partial-signature verification via `tweetnacl`; `spec/` holds Zod schemas validating Action GET/POST shapes at runtime.
- `src/hooks/`, `src/storage/`, `src/types/`, `src/theme/`, `src/crypto/`, `src/utils/` — supporting cross-platform layers.

## Testing

- New or changed shared behavior should come with targeted tests in this package when practical.
