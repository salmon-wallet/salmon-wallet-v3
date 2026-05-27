## Tasks

### Task 1: Add explicit flex to TokenListItem value containers

**File:** `apps/extension/src/components/TokenList/TokenListItem.tsx`

Add `display: 'flex'` and `flexDirection: 'column'` to:
- `ValueContainer` (approx line 190) — already has `alignItems: 'flex-end'`, `textAlign: 'right'`, `gap`
- `BitcoinAmountContainer` (approx line 91) — already has `alignItems: 'flex-end'`, `textAlign: 'right'`

Also fix `SkeletonValueContainer` in the same file or in `TokenList.tsx` if it exists separately — same pattern: add `display: 'flex'`, `flexDirection: 'column'`.

**Verify:** Token prices ($4.88, $7.27) render right-aligned in both Chrome and Firefox.

---

### Task 2: Add textAlign center to HomePage TabButton

**File:** `apps/extension/src/pages/home/HomePage.tsx`

Add `textAlign: 'center'` to the `TabButton` styled component (approx line 256).

**Verify:** "Home", "Collectibles", "Swap" tab labels are centered in both Chrome and Firefox.

---

### Task 3: Add textAlign center to LockPage ForgotPasswordButton

**File:** `apps/extension/src/pages/lock/LockPage.tsx`

Add `textAlign: 'center'` to the `ForgotPasswordButton` styled component (approx line 115).

**Verify:** "I forgot my password" text is centered in both Chrome and Firefox.

---

### Task 4: Build and verify both browsers

Run `pnpm wxt build -b firefox` and `pnpm wxt build -b chrome` to confirm both builds succeed with no errors. Visually verify alignment in Firefox sidebar matches Chrome sidePanel.
