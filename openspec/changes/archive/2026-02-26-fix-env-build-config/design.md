## Context

The extension build (`wxt build`) always produces a bundle targeting `localhost:3000` because `wxt.config.ts` hardcodes `loadEnv('development', ...)` on line 10. This means `.env` (which has `VITE_SALMON_ENV=local`) is always loaded, and `.env.production` is never read.

WXT's `vite` callback already receives a `ConfigEnv` object with `mode: "production"` during `wxt build` and `mode: "development"` during `wxt dev`. The fix is to use this `env.mode` parameter instead of hardcoding.

For mobile, EAS Build profiles in `eas.json` correctly override `EXPO_PUBLIC_SALMON_ENV` per profile. The API URLs in staging/production profiles use custom domains (`api-staging.salmonwallet.io`, `api.salmonwallet.io`) that may not be configured yet — the `EXPO_PUBLIC_API_URL` override bypasses `config.ts` entirely, so these URLs must point to the actual backend or be removed to let `config.ts` resolve them from `SALMON_ENV`.

## Goals / Non-Goals

**Goals:**
- Extension builds (`wxt build`) MUST read `.env.production` and resolve to production API endpoints
- Extension dev (`wxt dev`) MUST continue reading `.env` and resolve to local endpoints
- Add `build:staging` and `build:prod` scripts for both extension and root `package.json`
- Ensure Helius API key is available in all build environments
- Mobile EAS profiles MUST use correct API URLs matching actual backend endpoints
- Revert any workaround applied to `config.ts` default values

**Non-Goals:**
- Changing the backend API or deployment pipeline
- Adding CI/CD workflows (those can be added later using these scripts)
- Changing the shared `config.ts` environment detection logic (it's correct, the problem is upstream env injection)

## Decisions

### 1. Use WXT's `ConfigEnv.mode` in `loadEnv` (Extension)

**Decision**: Change `loadEnv('development', ...)` to `loadEnv(env.mode, ...)` using the `env` parameter WXT already passes to the `vite` callback.

**Why**: WXT sets `mode: "production"` for `wxt build` and `mode: "development"` for `wxt dev` (via `COMMAND_MODES` in WXT internals). Vite's `loadEnv(mode, ...)` loads `.env` + `.env.[mode]`, so `.env.production` will be loaded during builds.

**Alternative considered**: Setting `VITE_SALMON_ENV` inline in build scripts only. Rejected because it doesn't fix the Helius key issue and requires remembering to set every var manually.

### 2. Environment-specific `.env` files (Extension)

**Decision**: Maintain three env files:
- `.env` — local development defaults (loaded always, lowest priority)
- `.env.staging` — staging overrides (`VITE_SALMON_ENV=staging`)
- `.env.production` — production overrides (`VITE_SALMON_ENV=production`)

Helius key stays in `.env` (loaded as base for all modes). Staging and production files only override `VITE_SALMON_ENV`. The `--mode` flag selects which overlay is loaded.

**Why**: Vite's `loadEnv` loads `.env` first, then `.env.[mode]` which overrides. This means common vars (Helius key) go in `.env`, and only the environment identifier needs to be in mode-specific files.

### 3. Build scripts with `--mode` flag (Extension)

**Decision**: Add scripts that use WXT's `--mode` flag:
- `build:staging` → `wxt build --mode staging`
- `build:prod` → `wxt build` (production is the default mode for `wxt build`)
- `dev` → `wxt` (development is the default mode for `wxt dev`)

Also add corresponding root-level scripts in the monorepo `package.json`.

**Why**: WXT's `--mode` flag controls both the Vite mode and the `.env.[mode]` file loaded. No need for inline env vars.

### 4. Remove API URL overrides from `eas.json` (Mobile)

**Decision**: Remove `EXPO_PUBLIC_API_URL` from staging and production EAS profiles. Let `config.ts` resolve the URL from `EXPO_PUBLIC_SALMON_ENV` using the hardcoded `API_URLS` map.

**Why**: The custom domain URLs (`api-staging.salmonwallet.io`, `api.salmonwallet.io`) are not confirmed to exist. The `API_URLS` map in `config.ts` already has the correct AWS API Gateway URLs for staging and production. Removing the override avoids a single point of failure if DNS isn't configured. If custom domains are set up later, they can be added back.

### 5. Add Helius key to EAS profiles (Mobile)

**Decision**: Add `EXPO_PUBLIC_HELIUS_API_KEY` to the staging and production EAS build profiles. Use the same key as local for now — it can be swapped to an EAS Secret later for rotation.

**Why**: Without it, Helius-dependent features (DAS API for NFTs, compressed assets) silently fail in non-local builds.

## Risks / Trade-offs

- **[Risk] Helius key in `.env` is committed to git** → The key is already committed. For production, it should eventually be injected via CI/CD secrets. This change doesn't make it worse — it just ensures the key is actually used.
- **[Risk] Staging API URL points to prod** → Currently `config.ts` maps both staging and production to the same API Gateway endpoint (`te4x28v8e0...`). This is fine for now since there's no separate staging backend, but should be updated when a staging backend exists.
- **[Risk] Breaking existing `wxt build` behavior** → The default mode for `wxt build` is already `"production"`, so running bare `wxt build` will now correctly load `.env.production`. This is the desired behavior, not a regression.
