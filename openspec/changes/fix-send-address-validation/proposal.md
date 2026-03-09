## Why

The Send flow on web (and potentially mobile) always shows "Invalid address format" when the user enters a valid recipient address. The root cause is that RPC/network errors during address validation are caught by a generic catch block that hardcodes the error code as `'invalid'`, making it indistinguishable from an actual format error. This blocks all send functionality on web.

## What Changes

- Wrap `connection.getAccountInfo()` in `validatePublicKey()` with a try-catch so RPC failures return a distinct `network_error` result instead of throwing
- Add a `'network_error'` validation code and user-facing message to `VALIDATION_MESSAGES`
- Update the catch block in `useAddressValidation` to propagate typed validation errors correctly instead of defaulting everything to `'invalid'`
- Ensure the UI displays a meaningful message for network errors vs format errors

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `web-send-flow`: Address validation must distinguish between format errors and network/RPC errors, returning appropriate error codes and messages for each case

## Impact

- **`packages/shared/src/blockchain/solana/validation.ts`** — `validatePublicKey()` needs try-catch around `getAccountInfo`
- **`packages/shared/src/utils/validation.ts`** — New `network_error` code in `VALIDATION_MESSAGES`
- **`packages/shared/src/hooks/useAddressValidation.ts`** — Catch block must check error type before assigning code
- **All platforms (web, extension, mobile)** — The fix is in shared code, so all platforms benefit. No breaking changes; format errors remain `'invalid'`, only network errors get a new code.
