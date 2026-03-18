## Why

The lock screen, wallet header, and settings/wallet-switcher sheets are conceptually the same surface — a "gate" that slides from full screen (locked) to a collapsed header bar (unlocked) to an expanded panel (settings/wallets). Currently they're three independent components with separate animations, creating visual discontinuity: the lock screen slides up and disappears, then the header fades in as a separate element. Unifying them into a single animated surface creates the seamless "gate/curtain" UX.

## What Changes

- **Create `GateContainer`** — A single animated container component that manages one `translateY` shared value and renders different content based on state (`locked`, `collapsed`, `settings`, `wallets`). It owns the surface (background, scales pattern, shadow) and the animation, but NOT the content logic.
- **Extract `LockContent`** — The lock screen's content (logo, welcome, password input, biometric flow) moves into a pure content component rendered inside GateContainer.
- **Extract `HeaderContent`** — The WalletHeader's content (avatar, name, address, copy, settings button) moves into a pure content component rendered inside GateContainer when collapsed.
- **Move lock logic to tabs layout** — The LockScreenOverlay currently lives in root `_layout.tsx`. Since it only shows when `hasAccounts && !inAuthGroup` (i.e. inside tabs), it can move to `(tabs)/_layout.tsx` where all the context (accounts, settings, biometric) already exists.
- **SettingsSheet and WalletSwitcherSheet** become children of GateContainer in expanded state, replacing their own TopSheet wrapper.
- **Remove standalone components** — `LockScreenOverlay`, `WalletHeader`, and `TopSheet` are no longer needed as separate components (TopSheet may stay if used elsewhere, but SettingsSheet/WalletSwitcherSheet stop using it).

## Capabilities

### New Capabilities
- `gate-container`: Unified animated surface with states (locked/collapsed/expanded), single translateY animation, conditional content rendering

### Modified Capabilities
_None — internal mobile refactor, no spec-level behavior changes_

## Impact

- **`apps/mobile/src/components/GateContainer/`** — New component (~250 lines)
- **`apps/mobile/src/components/LockContent/`** — Extracted from LockScreenOverlay (content only, no animation)
- **`apps/mobile/src/components/HeaderContent/`** — Extracted from WalletHeader (content only, no positioning)
- **`apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx`** — Remove TopSheet wrapper, receive GateContainer state
- **`apps/mobile/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx`** — Same as above
- **`apps/mobile/app/(app)/(tabs)/_layout.tsx`** — Orchestrate GateContainer with all states
- **`apps/mobile/app/_layout.tsx`** — Remove LockScreenOverlay, keep AppState lock trigger
- Mobile-only — no extension/web/shared changes
