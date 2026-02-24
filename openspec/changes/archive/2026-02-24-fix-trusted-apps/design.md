## Context

The Trusted Apps feature in v3 has five gaps compared to v2:

1. **signMessage (`sign`) not handled in popup** - `SolanaProvider.signMessage()` sends `method: 'sign'`, background opens popup, but `App.tsx` only routes `connect`, `signTransaction`, `signAllTransactions`, `signAndSendTransaction`. The `sign` method falls through with no UI rendered.
2. **TrustedAppsPage is a stub** - `apps/extension/src/pages/settings/TrustedAppsPage.tsx` returns `<h1>TrustedAppsPage</h1>`. However, trusted apps management already works through the side panel (`HomePage.tsx:1245-1262` using `TrustedAppsSelector`). The stub page needs to be implemented for the standalone popup context.
3. **No dApp metadata fetched on connect** - `DAppConnectPage` calls `addTrustedApp(origin)` without name/icon. The API service `dapp.ts:getMetadata()` exists but is unused.
4. **`onlyIfTrusted` ignored** - `ConnectOptions.onlyIfTrusted` is defined in `SolanaProvider.ts:42` but `background.ts:handleConnect()` never reads it. Eager connect pattern is broken.
5. **Wrong type in background.ts** - `StorageData.trustedApps` typed as `Record<string, Record<string, boolean>>` but actual stored shape is `Record<string, Record<string, { name?: string; icon?: string }>>`.

### Current Message Flow

```
dApp → SolanaProvider → CustomEvent → content.ts → chrome.runtime.sendMessage → background.ts
  ↓ (if not trusted)
background.ts → launchPopup() → popup App.tsx routes by request.method
  ↓
Approval page → chrome.runtime.sendMessage → background.ts → responseHandler → content.ts → dApp
```

### Existing Code to Reuse

- `DAppTransactionApprovalPage.tsx` — template for the new sign message page (same styled components, layout, approve/deny pattern)
- `@salmon/shared` exports: `colors`, `spacing`, `fontSize`, `fontWeight`, `fontFamily`, `formatOrigin`, `getShortAddress`, `isSolanaAccount`
- `TrustedAppsSelector` component — already complete, just needs to be used in `TrustedAppsPage.tsx`
- `dapp.ts:getMetadata()` — exists and works, just not called
- `tweetnacl` — already a dependency in `packages/shared` for `sign.detached`
- `bs58` — already used in `SolanaProvider.ts` and `DAppTransactionApprovalPage.tsx`
- `SolanaAccount.keyPair` — `Keypair` from `@solana/web3.js`, `.secretKey` gives raw bytes for nacl signing

## Goals / Non-Goals

**Goals:**
- Implement `sign` (signMessage) approval page so dApps can request message signing
- Implement `TrustedAppsPage` for the standalone popup context
- Fetch and persist dApp metadata (name, icon) during connection approval
- Support `onlyIfTrusted` for silent/eager connect pattern
- Fix `StorageData` type to match actual stored data shape

**Non-Goals:**
- Auto-approve transactions for trusted apps (v2 doesn't do this either — only connection is auto-approved)
- Session expiration / timeout for trusted app connections
- Permission granularity (scoping by method or assets)
- Mobile dApp connection support (separate concern)

## Decisions

### D1: Sign message using `nacl.sign.detached` via `tweetnacl`

**Decision**: Use `tweetnacl`'s `sign.detached()` — same as v2.

**Why**: `tweetnacl` is already a dependency in `packages/shared`. The `@solana/web3.js` `Keypair.secretKey` provides the 64-byte ed25519 secret key that `nacl.sign.detached` expects. This matches v2's implementation exactly.

**Alternative considered**: Using `@solana/web3.js`'s `sign()` — but it doesn't expose a standalone message signing function, only transaction signing.

### D2: Display message as UTF-8 text with hex fallback

**Decision**: Decode message bytes as UTF-8 for display. If the bytes aren't valid UTF-8 or contain control characters, show hex representation instead.

**Why**: Matches v2 behavior where `display` param controls rendering. Most dApp sign-in messages (SIWS) are UTF-8 text.

### D3: Pass `onlyIfTrusted` via `params.options` in the existing message flow

**Decision**: The `connect` request already sends `params: { options }` from `SolanaProvider.connect()`. The background script will read `message.data.params?.options?.onlyIfTrusted` and, if `true` and the origin is not trusted, respond with an error instead of opening the popup.

**Why**: No protocol change needed — the options are already being sent, just not read.

### D4: Fetch metadata in DAppConnectPage, not in background

**Decision**: Call `getMetadata(origin)` inside `DAppConnectPage` (the popup approval UI) and pass the result to `addTrustedApp(origin, { name, icon })` on approve.

**Why**: The background service worker cannot import from `@salmon/shared` (no DOM, crashes MV3). The popup has full React context and can use axios. This matches v2's approach where `AdapterDetail` fetches metadata on mount.

### D5: Implement TrustedAppsPage using existing TrustedAppsSelector + useAccountsContext

**Decision**: Wire the stub page to use `useAccountsContext()` for state and `TrustedAppsSelector` for UI, following the same pattern as `HomePage.tsx:1245-1262`.

**Why**: All the pieces exist. The page just needs to connect them. The side panel already works — this brings parity to the popup context.

## Risks / Trade-offs

- **[Risk] `getMetadata()` API call fails during connect** → Mitigation: catch errors and proceed with `addTrustedApp(origin)` without metadata. Connection should not fail because metadata is unavailable.
- **[Risk] `onlyIfTrusted` rejection confuses dApps** → Mitigation: Return a structured error `{ error: 'User not connected' }` matching Solana wallet-standard expectations. dApps using eager connect already handle this case gracefully.
- **[Risk] Message display of arbitrary bytes could be confusing** → Mitigation: Show hex for non-UTF-8 data and always display origin prominently so users know what's requesting the signature.
