# Blinks Registry

Trust root for Solana Actions consumed by Salmon wallets. Hosts not listed here are refused.

## Refresh

Manual: `pnpm tsx scripts/refresh-blinks-registry.ts`
Cadence: weekly review; bump after each Dialect registry update we accept.
Source: https://actions-registry.dialectapi.to/all (verify before adoption).

## Schema

`{ "version": "<iso date>", "source": "<seed-source>", "actions": [{ "host": "..." }] }`

## Failsafe

If snapshot file is missing/empty, the loader treats every host as untrusted (deny-by-default).
