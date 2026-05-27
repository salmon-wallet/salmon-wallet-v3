## 1. getBalance usdTotal fallback (packages/shared)

- [x] 1.1 In `SolanaAccount.getBalance()` (`packages/shared/src/blockchain/solana/SolanaAccount.ts` ~line 294), change `return { items: balances }` to `return { usdTotal: 0, last24HoursChange: 0, items: balances }`
- [x] 1.2 In `BitcoinAccount.getBalance()` (`packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts` ~line 367), change `return { items: balances }` to `return { usdTotal: 0, last24HoursChange: 0, items: balances }`
- [x] 1.3 In `EthereumAccount.getBalance()` (`packages/shared/src/blockchain/ethereum/EthereumAccount.ts` ~line 287), change `return { items: balances }` to `return { usdTotal: 0, last24HoursChange: 0, items: balances }`

## 2. Carousel index sync with networkId

- [x] 2.1 In `apps/web/src/pages/home/HomePage.tsx`, add a `useEffect` after the existing `allNetworks` bounds-reset effect (~line 265) that syncs `activeBlockchainIndex` with `networkId` by finding the matching index in `allNetworks`
- [x] 2.2 In `apps/extension/src/pages/home/HomePage.tsx`, add the same carousel-to-networkId sync `useEffect` after the existing bounds-reset effect (~line 461)
- [x] 2.3 In `apps/mobile/app/(app)/(tabs)/index.tsx`, add the same carousel-to-networkId sync `useEffect` after the equivalent bounds-reset effect

## 3. Verification

- [x] 3.1 Run typecheck (`pnpm turbo run typecheck`) to verify no type errors (pre-existing errors in extension/background.ts only — unrelated to this change)
- [ ] 3.2 Test web app: enable developer networks, switch to Solana Devnet via carousel — verify token list shows devnet tokens (or empty state), header shows Solana address, balance card shows $0.00
- [ ] 3.3 Test web app: reload page with devnet as last selected network — verify carousel opens on the correct card (not index 0)
