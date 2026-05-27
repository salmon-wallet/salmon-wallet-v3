## 1. Fix background.ts types and onlyIfTrusted

- [x] 1.1 Fix `StorageData.trustedApps` type in `apps/extension/src/entrypoints/background.ts` from `Record<string, Record<string, boolean>>` to `Record<string, Record<string, { name?: string; icon?: string }>>` (line 52)
- [x] 1.2 Add `onlyIfTrusted` support to `handleConnect` in `background.ts`: read `message.data.params?.options?.onlyIfTrusted`, and if `true` and origin is not trusted, respond with `{ error: 'User not connected', id: message.data.id }` instead of calling `launchPopup`

## 2. Create DAppSignMessageApprovalPage

- [x] 2.1 Create `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx` with types `DAppSignMessageRequest` (id, method, params with data array). Decode message bytes as UTF-8 (fallback to hex with `0x` prefix). Display origin via `formatOrigin`, decoded message, and Approve/Deny buttons. On approve: sign with `nacl.sign.detached(Uint8Array.from(data), account.keyPair.secretKey)`, encode signature with `bs58.encode`, send `{ result: { signature, publicKey }, id }` to background via `chrome.runtime.sendMessage`, then `window.close()`. On deny: send `{ error: 'User rejected the request', id }` and close. Follow the same styled component pattern as `DAppTransactionApprovalPage.tsx`
- [x] 2.2 Export `DAppSignMessageApprovalPage` and `DAppSignMessageRequest` from `apps/extension/src/pages/dapp/index.ts`

## 3. Wire sign method into popup router

- [x] 3.1 In `apps/extension/src/entrypoints/popup/App.tsx`: add `pendingDAppSignMessageRequest` state, add `method === 'sign'` case to the URL hash parser (lines 81-93), render `DAppSignMessageApprovalPage` when the sign request is pending (before the transaction and connect checks)

## 4. Fetch dApp metadata on connection approval

- [x] 4.1 In `apps/extension/src/pages/dapp/DAppConnectPage.tsx`: import `getMetadata` from `@salmon/shared`, add `useEffect` to call `getMetadata(origin)` on mount, store result in local state. Update `onApprove` prop type to accept optional metadata: `(origin: string, metadata?: { name?: string; icon?: string }) => Promise<void>`. Pass fetched metadata on approve call. Catch errors silently (proceed without metadata)
- [x] 4.2 In `apps/extension/src/entrypoints/popup/App.tsx`: update `handleDAppApprove` to accept and forward the optional metadata parameter to `actions.addTrustedApp(origin, metadata)`

## 5. Implement extension TrustedAppsPage

- [x] 5.1 Implement `apps/extension/src/pages/settings/TrustedAppsPage.tsx`: import `useAccountsContext` from `@salmon/shared` and `TrustedAppsSelector` from `@/components/TrustedAppsSelector`. Map `activeTrustedApps` to `TrustedAppItem[]`, pass to `TrustedAppsSelector` with `onRevokeApp` calling `actions.removeTrustedApp(domain)`. Follow the exact pattern from `HomePage.tsx:1245-1262`

## 6. i18n strings

- [x] 6.1 Add i18n keys to `packages/shared/src/locales/en/translation.json` and `packages/shared/src/locales/es/translation.json`: `dapp.sign_message_title`, `dapp.sign_message_subtitle`, `dapp.message_label`, `dapp.hex_message_label`

## 7. Typecheck

- [x] 7.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/extension` and fix any errors
