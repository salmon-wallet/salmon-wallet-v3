## Context

The extension uses WXT with two entrypoints that share the same `App.tsx`: `popup/` and `sidepanel/`. The background script has `setPanelBehavior({ openPanelOnActionClick: true })`, so clicking the extension icon opens the side panel. When a dApp requests connection or signing, `background.ts` currently writes to `chrome.storage.session` AND falls back to `chrome.windows.create()` — causing the approval to appear in **both** the side panel and a popup window simultaneously.

### Message flow (current)

```
dApp click → injected.ts (page context) → content.ts (content script) →
  browser.runtime.sendMessage → background.ts onMessage handler
```

The `onMessage` handler routes by method:
- `connect` → `handleConnect()` (async storage read first, then possibly `launchPopup()`)
- `disconnect` → `handleDisconnect()` (auto-respond, no UI)
- everything else (`sign`, `signTransaction`, etc.) → `launchPopup()` directly

### Chrome API constraint

`chrome.sidePanel.open()` requires a **user gesture chain**. The gesture propagates from the dApp page click → content script → `runtime.sendMessage` → background `onMessage` handler. But it expires at the first `await`. This means:
- Calling `sidePanel.open()` **before** any `await` in `onMessage` → works
- Calling it after `chrome.storage.local.get()` callback (as in `handleConnect`) → fails silently

The `onMessage` handler pattern from Google's official example:
```js
chrome.runtime.onMessage.addListener((message, sender) => {
  (async () => {
    await chrome.sidePanel.open({ tabId: sender.tab.id });
  })();
  // Returns undefined — sidePanel.open() sees the gesture
});
```

## Goals / Non-Goals

**Goals:**
- Eliminate duplicate approval (never show both side panel and popup window)
- Route transaction/signing approvals to the side panel when possible
- Preserve the existing dApp response flow (`salmon_extension_background_channel`)
- Support queued approvals (multiple requests handled sequentially)
- Fall back gracefully to popup window when side panel can't be used

**Non-Goals:**
- Changing the content script or injected script
- Adding new UI to the approval pages (just swap `window.close()` → `onDismiss`)
- Handling Firefox sidebar (Chrome-only feature, already gated by `import.meta.env.CHROME`)

## Decisions

### D1: Port-based side panel detection

**Decision:** Use `chrome.runtime.connect()` port to track whether the side panel is open.

**Rationale:** The core bug is that the fallback popup fires even when the side panel is already handling the request. We need to know the panel's state. A persistent port is the only reliable real-time signal:
- Side panel connects a port named `salmon_sidepanel` on mount
- Background tracks `sidePanelPort` reference
- `port.onDisconnect` nullifies the reference when panel closes

**Alternatives considered:**
- Check `chrome.storage.session` for a "panel alive" flag → stale if panel crashes
- Use `chrome.runtime.sendMessage` and check for "receiving end does not exist" → error-driven control flow, unreliable

### D2: Open side panel before any await (gesture chain preservation)

**Decision:** For methods that **always** need approval UI (`sign`, `signTransaction`, `signAllTransactions`, `signAndSendTransaction`), call `chrome.sidePanel.open({ tabId })` as the **first** operation in the `onMessage` handler — before routing to any async handler.

**Rationale:** These methods always require user approval, so we know at the `onMessage` level that UI is needed. Calling `sidePanel.open()` immediately preserves the user gesture chain.

**For `connect`:** We cannot call `sidePanel.open()` immediately because the method only needs UI when the dApp is NOT already trusted — and we don't know that until after an async storage read. Instead:
- If `sidePanelPort` is connected → write to storage, panel handles it (no popup)
- If `sidePanelPort` is null → fall back to popup window (gesture already lost)

This is acceptable because:
- First visit to a dApp (not trusted, panel closed) → popup window (same as before)
- Subsequent visits with panel open → side panel handles it
- Transaction/signing requests → always go to side panel (gesture preserved)

### D3: Storage-based request queue with `chrome.storage.session`

**Decision:** Write pending approvals to `chrome.storage.session` key `salmon_pending_approval` as an array. Side panel reads on mount and listens via `chrome.storage.onChanged`.

**Rationale:** Session storage survives service worker restarts, handles the race condition where storage is written before the panel finishes loading, and requires no new permissions.

### D4: `onDismiss` callback replaces `window.close()`

**Decision:** All three DApp approval pages accept an `onDismiss` prop. On approve/deny, they call `onDismiss()` which clears the storage entry and resets pending state in `App.tsx`, returning to HomePage.

**Rationale:** `window.close()` is a no-op in a side panel (it can't close its own window). The `onDismiss` pattern works for both side panel (reset state) and popup window (the popup's `onDismiss` can still call `window.close()`).

### D5: Routing logic — no dual display

**Decision:** The routing in `launchPopup()` follows this logic:

```
if sidePanelPort is connected:
  → write approval to session storage
  → side panel detects it and shows UI
  → NO popup window
else:
  → try sidePanel.open() (only if gesture is fresh — non-connect methods)
  → if open succeeds → write to storage → panel handles it
  → if open fails or unavailable → launchPopupWindow() as fallback
```

This guarantees exactly ONE surface shows the approval.

## Risks / Trade-offs

**[Connect with panel closed] → Fallback to popup window**
For the `connect` method when the side panel is not open, we cannot programmatically open the side panel (gesture is lost after storage read). The popup window will appear. This is the same UX as before, only for the first connect. Once the panel is open, subsequent connects go there.

**[Side panel port race condition] → Mitigated by storage**
If the side panel is just opening (port not yet connected), the storage write ensures the request isn't lost. The panel reads storage on mount.

**[30s timeout] → Auto-reject**
If the user ignores the approval for 30 seconds, the request auto-rejects and the dApp receives an error. This prevents ghost handlers accumulating in the background.

**[Service worker restart] → Both sides reset consistently**
`responseHandlers` map is lost, but `chrome.storage.session` also resets on browser restart. Within a session, storage survives SW restarts while handlers don't — but the 30s timeout cleans stale handlers regardless.

## Files to modify

| File | Change |
|------|--------|
| `apps/extension/src/entrypoints/background.ts` | Port tracking, restructure `onMessage` for gesture chain, routing logic |
| `apps/extension/src/entrypoints/popup/App.tsx` | Storage listener, `dismissApproval` callback, pass `onDismiss` to pages |
| `apps/extension/src/entrypoints/sidepanel/main.tsx` | Connect port `salmon_sidepanel` on mount |
| `apps/extension/src/pages/dapp/DAppConnectPage.tsx` | Add `onDismiss` prop, replace `window.close()` |
| `apps/extension/src/pages/dapp/DAppTransactionApprovalPage.tsx` | Add `onDismiss` prop, replace `window.close()` |
| `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx` | Add `onDismiss` prop, replace `window.close()` |
