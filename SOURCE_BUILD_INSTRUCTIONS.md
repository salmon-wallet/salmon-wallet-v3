# Build Instructions — Salmon Wallet Browser Extension

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22.12.0 LTS | `nvm install 22` |
| pnpm | 9.x | `npm install -g pnpm@9` |

> **Important**: This project uses **pnpm** as its package manager (declared in `package.json` → `packageManager` field). Do **not** use npm or yarn — they cannot resolve `workspace:*` dependencies and the build will fail.

## Build Steps

```bash
# 1. Install dependencies (from the repository root)
pnpm install

# 2. Build the Firefox extension
pnpm --filter @salmon/extension build:firefox
```

The build output will be located at `apps/extension/dist/firefox-mv2/`.

## Verify

Compare the contents of `apps/extension/dist/` with the submitted extension package. The generated `manifest.json` and JS bundles should match.

## Project Structure

This is a monorepo managed with pnpm workspaces. The extension at `apps/extension` depends on two internal packages:

- `packages/shared` — shared business logic
- `packages/ui` — shared UI components

These are resolved automatically by pnpm via `workspace:*` protocol.

## Environment

The production build uses `apps/extension/.env.production` (included in the source package) which contains:

```
VITE_SALMON_ENV=production
```

No API keys, secrets, or additional `.env` files are required. All API endpoints are resolved at runtime based on the environment flag above — they are hardcoded in `packages/shared/src/api/config.ts` per environment.

**Important**: Ensure no `.env` file (without suffix) exists in `apps/extension/` when building, as it would override default values and produce a different build output.
