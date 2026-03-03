## Context

The Send flow validates recipient addresses through this chain:

1. `useAddressValidation` hook (debounces input, calls account method)
2. `account.validateDestinationAccount(address)` (delegates to chain-specific validator)
3. `validatePublicKey()` in `solana/validation.ts` (checks format locally, then calls `connection.getAccountInfo()` to verify on-chain)

The problem: `validatePublicKey()` does not wrap the `connection.getAccountInfo()` RPC call in a try-catch. When the RPC fails (CORS on web, rate-limiting, network down), the exception propagates to the generic catch block in `useAddressValidation`, which hardcodes `code: 'invalid'` — making every network error look like "Invalid address format".

## Goals / Non-Goals

**Goals:**
- Distinguish network/RPC errors from actual address format errors
- Show a meaningful message when the RPC call fails (e.g., "Could not verify address")
- Fix applies to all platforms (shared code) without breaking existing behavior

**Non-Goals:**
- Retry logic or RPC fallback mechanisms
- Changing the RPC configuration or endpoints
- Modifying the UI components (the existing message display works fine, just needs the right message)

## Decisions

### 1. Add `network_error` validation code to the type system

Add `'network_error'` to `ValidationResultCode` in `types/validation.ts` and a corresponding `NETWORK_ERROR` constant to `VALIDATION_RESULTS`.

**Why:** A new code (rather than overloading `'invalid'`) lets the UI distinguish format errors from connectivity issues. The type is shared across chains, so Ethereum/Bitcoin validators can also use it in the future.

**Alternative considered:** Using `type: 'WARNING'` with `code: 'invalid'` — rejected because it conflates two different failure modes and provides no actionable feedback to the user.

### 2. Wrap `getAccountInfo()` in try-catch inside `validatePublicKey()`

Catch RPC errors at the source (in `solana/validation.ts`) and return a `NETWORK_ERROR` result instead of letting exceptions escape.

**Why:** The validator knows the format check already passed (line 103-107 handles format errors). Any exception after that point is a network/RPC issue. Catching at the source is more precise than guessing in the generic catch block.

**Alternative considered:** Distinguishing error types in the hook's catch block — rejected because the hook is chain-agnostic and shouldn't know about RPC-specific exceptions.

### 3. Also wrap `getPublicKeyFromDomain()` in `validateDomain()` with network awareness

The existing catch in `validateDomain()` already catches all errors and returns `INVALID_DOMAIN`. This should also distinguish network errors from actual domain resolution failures.

**Why:** Same problem — a network failure during domain resolution shouldn't be reported as "Could not resolve domain name" when the real issue is connectivity.

### 4. Update the hook's catch block to propagate typed errors

Change the catch block in `useAddressValidation` (line 168) to check if the error is a `ValidationResult` (re-thrown from a validator) and use it directly. For truly unexpected errors, fall back to `network_error` instead of `invalid`.

**Why:** The generic catch should be a last resort for unexpected failures, not the primary error classification mechanism. Network errors are the most likely cause of uncaught exceptions in this path.

## Risks / Trade-offs

- **[Risk] Existing consumers may check `code === 'invalid'` to detect all errors** → Mitigation: `'invalid'` still means format error. The new `'network_error'` code is additive. UI already uses `VALIDATION_MESSAGES[code]` which falls back to "Unknown validation error" for unknown codes, so adding the message mapping is safe.

- **[Trade-off] Catch-all defaults to `network_error` instead of `invalid`** → This is intentional. If the format check passed (inside the validator) and something throws, it's almost certainly a network issue. Showing "Could not verify address" is more accurate and actionable than "Invalid address format".
