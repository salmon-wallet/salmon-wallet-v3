## Approach

Replace direct blockchain-module imports in `useAddressValidation` with a single `account.validateDestinationAccount(address)` call, delegating chain dispatch and connection management to the account instance.

## Key Decisions

- **Accept `account: BlockchainAccount | undefined` instead of `connection: ChainConnection`.** The account already owns its connection (Solana `getConnection()`, Ethereum `getProvider()`), so the hook no longer needs to receive or manage one. Callers already have the account from `useAccountsContext`.

- **Remove `blockchain` from `UseAddressValidationOptions`.** The hook derives the chain from the account using existing type guards (`isSolanaAccount`, `isBitcoinAccount`, `isEthereumAccount`). The `blockchain` prop on `InputAddressPropsBase` becomes unused and should be removed.

- **Normalize non-Solana return types inside the hook.** `SolanaAccount.validateDestinationAccount` already returns `ValidationResult`. `BitcoinAccount` returns `AddressValidationResult` and `EthereumAccount` returns `EthereumAddressValidationResult` -- both have `{type, code, addressType?}` with `string`-typed `code` and `addressType` fields. A small `normalizeValidationResult` function in the hook maps these to `ValidationResult` by casting `code` to `ValidationResultCode` and mapping `addressType` (`'ADDRESS'` -> `'PUBLIC_KEY'` for Bitcoin, keep as-is for Ethereum).

- **Remove derived connection types.** The `SolanaConnection`, `EthereumProvider`, and `ChainConnection` type aliases derived from `Parameters<typeof validateSolanaAddress>` are no longer needed and will be deleted.

- **Callers simplify.** Both `InputAddress` components currently have a `useEffect` to resolve `connection` from the account. This entire effect block is replaced by passing `activeBlockchainAccount` directly to the hook.

## Data Flow (before -> after)

**Before:**
```
InputAddress
  -> useEffect: resolve connection from activeBlockchainAccount
  -> useAddressValidation(address, connection, {blockchain, onValidation})
    -> if solana: validateSolanaAddress(connection, address)
    -> if ethereum: validateEthereumAddress(connection, address) + normalize
    -> if bitcoin: inline regex test
    -> return ValidationResult
```

**After:**
```
InputAddress
  -> useAddressValidation(address, activeBlockchainAccount, {onValidation})
    -> account.validateDestinationAccount(address)
    -> normalizeValidationResult(rawResult, account)
    -> return ValidationResult
```
