## 1. Add transfer options types to account classes

- [x] 1.1 In `SolanaAccount.ts`, add a `SolanaTransferOptions` interface (or reuse `TransferOptions` from `./transfer`) that covers: `simulate?: boolean`, `memo?: string`, `decimals?: number`. Import it from `./transfer` since it already exists there as `TransferOptions`.

- [x] 1.2 In `EthereumAccount.ts`, add an `EthereumAccountTransferOptions` interface that extends the existing `TransferOptions` from `./transfer` with: `tokenType?: 'native' | 'erc20' | 'erc721' | 'erc1155'`, `symbol?: string`, `decimals?: number`. The `tokenId`, `gasLimit`, `maxFeePerGas`, etc. are already in the base `TransferOptions`.

- [x] 1.3 In `BitcoinAccount.ts`, add a `BitcoinTransferOptions` interface with: `feeRate?: number`. The Bitcoin transfer function already accepts a fee rate.

## 2. Add `transfer()` and `estimateTransferFee()` methods to account classes

- [x] 2.1 In `SolanaAccount.ts`, add:
  ```typescript
  async transfer(
    to: string,
    token: string,
    amount: number,
    opts?: TransferOptions,
  ): Promise<{ txId: string }>
  ```
  Implementation: call `getConnection()`, then call `createTransfer(connection, this.keyPair, new PublicKey(to), token, amount, opts)` from `./transfer` (already imported module -- `SolanaAccount` already imports from `./transfer` for `requiresMemo` and `calculateTransferFee`). Return `{ txId: result.txId as string }`.

- [x] 2.2 In `SolanaAccount.ts`, add:
  ```typescript
  async estimateTransferFee(
    to: string,
    token: string,
    amount: number,
    opts?: EstimateFeeOptions,
  ): Promise<FeeEstimateResult | null>
  ```
  Implementation: call `getConnection()`, then call `estimateFee(connection, this.keyPair, new PublicKey(to), token, amount, opts)` from `./transfer`. If result is null, return null. Otherwise, convert lamports to SOL using `removeDecimals(fee, 9)`, format to string, return `{ fee: feeString }`. Import `FeeEstimateResult` from `../../types/send`.

- [x] 2.3 In `EthereumAccount.ts`, add:
  ```typescript
  async transfer(
    to: string,
    token: string,
    amount: number,
    opts?: EthereumAccountTransferOptions,
  ): Promise<{ txId: string }>
  ```
  Implementation: call `getConnection()` to get the connected wallet. Construct the `TransferToken` based on `opts.tokenType`:
  - If `isNativeEth(token)` or `opts?.tokenType === 'native'` -> `createNativeToken()`
  - If `opts?.tokenType === 'erc721'` -> `createERC721Token(token, opts?.symbol)`
  - If `opts?.tokenType === 'erc1155'` -> `createERC1155Token(token, opts?.symbol)`
  - Else -> `createERC20Token(token, opts?.decimals ?? 18, opts?.symbol)`

  Then call `sendTransaction(wallet, to, transferToken, amount, opts)` from `./transfer`. Return `{ txId: result.txHash }`.

- [x] 2.4 In `EthereumAccount.ts`, add:
  ```typescript
  async estimateTransferFee(
    to: string,
    token: string,
    amount: number,
    opts?: EthereumAccountTransferOptions,
  ): Promise<FeeEstimateResult | null>
  ```
  Implementation: call `getProvider()`. Construct `TransferToken` same as in `transfer()`. Call `estimateTransferFee(provider, to, transferToken, amount, opts)` from `./transfer`. Convert `estimate.estimatedFee` to ETH string using `formatAmount(estimate.estimatedFee, 18)` from `./transfer`. Return `{ fee: feeInEth }`.

- [x] 2.5 In `BitcoinAccount.ts`, add:
  ```typescript
  async transfer(
    to: string,
    _token: string,
    amount: number,
    opts?: BitcoinTransferOptions,
  ): Promise<{ txId: string }>
  ```
  Implementation: get the BIP32 node via `getBip32Node()`, throw if missing. Construct the `SigningKeyPair` from `this.keyPair` + `node`. Call `sendBitcoin(this.network, signingKeyPair, to, amount, () => this.getUtxos(), (_networkId, _address, serializedTx) => this.broadcast(serializedTx))` from `./transfer`. If `!result.success`, throw. Return `{ txId: result.txId || '' }`.

- [x] 2.6 In `BitcoinAccount.ts`, add:
  ```typescript
  async estimateTransferFee(
    _to: string,
    _token: string,
    _amount: number,
    opts?: BitcoinTransferOptions,
  ): Promise<FeeEstimateResult | null>
  ```
  Implementation: call `this.getUtxos()`, then `estimateBitcoinFee(utxos.length, 2, opts?.feeRate)` from `./transfer`. Convert satoshis to BTC using `satoshisToBtc(fee)`, format to string. Return `{ fee: feeString }`.

## 3. Add necessary imports to account classes

- [x] 3.1 In `SolanaAccount.ts`: add imports for `createTransfer` and `estimateFee` from `./transfer` (add to the existing import from `./transfer` which already imports `requiresMemo` and `calculateTransferFee`). Add import for `PublicKey` (already imported). Add import for `removeDecimals` from `../../utils/decimals`. Add import for `FeeEstimateResult` from `../../types/send`.

- [x] 3.2 In `EthereumAccount.ts`: add imports for `sendTransaction`, `estimateTransferFee`, `formatAmount` from `./transfer`. Add imports for `isNativeEth`, `createNativeToken`, `createERC20Token`, `createERC721Token`, `createERC1155Token` from `../../utils/tokens`. Add import for `FeeEstimateResult` from `../../types/send`. Add import for `TransferOptions` from `./transfer` (to extend for `EthereumAccountTransferOptions`).

- [x] 3.3 In `BitcoinAccount.ts`: add imports for `sendBitcoin`, `estimateBitcoinFee` from `./transfer`. Add import for `SigningKeyPair` from `../../types/transfer`. Add import for `FeeEstimateResult` from `../../types/send`.

## 4. Verify factory spread pattern works without changes

- [x] 4.1 Verify that the factory spread pattern (`...apiFunctions`) in `createSolanaAccount`, `createBitcoinAccount`, `createEthereumAccount` does not need modification. Since the new `transfer()` and `estimateTransferFee()` methods call sibling `./transfer` functions directly (no DI injection), the `*AccountApiFunctions` interfaces and `*apiFunctions` adapter objects do not change. The factories should continue to work as-is. Confirm by inspecting each factory's `new *Account({...})` call and verifying no new fields are needed.

## 5. Refactor `useSendTransaction.ts`

- [x] 5.1 Remove the following direct blockchain imports from `useSendTransaction.ts`:
  ```
  import { createTransfer as solanaCreateTransfer, estimateFee as solanaEstimateFee } from '../blockchain/solana/transfer';
  import { sendTransaction as ethSendTransaction, estimateTransferFee as ethEstimateTransferFee, formatAmount as ethFormatAmount } from '../blockchain/ethereum/transfer';
  import { sendBitcoin, estimateBitcoinFee } from '../blockchain/bitcoin/transfer';
  ```
  Also remove:
  ```
  import { PublicKey } from '@solana/web3.js';
  import { removeDecimals, satoshisToBtc } from '../utils/decimals';
  import { isNativeEth, createNativeToken, createERC20Token } from '../utils/tokens';
  import type { BitcoinAccount } from '../blockchain/bitcoin';
  import type { EthereumAccount } from '../blockchain/ethereum';
  ```

- [x] 5.2 Replace `estimateFeeSolana`, `estimateFeeEthereum`, `estimateFeeBitcoin` callbacks with a single unified callback that calls `account.estimateTransferFee(params.recipientAddress, params.token.address, params.amount)`. The account handles all chain-specific logic and returns `FeeEstimateResult | null`.

- [x] 5.3 Replace `sendSolana`, `sendEthereum`, `sendBtc` callbacks with a single unified callback that calls `account.transfer(params.recipientAddress, params.token.address, params.amount)`. For Ethereum ERC20, pass `{ decimals: params.token.decimals, symbol: params.token.symbol }` in opts. The account returns `{ txId: string }`.

- [x] 5.4 Simplify the `estimateFee` function: remove the `blockchain` switch. Just call `account.estimateTransferFee(...)`. The `blockchain` param in `UseSendTransactionParams` may no longer be needed if the account handles routing; evaluate whether to keep it for other purposes or remove it.

- [x] 5.5 Simplify the `sendTransaction` function: remove the `blockchain` switch. Just call `account.transfer(...)`.

- [x] 5.6 Evaluate whether `UseSendTransactionParams.blockchain` can be removed entirely. If the only use was for routing to the correct blockchain transfer function, and the account now handles this, the param is redundant. However, if callers rely on it for other purposes, keep it. Check callers in `apps/mobile` and `apps/extension`.
  > **Result**: Kept. Callers in `apps/mobile` (SendSheet.tsx, StepConfirmation.tsx) and `apps/extension` (SendPage.tsx, StepConfirmation.tsx) all pass `blockchain`. Removing it would break callers. Prefixed with `_` in destructuring since it's no longer used for routing.

## 6. Refactor `useNftTransfer.ts`

- [x] 6.1 Remove the following direct blockchain imports from `useNftTransfer.ts`:
  ```
  import { PublicKey } from '@solana/web3.js';
  import { createTransfer as solanaCreateTransfer } from '../blockchain/solana/transfer';
  import { sendTransaction as ethSendTransaction } from '../blockchain/ethereum/transfer';
  import { createERC721Token, createERC1155Token } from '../utils/tokens';
  import type { EthereumAccount } from '../blockchain/ethereum';
  ```

- [x] 6.2 Replace `sendSolanaNft` callback: instead of manually calling `solanaCreateTransfer(connection, account.keyPair, new PublicKey(recipientAddress), nft.mint, 1)`, call `account.transfer(recipientAddress, nft.mint, 1)`.

- [x] 6.3 Replace `sendEthereumNft` callback: instead of manually calling `ethSendTransaction(wallet, recipientAddress, transferToken, 1, { tokenId: nft.tokenId })`, call `account.transfer(recipientAddress, nft.contractAddress, 1, { tokenId: nft.tokenId, tokenType: nft.tokenType.toLowerCase(), symbol: nft.symbol })`.

- [x] 6.4 Simplify `sendNft`: the per-chain callbacks can be inlined since they are now one-liners. The `nft.blockchain` switch remains but the body of each case is a single `account.transfer()` call.

- [x] 6.5 Verify that the `isSolanaAccount`/`isEthereumAccount` type guards are still needed. Since `account.transfer()` exists on all account types, the guard may only be needed for TypeScript narrowing to access chain-specific opts. Evaluate and remove if unnecessary.
  > **Result**: Removed. The guards are no longer needed since `account.transfer()` is on the `BlockchainAccount` union type and the `nft.blockchain` check handles routing without needing to narrow the account type.

## 7. Verification

- [x] 7.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/shared` — PASSES
- [x] 7.2 Run tests: `pnpm turbo run test --filter=@salmon/shared` — 1195 passed, 2 failed (pre-existing `getBalance` failures unrelated to this change), 13 skipped
- [x] 7.3 Run lint: `pnpm turbo run lint --filter=@salmon/shared` — 0 errors, 9 warnings (all pre-existing or `_blockchain` prefix applied)
- [x] 7.4 Verify that `useSendTransaction` no longer imports anything from `blockchain/solana/transfer`, `blockchain/ethereum/transfer`, or `blockchain/bitcoin/transfer`. — CONFIRMED
- [x] 7.5 Verify that `useNftTransfer` no longer imports anything from `blockchain/solana/transfer` or `blockchain/ethereum/transfer`. — CONFIRMED
- [x] 7.6 Verify that `useSendTransaction` no longer imports `@solana/web3.js` (`PublicKey`). — CONFIRMED
- [x] 7.7 Verify no regressions in the full build: `pnpm turbo run typecheck` — ALL 4 PACKAGES PASS
