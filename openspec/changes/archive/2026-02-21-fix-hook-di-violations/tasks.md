## 1. Extend DI interfaces in types/transfer.ts

- [x] 1.1 Add `FetchUtxosFn` and `BroadcastTransactionFn` to `BitcoinAccountApiFunctions` interface: add `fetchUtxos: FetchUtxosFn` and `broadcastTransaction: BroadcastTransactionFn` fields (both types already exist in the same file).
- [x] 1.2 Add `FetchSolanaNftsFn` type and `fetchNfts` to `SolanaAccountApiFunctions` interface. The type should match `getSolanaNfts` signature: `(networkId: SolanaNetworkId, address: string) => Promise<import('./nft').Nft[]>`.

## 2. Wire DI in account classes

- [x] 2.1 In `BitcoinAccount.ts`: accept `fetchUtxos` and `broadcastTransaction` in constructor options. Store as private fields. Add public `getUtxos(): Promise<UTXO[]>` that calls `this.fetchUtxosFn(this.network.id, this.address)`. Add public `broadcast(serializedTx: string): Promise<{txId?: string; success: boolean}>` that calls `this.broadcastTransactionFn(this.network.id, this.address, serializedTx)`.
- [x] 2.2 In `SolanaAccount.ts`: accept `fetchNfts` in constructor options. Store as private field. Replace the `getAllNfts()` stub (that throws `method_not_supported`) with a real implementation that calls `getAll(network, publicKey, false, this.fetchNftsFn)` from `./nft` — importing `getAll` which is the existing NFT function that already accepts a backend fetch function as its 4th param.

## 3. Wire DI in API adapters

- [x] 3.1 In `api/services/bitcoin.ts`: add `fetchUtxos` and `broadcastTransaction` to the `bitcoinApiFunctions` object (the functions already exist as exports in the same file).
- [x] 3.2 In `api/services/solana.ts`: import `getSolanaNfts` from `./solana-nft` and add it as `fetchNfts` in the `solanaApiFunctions` object.

## 4. Update factories to pass new DI functions

- [x] 4.1 Find and update the `BitcoinAccount` factory/creation site to pass `fetchUtxos` and `broadcastTransaction` from `bitcoinApiFunctions`.
- [x] 4.2 Find and update the `SolanaAccount` factory/creation site to pass `fetchNfts` from `solanaApiFunctions`.

## 5. Refactor hooks

- [x] 5.1 In `useSendTransaction.ts`: remove the direct import of `fetchUtxos` and `broadcastTransaction` from `api/services/bitcoin`. In `estimateFeeBitcoin`, replace `getUtxos(network, address, fetchUtxos)` with `getUtxos(network, address, btcAccount.getUtxos.bind(btcAccount))` — or simpler: call `btcAccount.getUtxos()` directly and pass the result to `estimateBitcoinFee`. In `sendBtc`, replace the direct `fetchUtxos` and `broadcastTransaction` params with lambdas that delegate to `btcAccount.getUtxos()` and `btcAccount.broadcast()`.
- [x] 5.2 In `useAvatarNfts.ts`: remove the import of `getSolanaNfts` from `api/services`. Replace the `getAllNfts(SOLANA_NETWORKS['solana-mainnet'], address, false, getSolanaNfts)` call with `solanaAccount.getAllNfts()` since the account now has a real implementation. Also remove the `SOLANA_NETWORKS` import since the account already knows its network.
- [x] 5.3 In `useTransactions.ts`: remove direct imports of `getSolanaTransactions` and `getMultichainTransactions`. Add `account: BlockchainAccount | undefined` to the hook params interface. Use `isSolanaAccount(account)` / `isBitcoinAccount(account)` / `isEthereumAccount(account)` to determine blockchain. Call `account.getRecentTransactions({ nextPageToken, pageSize })` for all chains. For Solana, the response is `SolanaTransactionListResponse` (`{data, pageToken}`) → transform with `transformSolanaTransaction`. For Bitcoin/Ethereum, the response is `AccountTransactionListResponse` (`{items, nextPageToken}`) → transform with `transformMultichainTransaction`. Keep `address` and `networkId` as optional params — derive them from the account if not provided (address from `account.getReceiveAddress()`, blockchain from type guards).

## 6. Update callers of useTransactions

- [x] 6.1 In `apps/mobile/app/(app)/(tabs)/index.tsx`: add `account: activeBlockchainAccount` to the `useTransactions` call.
- [x] 6.2 In `apps/extension/src/pages/home/HomePage.tsx`: add `account: activeBlockchainAccount` to the `useTransactions` call.

## 7. Verification

- [x] 7.1 Run typecheck: `pnpm turbo run typecheck`
- [x] 7.2 Run lint: `pnpm turbo run lint`
- [x] 7.3 Run build: `pnpm turbo run build`
- [x] 7.4 Fix any errors found before marking the change as complete
