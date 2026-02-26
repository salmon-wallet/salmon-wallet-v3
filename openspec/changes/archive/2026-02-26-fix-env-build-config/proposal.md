## Why

The extension build always resolves API endpoints to `localhost:3000` regardless of target environment because `wxt.config.ts` hardcodes `loadEnv('development')`, so `.env.production` is never read during `wxt build`. The Helius API key is also lost. The mobile EAS config uses placeholder API URLs (`api-staging.salmonwallet.io`, `api.salmonwallet.io`) that don't match the actual backend endpoints, and doesn't propagate the Helius key to non-local builds. This blocks shipping the extension to production and risks broken mobile staging/production builds.

## What Changes

- **Fix `wxt.config.ts`** to pass the actual Vite mode to `loadEnv` instead of hardcoding `'development'`, so `wxt build` reads `.env.production` and `wxt dev` reads `.env` / `.env.development`
- **Add environment-specific build scripts** to the extension `package.json` (`build:prod`, `build:staging`) mirroring the v2 pattern
- **Update `.env.production`** in the extension to include all required build-time vars (Helius key, or document CI/CD injection)
- **Verify and fix `eas.json`** API URLs in mobile staging/production profiles to match actual backend endpoints (`te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod`) or confirm custom domains are configured
- **Propagate Helius API key** in EAS build profiles for mobile staging/production

## Capabilities

### New Capabilities
- `env-build-config`: Correct environment-aware build configuration for both extension (WXT/Vite) and mobile (EAS) ensuring API URLs, Helius keys, and env detection work across local, staging, and production builds

### Modified Capabilities
_(none — no existing spec requirements are changing)_

## Impact

- **`apps/extension/wxt.config.ts`** — fix `loadEnv` mode parameter
- **`apps/extension/package.json`** — add `build:staging`, `build:prod` scripts
- **`apps/extension/.env.production`** — add missing env vars
- **`apps/extension/.env.staging`** — new file for staging builds
- **`apps/mobile/eas.json`** — verify/fix API URLs and add Helius key
- **`packages/shared/src/api/config.ts`** — potentially revert any workaround the tech lead applied (default changed to production)
- No backend changes needed — `salmon-api` stages are correctly configured
