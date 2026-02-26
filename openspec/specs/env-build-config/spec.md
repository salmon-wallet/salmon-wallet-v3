## ADDED Requirements

### Requirement: Extension build resolves correct environment
The extension build system (`apps/extension/wxt.config.ts`) SHALL use the WXT-provided `ConfigEnv.mode` parameter when calling Vite's `loadEnv()` instead of hardcoding `'development'`. This ensures `.env.[mode]` files are loaded correctly based on the build command.

#### Scenario: Production build loads production env
- **WHEN** running `wxt build` (default mode is `production`)
- **THEN** `loadEnv` is called with mode `'production'`, loading `.env` + `.env.production`, and `VITE_SALMON_ENV` resolves to `'production'`

#### Scenario: Dev server loads development env
- **WHEN** running `wxt` (dev server, default mode is `development`)
- **THEN** `loadEnv` is called with mode `'development'`, loading `.env` + `.env.development` (if exists), and `VITE_SALMON_ENV` resolves to `'local'` from `.env`

#### Scenario: Staging build loads staging env
- **WHEN** running `wxt build --mode staging`
- **THEN** `loadEnv` is called with mode `'staging'`, loading `.env` + `.env.staging`, and `VITE_SALMON_ENV` resolves to `'staging'`

### Requirement: Extension environment-specific env files
The extension app (`apps/extension/`) SHALL maintain environment-specific `.env` files that correctly set `VITE_SALMON_ENV` per environment.

#### Scenario: .env provides local defaults and common vars
- **WHEN** any build or dev command runs
- **THEN** `.env` is loaded as the base, providing `VITE_SALMON_ENV=local`, `VITE_HELIUS_API_KEY`, and other shared vars

#### Scenario: .env.production overrides for production
- **WHEN** a production build runs
- **THEN** `.env.production` is loaded after `.env`, overriding `VITE_SALMON_ENV` to `'production'`

#### Scenario: .env.staging overrides for staging
- **WHEN** a staging build runs (via `--mode staging`)
- **THEN** `.env.staging` is loaded after `.env`, overriding `VITE_SALMON_ENV` to `'staging'`

### Requirement: Extension build scripts for each environment
The extension `package.json` SHALL include build scripts for staging and production environments. The root monorepo `package.json` SHALL include corresponding proxy scripts.

#### Scenario: Build for production
- **WHEN** developer runs `pnpm extension:build:prod` (root) or `pnpm build` (extension dir)
- **THEN** `wxt build` executes with default mode `production`, producing a bundle with production API endpoints

#### Scenario: Build for staging
- **WHEN** developer runs `pnpm extension:build:staging` (root) or `pnpm build:staging` (extension dir)
- **THEN** `wxt build --mode staging` executes, producing a bundle with staging API endpoints

### Requirement: Mobile EAS profiles use correct API endpoints
The mobile EAS build profiles (`apps/mobile/eas.json`) SHALL set `EXPO_PUBLIC_SALMON_ENV` for each profile and let `packages/shared/src/api/config.ts` resolve the API URL from its internal map, rather than overriding with unverified custom domain URLs.

#### Scenario: Production EAS build resolves production API
- **WHEN** an EAS production build runs
- **THEN** `EXPO_PUBLIC_SALMON_ENV` is set to `'production'` and `config.ts` resolves the API URL to `https://te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod`

#### Scenario: Staging EAS build resolves staging API
- **WHEN** an EAS staging build runs
- **THEN** `EXPO_PUBLIC_SALMON_ENV` is set to `'staging'` and `config.ts` resolves the API URL to the staging endpoint from `API_URLS` map

### Requirement: Helius API key available in all build environments
The Helius API key MUST be available in all build environments for both extension and mobile.

#### Scenario: Extension production build has Helius key
- **WHEN** a production extension build runs
- **THEN** `VITE_HELIUS_API_KEY` is defined and non-empty in the bundle (loaded from base `.env`)

#### Scenario: Mobile EAS staging/production builds have Helius key
- **WHEN** an EAS staging or production build runs
- **THEN** `EXPO_PUBLIC_HELIUS_API_KEY` is set in the EAS profile env vars

### Requirement: No workarounds in shared config.ts
The shared API config (`packages/shared/src/api/config.ts`) SHALL NOT contain hardcoded workarounds that override the environment detection fallback to `'production'`. The default fallback MUST remain `'local'` as designed.

#### Scenario: Default fallback is local
- **WHEN** no `SALMON_ENV` or `NODE_ENV` variable is set
- **THEN** `detectEnvironment()` returns `'local'`
