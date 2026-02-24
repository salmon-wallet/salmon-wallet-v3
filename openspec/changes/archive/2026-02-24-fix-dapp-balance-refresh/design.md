## Context

When a dApp (e.g., Jupiter) requests a transaction or message signing, the extension routes the approval to the side panel. After the user approves, `onDismiss()` clears the approval state and the side panel returns to rendering `<HomePage />`. However, `dismissApproval()` doesn't distinguish approve from deny, and HomePage receives no signal to refresh balances. The `refresh()` function (from `useBalance`) lives inside HomePage and is only triggered by: the native send flow (`handleSendSuccess`), manual refresh button, or `useRefreshOnFocus` (visibility change). None of these cover the dApp approval path.

**Current call chain:**
1. `DAppTransactionApprovalPage.handleApprove()` → signs/sends tx → calls `onDismiss()`
2. `App.tsx.dismissApproval()` → clears pending states, pops storage queue
3. App.tsx renders `<HomePage onAddAccount={...} />` — no refresh signal

## Goals / Non-Goals

**Goals:**
- Trigger `refresh()` in HomePage after a successful dApp transaction approval so skeletons appear and balances/tokens reload
- Preserve existing behavior: deny and connect should NOT trigger refresh
- Minimal change surface — reuse existing `refresh()` from `useBalance`, no new hooks or shared code

**Non-Goals:**
- Changing the dApp communication protocol (background ↔ content script)
- Adding refresh logic to mobile (mobile doesn't have dApp browser yet)
- Modifying `useBalance` or `useRefreshOnFocus` hooks

## Decisions

### 1. Signal mechanism: `refreshKey` counter prop on HomePage

**Choice:** Add a `refreshKey?: number` prop to HomePage. App.tsx increments it when a dApp approval succeeds. HomePage runs a `useEffect` on `refreshKey` to call `refresh()`.

**Why over alternatives:**
- **vs. boolean flag (`needsRefresh`):** A boolean requires coordinated reset (set true → HomePage reads → resets to false). A counter naturally handles rapid successive approvals without race conditions.
- **vs. callback prop (`onMounted`):** Would require HomePage to expose its internal `refresh` upward, inverting the dependency.
- **vs. chrome.storage event:** Over-engineered — this is a simple parent-child prop flow within the same React tree.
- **vs. React key remount (`key={refreshKey}`):** Would unmount/remount entire HomePage, losing scroll position and all local state. Too destructive.

### 2. Extend `onDismiss` signature to `(approved: boolean) => void`

**Choice:** The approval pages pass `true` on successful approval, `false` on deny or error. App.tsx uses this to decide whether to increment `refreshKey`.

**Why:** Clean separation — the approval page knows the outcome, App.tsx knows what to do with it. No coupling between the approval page and HomePage's refresh mechanism.

### 3. DAppConnectPage unchanged

**Choice:** `DAppConnectPage` keeps `onDismiss: () => void` (no boolean). Connecting doesn't change balances.

## Risks / Trade-offs

- **[Risk] signMessage approval triggers unnecessary refresh** → Acceptable trade-off. A `signMessage` doesn't change on-chain state, but it's a rare enough operation that a spurious refresh is harmless and simpler than filtering by method type. If needed later, the boolean can be made more granular.
- **[Risk] Multiple rapid approvals (queued)** → The counter increments per approval. Each `useEffect` trigger calls `refresh()`, which internally debounces via cache TTL checks. No risk of flooding.

## Files to modify

| File | Change |
|------|--------|
| `apps/extension/src/pages/dapp/DAppTransactionApprovalPage.tsx` | `onDismiss: (approved: boolean) => void`, pass `true`/`false` |
| `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx` | Same as above |
| `apps/extension/src/entrypoints/popup/App.tsx` | Add `refreshKey` state, create wrapper callback, pass to HomePage |
| `apps/extension/src/pages/home/HomePage.tsx` | Add `refreshKey` prop, useEffect to call `refresh()` |
