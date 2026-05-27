## Why

After approving a dApp transaction (e.g., a Jupiter swap) in the extension side panel, the wallet returns to the home page but never refreshes the token list or balance. The user sees stale data until the 60s cache expires or they manually refresh. The `dismissApproval()` callback doesn't distinguish between approve and deny, and HomePage receives no signal to call `refresh()`.

## What Changes

- Extend `onDismiss` callback in `DAppTransactionApprovalPage` and `DAppSignMessageApprovalPage` to accept an `approved` boolean parameter indicating whether the user approved or denied the request.
- Add a refresh signal mechanism in `App.tsx` (popup entry) that tracks when a dApp transaction was approved, and passes that signal to `HomePage`.
- `HomePage` triggers `refresh()` (which activates skeletons and reloads tokens/balance) when it receives the dApp-approved signal.
- Connect approval (`DAppConnectPage`) is unaffected — connecting to a dApp doesn't change balances.

## Capabilities

### New Capabilities

_None — this change extends an existing capability._

### Modified Capabilities

- `balance-refresh-on-focus`: Adding a new trigger — balance SHALL also refresh after a dApp transaction is approved in the extension side panel, not only on focus/send/manual refresh.

## Impact

- **Extension only** — `apps/extension/` (popup App.tsx, HomePage, DAppTransactionApprovalPage, DAppSignMessageApprovalPage). No mobile or shared package changes needed.
- No new dependencies.
- No breaking changes to existing dApp communication protocol — only the internal `onDismiss` callback signature changes within the extension.
