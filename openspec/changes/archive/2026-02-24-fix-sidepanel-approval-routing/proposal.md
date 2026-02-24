## Why

When a dApp requests connection or transaction signing, `background.ts` opens a separate 380x675 popup window via `chrome.windows.create()`. This is redundant when the side panel is already open — the user sees the approval in **both** the side panel and the popup window simultaneously. The approval should appear inline in the existing side panel only, with no extra window.

A prior attempt failed because `chrome.sidePanel.open()` was called after `await` operations in the background script, which breaks Chrome's **user gesture chain requirement**. Per Chrome's official docs, `sidePanel.open()` must be the first async call in the `onMessage` handler — any preceding `await` silently loses the gesture context.

## What Changes

- **Fix `launchPopup` in `background.ts`**: Call `chrome.sidePanel.open({ tabId })` as the **first** operation in the `onMessage` handler (before any storage reads/writes) to preserve the user gesture chain. Then write the pending request to `chrome.storage.session` for the side panel to read.
- **Remove duplicate approval display**: When the side panel is handling an approval, no popup window should open. Only fall back to `chrome.windows.create()` if `sidePanel.open()` is unavailable or throws.
- **Add storage-based request passing in `App.tsx`**: The side panel's `App.tsx` reads pending approvals from `chrome.storage.session` on mount and listens via `chrome.storage.onChanged` for new ones.
- **Replace `window.close()` in DApp pages**: All three DApp approval pages (`DAppConnectPage`, `DAppTransactionApprovalPage`, `DAppSignMessageApprovalPage`) replace `window.close()` with an `onDismiss` callback that clears storage and pending state, returning to HomePage.
- **Add 30s timeout**: Auto-reject unanswered requests if the side panel doesn't respond within 30 seconds.
- **Queue support**: Store approvals as an array in `chrome.storage.session` to handle multiple simultaneous requests (show first, pop on completion).

## Capabilities

### New Capabilities
- `sidepanel-approval-routing`: Route dApp approval requests (connect, sign, signTransaction) to the side panel via `chrome.storage.session` instead of opening popup windows. Includes user gesture chain preservation, fallback to popup, timeout, and queue management.

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **`apps/extension/src/entrypoints/background.ts`**: Restructure `launchPopup` and `onMessage` handler to call `sidePanel.open()` synchronously first, then write to session storage.
- **`apps/extension/src/entrypoints/popup/App.tsx`**: Add `chrome.storage.session` listener and `dismissApproval` callback.
- **`apps/extension/src/pages/dapp/DAppConnectPage.tsx`**: Add `onDismiss` prop, replace `window.close()`.
- **`apps/extension/src/pages/dapp/DAppTransactionApprovalPage.tsx`**: Add `onDismiss` prop, replace `window.close()`.
- **`apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx`**: Add `onDismiss` prop, replace `window.close()`.
- **`apps/extension` only** — no changes to `packages/shared` or `apps/mobile`.
