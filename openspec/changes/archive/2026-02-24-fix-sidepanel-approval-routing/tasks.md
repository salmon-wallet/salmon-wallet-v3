## 1. Revert prior broken attempt

- [x] 1.1 Revert `apps/extension/src/entrypoints/background.ts` to its original state (before the failed side panel changes): remove `APPROVAL_STORAGE_KEY`, `APPROVAL_TIMEOUT_MS`, `PendingApproval` interface, `launchPopupWindow`, and the broken `launchPopup` rewrite. Restore the original `launchPopup` that uses `chrome.windows.create()`.
- [x] 1.2 Revert `apps/extension/src/entrypoints/popup/App.tsx` to its original state: remove `routeApproval`, the `chrome.storage.session.onChanged` listener, and the `dismissApproval` callback.
- [x] 1.3 Revert `apps/extension/src/pages/dapp/DAppConnectPage.tsx`: remove `onDismiss` prop, restore `window.close()` calls.
- [x] 1.4 Revert `apps/extension/src/pages/dapp/DAppTransactionApprovalPage.tsx`: remove `onDismiss` prop, restore `window.close()` calls.
- [x] 1.5 Revert `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx`: remove `onDismiss` prop, restore `window.close()` calls.
- [x] 1.6 Run `pnpm turbo run typecheck --filter=@salmon/extension` to confirm clean revert.

## 2. Side panel port tracking

- [x] 2.1 In `apps/extension/src/entrypoints/sidepanel/main.tsx`, add `chrome.runtime.connect({ name: 'salmon_sidepanel' })` call after the React app renders (inside the async IIFE, after `ReactDOM.createRoot`).
- [x] 2.2 In `apps/extension/src/entrypoints/background.ts`, add a `sidePanelPort` variable and a `chrome.runtime.onConnect` listener that tracks the port named `salmon_sidepanel`. Set the reference to `null` on `port.onDisconnect`.

## 3. Background routing logic

- [x] 3.1 In `background.ts`, add `APPROVAL_STORAGE_KEY = 'salmon_pending_approval'`, `APPROVAL_TIMEOUT_MS = 30_000`, and the `PendingApproval` interface.
- [x] 3.2 Add a `writeApprovalToStorage(approval)` helper that appends to the session storage queue.
- [x] 3.3 Add a `removeApprovalFromStorage(requestId)` helper that removes a specific request from the queue.
- [x] 3.4 Keep the existing `launchPopup` (now renamed `launchPopupWindow`) as the fallback that uses `chrome.windows.create()`.
- [x] 3.5 Restructure the `onMessage` handler for `salmon_contentscript_background_channel`: for non-connect/non-disconnect methods, call `chrome.sidePanel.open({ tabId: sender.tab.id })` as the **first** operation (before any `await`) when `sidePanelPort` is null. Fire-and-forget (`.catch(() => {})`), then proceed to the new `routeApproval()` function.
- [x] 3.6 Create `routeApproval(message, sender, sendResponse)` function: if `sidePanelPort` is connected, write to storage only. If not (and this is for connect), fall back to `launchPopupWindow()`. Register response handler and 30s timeout.
- [x] 3.7 Modify `handleConnect()`: when the dApp is not trusted and `onlyIfTrusted` is false, call `routeApproval()` instead of the old `launchPopup()`.

## 4. Side panel storage listener (App.tsx)

- [x] 4.1 In `App.tsx`, add a `useEffect` that reads `chrome.storage.session.get('salmon_pending_approval')` on mount and routes the first queue item to the appropriate `setPendingDApp*` state.
- [x] 4.2 Add a `chrome.storage.onChanged` listener in the same `useEffect` that watches `salmon_pending_approval` changes and routes new items.
- [x] 4.3 Create a `dismissApproval` callback that clears all `pendingDApp*` states, removes the first item from the storage queue (triggering `onChanged` for the next item if any).

## 5. DApp pages — onDismiss prop

- [x] 5.1 Add `onDismiss: () => void` to `DAppConnectPage` props. Replace both `window.close()` calls with `onDismiss()`.
- [x] 5.2 Add `onDismiss: () => void` to `DAppTransactionApprovalPage` props. Replace all `window.close()` calls with `onDismiss()`.
- [x] 5.3 Add `onDismiss: () => void` to `DAppSignMessageApprovalPage` props. Replace all `window.close()` calls with `onDismiss()`.
- [x] 5.4 Pass `onDismiss={dismissApproval}` to all three DApp page renderings in `App.tsx`.

## 6. Verification

- [x] 6.1 Run `pnpm turbo run typecheck --filter=@salmon/extension` — must pass with no errors.
