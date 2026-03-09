## ADDED Requirements

### Requirement: Network error validation code in type system
The `ValidationResultCode` type in `packages/shared/src/types/validation.ts` SHALL include a `'network_error'` code. A corresponding `NETWORK_ERROR` constant SHALL be added to `VALIDATION_RESULTS` with `type: 'ERROR'` and `code: 'network_error'`.

#### Scenario: New validation code is available
- **WHEN** a chain-specific validator encounters an RPC or network failure after the address format has been validated
- **THEN** it SHALL return the `NETWORK_ERROR` validation result instead of throwing an exception

### Requirement: Solana validatePublicKey handles RPC failures gracefully
The `validatePublicKey()` function in `packages/shared/src/blockchain/solana/validation.ts` SHALL wrap `connection.getAccountInfo()` in a try-catch and return `NETWORK_ERROR` when the RPC call fails.

#### Scenario: RPC call fails due to network error
- **WHEN** `connection.getAccountInfo()` throws (CORS, timeout, rate-limit, network down)
- **THEN** `validatePublicKey()` SHALL return `NETWORK_ERROR` result instead of propagating the exception

#### Scenario: Address format is invalid
- **WHEN** the address string is not a valid Solana public key
- **THEN** `validatePublicKey()` SHALL still return `INVALID_ADDRESS` (existing behavior unchanged)

### Requirement: Solana validateDomain distinguishes network errors from invalid domains
The `validateDomain()` function in `packages/shared/src/blockchain/solana/validation.ts` SHALL distinguish between domain resolution failures and network errors.

#### Scenario: Domain resolution fails due to network error
- **WHEN** `getPublicKeyFromDomain()` throws an exception (not a resolution failure but a network issue)
- **THEN** `validateDomain()` SHALL return `NETWORK_ERROR` instead of `INVALID_DOMAIN`

#### Scenario: Domain does not exist
- **WHEN** `getPublicKeyFromDomain()` returns null/undefined (domain not found)
- **THEN** `validateDomain()` SHALL return `INVALID_DOMAIN` (existing behavior unchanged)

### Requirement: useAddressValidation catch block defaults to network_error
The catch block in `useAddressValidation` hook (`packages/shared/src/hooks/useAddressValidation.ts`) SHALL use `code: 'network_error'` instead of `code: 'invalid'` for unhandled exceptions.

#### Scenario: Unexpected exception during validation
- **WHEN** `account.validateDestinationAccount()` throws an uncaught exception
- **THEN** the hook SHALL set validation result with `code: 'network_error'` and the UI SHALL display "Could not verify address. Check your connection."

#### Scenario: Address format is genuinely invalid
- **WHEN** the chain-specific validator returns `{ type: 'ERROR', code: 'invalid' }`
- **THEN** the hook SHALL display "Invalid address format" (existing behavior unchanged)

### Requirement: Network error message in VALIDATION_MESSAGES
The `VALIDATION_MESSAGES` map in `packages/shared/src/utils/validation.ts` SHALL include an entry for `'network_error'` with the message "Could not verify address. Check your connection.".

#### Scenario: UI displays network error
- **WHEN** validation result has `code: 'network_error'`
- **THEN** the displayed message SHALL be "Could not verify address. Check your connection."
