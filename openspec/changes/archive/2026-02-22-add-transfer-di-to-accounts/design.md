## Context

The DI refactor gave each account class injected functions for balance, prices, transactions, NFTs, UTXOs, and broadcasting. However, the actual transfer/send operations were never brought into the account DI layer. `useSendTransaction` and `useNftTransfer` import the raw blockchain transfer modules directly (`blockchain/solana/transfer`, `blockchain/ethereum/transfer`, `blockchain/bitcoin/transfer`) and manually extract connection, keypair, wallet, provider, and network from the account objects.

This is the last major DI violation in the hooks layer.

### Existing code that already works and can be reused

- `SolanaAccount` already has `getConnection()`, `keyPair`, `publicKey` -- everything `createTransfer` and `estimateFee` need
- `EthereumAccount` already has `getConnection()` (returns connected Wallet), `getProvider()` -- everything `sendTransaction` and `estimateTransferFee` need
- `BitcoinAccount` already has `getUtxos()`, `broadcast()`, `getBip32Node()`, `keyPair`, `network` -- everything `sendBitcoin` and `estimateBitcoinFee` need
- The factory `...apiFunctions` spread pattern already works for all three chains and does not need structural changes
- `useSendTransaction` and `useNftTransfer` expose the same public hook interface (`estimateFee`, `sendTransaction`, `sendNft`, `status`, `error`, `reset`) -- callers will not change

### Current transfer function signatures

```typescript
// Solana
createTransfer(connection, fromKeyPair, toPublicKey, token, amount, opts?) -> TransferResult
estimateFee(connection, fromKeyPair, toPublicKey, token, amount, opts?) -> number | null

// Ethereum
sendTransaction(wallet, to, token, amount, opts?) -> TransferResult
estimateTransferFee(provider, to, token, amount, opts?) -> GasEstimate

// Bitcoin
sendBitcoin(network, keyPair, receiverAddress, amountBtc, fetchUtxos, broadcast) -> BroadcastResult
estimateBitcoinFee(inputCount, outputCount, feeRate?) -> number (pure, no async)
```

## Goals / Non-Goals

**Goals:**
- Add `transfer(to, token, amount, opts?)` and `estimateFee(to, token, amount, opts?)` to all three account classes
- These methods encapsulate the connection/keypair/wallet setup internally
- Refactor `useSendTransaction` to call account methods instead of importing blockchain modules
- Refactor `useNftTransfer` to call `account.transfer()` instead of importing blockchain modules
- NFT transfers go through the same `transfer()` method (Solana: mint as token, amount=1; Ethereum: ERC721/ERC1155 token type with tokenId in opts)
- Keep the same runtime behavior -- hooks produce identical results

**Non-Goals:**
- Changing the hook public API (params/return types) -- callers should not need changes
- Refactoring the underlying transfer functions themselves (`createTransfer`, `sendTransaction`, `sendBitcoin`)
- Adding new transfer features (batch, scheduled, etc.)
- Changing how the `TransferToken` type works in the Ethereum transfer module

## Decisions

### Decision 1: Account classes call transfer functions directly (no DI injection of transfer functions)

**Approach**: Each account class imports its own blockchain's transfer module and delegates to it in its `transfer()` and `estimateFee()` methods. For example, `SolanaAccount.transfer()` imports and calls `createTransfer` from `./transfer`. No new DI function types are needed.

**Why**: The transfer functions (`createTransfer`, `sendTransaction`, `sendBitcoin`) are pure blockchain logic that live in the same `blockchain/{chain}/` directory as the account class. They don't call the API -- they use the connection/keypair/wallet that the account already owns. This is fundamentally different from `fetchBalance` or `fetchTransactions` which call the HTTP API and need DI to be testable. The transfer functions can be unit-tested directly.

**Trade-off**: The account classes gain a direct import to their own `transfer` module. This is acceptable because the import is to a sibling file in the same blockchain package (e.g., `SolanaAccount.ts` imports from `./transfer`), not a cross-boundary import. The `SolanaAccount` class already imports from `./transfer` (for `requiresMemo` and `calculateTransferFee`).

**Alternative considered**: Inject transfer functions via DI (add `CreateTransferFn` to `SolanaAccountApiFunctions`, etc.). Rejected because: (a) it would expand the DI interfaces with functions that don't call the API, (b) the factory spread pattern would need to wire functions from `blockchain/solana/transfer` into `api/services/solana.ts`, creating a backwards dependency, (c) the transfer functions are internal to the blockchain package and belong there.

### Decision 2: Unified transfer method signature across chains

**Approach**: All three account classes expose:
```typescript
transfer(to: string, token: string, amount: number, opts?: TransferOptions): Promise<{ txId: string }>
```

- `to` is the destination address as a string
- `token` is the token identifier (mint address for Solana, contract address for Ethereum, ignored for Bitcoin)
- `amount` is the human-readable amount
- `opts` is chain-specific options (memo for Solana, gasLimit/tokenId for Ethereum, feeRate for Bitcoin)
- Return type is always `{ txId: string }`

**Why**: This lets the hooks call `account.transfer(recipientAddress, token, amount)` without knowing which blockchain they are on. The hook just needs the account instance.

**Trade-off**: The `opts` parameter differs per chain. This is fine because the hooks already know what options to pass based on context (NFT transfer needs `tokenId`, Token-2022 needs `memo`).

### Decision 3: Each account class also exposes `estimateFee()` with a chain-appropriate return

**Approach**: Each account class exposes:
```typescript
estimateTransferFee(to: string, token: string, amount: number, opts?: TransferOptions): Promise<FeeEstimateResult | null>
```

The method internally calls the chain's fee estimation, converts the result to the shared `FeeEstimateResult` type (`{ fee: string; feeUsd?: string }`), handling the unit conversion (lamports->SOL, wei->ETH, satoshis->BTC) inside the account.

**Why**: The hook currently does the fee formatting/conversion itself (e.g., `removeDecimals(fee, 9)`, `formatAmount(estimate.estimatedFee, 18)`, `satoshisToBtc(fee)`). Moving this into the account means the hook just gets back a string it can display.

### Decision 4: NFT transfers go through `account.transfer()` with appropriate token/opts

**Approach**:
- Solana NFT: `account.transfer(recipientAddress, nft.mint, 1)` -- the transfer function already handles SPL tokens including NFTs
- Ethereum NFT: `account.transfer(recipientAddress, nft.contractAddress, 1, { tokenId: nft.tokenId, tokenType: nft.tokenType })` -- the account's transfer method constructs the correct `TransferToken` based on opts

The `useNftTransfer` hook becomes thin: determine the blockchain from `nft.blockchain`, then call `account.transfer()`.

**Why**: Keeps the account as the single entry point for all transfers. No separate `transferNft()` method needed.

### Decision 5: Ethereum transfer method handles token type construction internally

**Approach**: `EthereumAccount.transfer()` accepts a token address string plus optional `tokenType` in opts. It constructs the `TransferToken` (using `createNativeToken()`, `createERC20Token()`, `createERC721Token()`, `createERC1155Token()` from `utils/tokens`) based on:
- If token address is native ETH -> `createNativeToken()`
- If `opts.tokenType === 'erc721'` -> `createERC721Token(address, symbol)`
- If `opts.tokenType === 'erc1155'` -> `createERC1155Token(address, symbol)`
- Otherwise -> `createERC20Token(address, decimals, symbol)`

**Why**: The hook currently constructs `TransferToken` objects manually. This logic belongs in the account since it's Ethereum-specific.

## Risks / Trade-offs

**[Account classes gain transfer imports]** -- `SolanaAccount`, `EthereumAccount`, `BitcoinAccount` each gain an import to their own `./transfer` module. Mitigation: these are sibling imports within the same blockchain package. `SolanaAccount` already imports from `./transfer` for `requiresMemo` and `calculateTransferFee`.

**[opts type divergence]** -- The `opts` parameter on `transfer()` differs per chain. Mitigation: each account class defines its own `TransferOptions` type (or reuses the existing one from `./transfer`). Hooks that need chain-specific options (like NFT tokenId) already know they are dealing with a specific chain.

**[useSendTransaction still needs chain-specific fee formatting removal]** -- Currently the hook does unit conversion after calling the raw fee function. After this change, the account handles the conversion. Mitigation: verify that the formatted strings are identical before and after.
