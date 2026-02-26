## 1. Fix Extension Build Config

- [x] 1.1 Update `apps/extension/wxt.config.ts`: change `vite: () =>` to `vite: (env) =>` and replace `loadEnv('development', __dirname, 'VITE_')` with `loadEnv(env.mode, __dirname, 'VITE_')`
- [x] 1.2 Update `apps/extension/.env.production` to set `VITE_SALMON_ENV=production` (keep it minimal — Helius key comes from base `.env`)
- [x] 1.3 Create `apps/extension/.env.staging` with `VITE_SALMON_ENV=staging`
- [x] 1.4 Update `apps/extension/.env.example` to document the env file layering strategy (base `.env` + `.env.[mode]` overlay)

## 2. Add Extension Build Scripts

- [x] 2.1 Add `build:staging` and `build:prod` scripts to `apps/extension/package.json`
- [x] 2.2 Add `extension:build:staging` and `extension:build:prod` proxy scripts to root `package.json`

## 3. Fix Mobile EAS Config

- [x] 3.1 Remove `EXPO_PUBLIC_API_URL` overrides from staging and production profiles in `apps/mobile/eas.json` (let `config.ts` resolve from `SALMON_ENV`)
- [x] 3.2 Add `EXPO_PUBLIC_HELIUS_API_KEY` to staging and production EAS profiles in `apps/mobile/eas.json`

## 4. Verify Shared Config

- [x] 4.1 Verify `packages/shared/src/api/config.ts` has no workaround applied (default fallback must be `'local'`, not `'production'`) — revert if needed

## 5. Validation

- [x] 5.1 Run `pnpm extension:build:prod` and verify the built bundle contains production API URL (`te4x28v8e0.execute-api.us-east-1.amazonaws.com/prod`) and not `localhost`
- [x] 5.2 Run `pnpm extension:build:staging` and verify the built bundle contains staging API URL
- [x] 5.3 Run `pnpm extension:dev` and verify it still resolves to `localhost:3000/local`
- [x] 5.4 Run typecheck to ensure no type errors: `pnpm turbo run typecheck --filter=@salmon/extension`
