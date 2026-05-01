# AGENTS.md instructions for `packages/shared/src/blockchain`

## Responsibility

- chain-specific logic shared across apps
- adapters and helpers for Solana, Bitcoin, and Ethereum domains

## Rules

- Keep chain concerns isolated by subfolder.
- Reuse shared types and utilities instead of duplicating chain contracts in apps.
- Preserve future-facing Ethereum surface unless removal is explicitly requested.

## Testing

- Add or update chain-focused tests when shared blockchain behavior changes.
