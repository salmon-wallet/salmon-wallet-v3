## 1. Refactor `useAvailableNetworks` hook (packages/shared)

- [x] 1.1 In `packages/shared/src/hooks/useAvailableNetworks.ts`, extend the params interface to accept an optional `developerNetworks?: boolean` override field (create `UseAvailableNetworksParams` extending `UseUserConfigParams`)
- [x] 1.2 In the hook body, compute the effective value: `const devNets = params.developerNetworks ?? config.developerNetworks;` and use `devNets` in the `networks` useMemo instead of `config.developerNetworks`
- [x] 1.3 Ensure the returned `developerNetworks` reflects the effective value (`devNets`), not the internal `useUserConfig` value

## 2. Update HomePage callers to pass the override

- [x] 2.1 In `apps/web/src/pages/home/HomePage.tsx`, add `developerNetworks` to the `useAvailableNetworks` call (from the existing `useUserConfig` result)
- [x] 2.2 In `apps/extension/src/pages/home/HomePage.tsx`, same change
- [x] 2.3 In `apps/mobile/app/(app)/(tabs)/index.tsx`, same change

## 3. Verification

- [x] 3.1 Run typecheck (`pnpm turbo run typecheck`) to verify no type errors (pre-existing errors in extension/background.ts only — unrelated)
- [ ] 3.2 Test web app: toggle developer networks in Settings — verify carousel dots update immediately from 2 to 6 (or vice versa) without swiping
