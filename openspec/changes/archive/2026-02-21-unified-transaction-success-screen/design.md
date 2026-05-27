## Context

The wallet has two transaction flows — send and swap — with inconsistent post-confirmation UX:

- **Swap**: Has a `SwapSuccessScreen` (mobile + extension) with animated checkmark and "Continue" button, but no txId display and no explorer link.
- **Send**: Has **no success screen at all**. After `useSendTransaction` completes, `handleSuccess` immediately closes the sheet/page and navigates home. The `txId` is received but discarded.

Both flows already produce a `txId` on success. The explorer infrastructure (`getTransactionUrl` in `packages/shared/src/config/explorers.ts`) already supports all three blockchains. The gap is purely in the UI layer.

**Current flow (send):**
`StepConfirmation → onSuccess(txId) → close sheet → home` (no feedback)

**Target flow (send + swap):**
`StepConfirmation/Review → onSuccess(txId) → TransactionSuccessScreen → user taps Continue → home`

## Goals / Non-Goals

**Goals:**
- Single `TransactionSuccessScreen` component per platform (mobile + extension) that serves both send and swap
- Show transaction ID and "View on Explorer" link using existing `getTransactionUrl`
- Add `'success'` step to `SendStep` type so send flow can render the success screen
- Maintain existing animation quality (spring scale, staggered fades, haptics on mobile)
- i18n for all user-visible strings

**Non-Goals:**
- Error/failure screen redesign (out of scope — current inline error + retry is unchanged)
- Transaction status polling or real-time confirmation tracking
- Customizable explorer selection (uses default explorer per blockchain)
- Adding explorer link to transaction history or other existing screens

## Decisions

### 1. Single generic component vs. separate per-flow components

**Decision:** Single `TransactionSuccessScreen` with flexible props.

**Rationale:** The swap and send success screens are visually identical — green checkmark, title, summary, explorer link, continue button. The only difference is the summary text content. A single component with a `title` and `summary` string prop avoids code duplication while keeping the component simple.

**Alternative considered:** Keeping separate `SwapSuccessScreen` and creating a new `SendSuccessScreen`. Rejected because they'd be 95% identical code.

### 2. Component location

**Decision:** Create `TransactionSuccessScreen/` as a standalone shared-concept component in each app:
- `apps/mobile/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`
- `apps/extension/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`

**Rationale:** Components are platform-specific per project rules. Each platform uses different animation systems (react-native-reanimated vs CSS keyframes) and UI frameworks (RN StyleSheet vs MUI styled). The shared props type lives in `packages/shared`.

### 3. Props interface design

**Decision:** Generic props — the parent composes the summary string:

```typescript
interface TransactionSuccessScreenProps {
  title: string;              // i18n'd "Send Complete" / "Swap Complete"
  summary: string;            // Pre-formatted: "5.0 SOL → 84.65 USDC" or "5.0 SOL to 7hQ9...xK2f"
  explorerUrl: string | null; // Pre-built URL from getTransactionUrl, null if unavailable
  onContinue: () => void;     // Navigate home
}
```

**Rationale:** The component doesn't need to know about blockchain, txId, or flow type. The parent builds the explorer URL using existing `getTransactionUrl` and formats the summary. This keeps the component pure presentational.

### 4. Explorer URL handling

**Decision:** Parent components build the URL using `getTransactionUrl(blockchain, environment, defaultExplorer, txId)` and pass it as a prop. The success screen opens it via `Linking.openURL` (mobile) / `window.open` (extension).

**Rationale:** Reuses existing `config/explorers.ts` infrastructure. No new utility needed. The parent already has blockchain context.

### 5. Send flow integration

**Decision:** Add `'success'` to `SendStep` union type. Store `txId` in component state when transaction succeeds. Render `TransactionSuccessScreen` when `step === 'success'` instead of closing immediately.

**Existing type change:**
```typescript
// packages/shared/src/types/ui/send-sheet.ts
export type SendStep = 'token-select' | 'address-amount' | 'confirmation' | 'success';
```

**Flow change in SendSheet/SendPage:**
- `handleSuccess(txId)` → sets `txId` state + `setStep('success')` (instead of closing)
- `handleSuccessContinue()` → calls `onSuccess(txId)` + closes/navigates home

### 6. Swap flow refactor

**Decision:** Replace `SwapSuccessScreen` imports with `TransactionSuccessScreen`. The swap parent (`SwapScreen`) builds the summary string (`"5.0 SOL → 84.65 USDC"`) and passes it. Delete `SwapSuccessScreen` files after migration.

**Requires:** `useSwapScreenLogic` must expose `txId` — currently it calls `onSuccess(txId)` but doesn't store it. Add a `successTxId` state to the hook.

## Risks / Trade-offs

- **[Risk] Breaking swap flow during refactor** → Mitigation: The `TransactionSuccessScreen` interface is a superset of `SwapSuccessScreen` (adds explorerUrl). Swap integration is a drop-in replacement with minimal prop changes.

- **[Risk] Explorer URL null for some chains/networks** → Mitigation: The "View on Explorer" link is conditionally rendered — only shown when `explorerUrl` is non-null. `getTransactionUrl` already returns `null` gracefully for unknown combos.

- **[Trade-off] Summary string composition in parent vs. in component** → Chose parent-side composition for simplicity. Trade-off is that each parent formats its own summary string, but this is a single line of template literal code and avoids the component needing to understand flow-specific data structures.
