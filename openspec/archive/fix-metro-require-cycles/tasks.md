## 1. Fix self-cycles in platform-split hooks (cycles 4 & 5 — latent bugs)

- [x] 1.1 Create `packages/shared/src/hooks/useRuntime.shared.ts` with `RuntimeInfo` type and `ADAPTER_PREFIXES` constant extracted from `useRuntime.ts`
- [x] 1.2 Update `packages/shared/src/hooks/useRuntime.ts` to import and re-export `RuntimeInfo` and `ADAPTER_PREFIXES` from `./useRuntime.shared`
- [x] 1.3 Update `packages/shared/src/hooks/useRuntime.native.ts` to import from `./useRuntime.shared` instead of `./useRuntime`
- [x] 1.4 Create `packages/shared/src/hooks/useRefreshOnFocus.shared.ts` with `UseRefreshOnFocusOptions` type and `DEFAULT_CACHE_TTL` constant extracted from `useRefreshOnFocus.ts`
- [x] 1.5 Update `packages/shared/src/hooks/useRefreshOnFocus.ts` to import and re-export from `./useRefreshOnFocus.shared`
- [x] 1.6 Update `packages/shared/src/hooks/useRefreshOnFocus.native.ts` to import from `./useRefreshOnFocus.shared` instead of `./useRefreshOnFocus`
- [x] 1.7 Update `packages/shared/src/hooks/useRefreshOnFocus.web.ts` to import from `./useRefreshOnFocus.shared` instead of `./useRefreshOnFocus`
- [x] 1.8 Verify `packages/shared/src/hooks/index.ts` barrel still exports `ADAPTER_PREFIXES` correctly

## 2. Extract blockchain network constants (cycles 1 & 2)

- [x] 2.1 Create `packages/shared/src/blockchain/solana/networks.ts` with `SOLANA_NETWORKS` constant (move from `factory.ts`)
- [x] 2.2 Update `packages/shared/src/blockchain/solana/factory.ts` to import and re-export `SOLANA_NETWORKS` from `./networks`
- [x] 2.3 Update `packages/shared/src/blockchain/solana/SolanaAccount.ts` to import `SOLANA_NETWORKS` from `./networks` instead of `./factory`
- [x] 2.4 Create `packages/shared/src/blockchain/bitcoin/networks.ts` with `BITCOIN_NETWORKS` constant (move from `factory.ts`)
- [x] 2.5 Update `packages/shared/src/blockchain/bitcoin/factory.ts` to import and re-export `BITCOIN_NETWORKS` from `./networks`
- [x] 2.6 Create `packages/shared/src/blockchain/ethereum/networks.ts` with `ETHEREUM_NETWORKS` constant (move from `factory.ts`)
- [x] 2.7 Update `packages/shared/src/blockchain/ethereum/factory.ts` to import and re-export `ETHEREUM_NETWORKS` from `./networks`
- [x] 2.8 Update `packages/shared/src/hooks/useAvailableNetworks.ts` to import `SOLANA_NETWORKS` from `../blockchain/solana/networks`, `BITCOIN_NETWORKS` from `../blockchain/bitcoin/networks`, `ETHEREUM_NETWORKS` from `../blockchain/ethereum/networks`

## 3. Move `getBlockchainFromNetworkId` to break config cycle (cycle 3)

- [x] 3.1 Move `getBlockchainFromNetworkId` function definition from `packages/shared/src/utils/account.ts` to `packages/shared/src/config/blockchains.ts`
- [x] 3.2 Add re-export of `getBlockchainFromNetworkId` from `packages/shared/src/utils/account.ts` (importing from `../config/blockchains`) to maintain backward compatibility
- [x] 3.3 Verify `packages/shared/src/utils/index.ts` still exports `getBlockchainFromNetworkId` correctly

## 4. Fix barrel self-import in mobile component (cycle 6)

- [x] 4.1 Update `apps/mobile/src/components/PrivateKeyReveal/PrivateKeyReveal.tsx` to import `PrimaryButton` and `SecondaryButton` from `../Button` and `SettingsScreenLayout` from `../SettingsScreenLayout` instead of `..`

## 5. Verification

- [x] 5.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/shared`
- [x] 5.2 Run shared tests: `pnpm --filter @salmon/shared test -- --run`
- [x] 5.3 Start mobile app with `pnpm mobile:ios -- --clear` and verify zero "Require cycle" warnings in Metro output
