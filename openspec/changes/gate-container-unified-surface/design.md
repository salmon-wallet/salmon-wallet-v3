## Context

Three components currently handle the top surface:

1. **LockScreenOverlay** (`app/_layout.tsx`) — Full-screen overlay with `zIndex: 1000`, `position: absolute`. Has its own `translateY` animation (instant appear, slide up on unlock). Contains: logo, welcome text, password input, biometric logic, forgot password.

2. **WalletHeader** (`(tabs)/_layout.tsx`) — Sticky header with `zIndex: 10`, `position: absolute top:0`. Contains: avatar, account name+address, copy button, settings button. Has `animateIn` prop for fade-in after unlock.

3. **TopSheet** (used by SettingsSheet and WalletSwitcherSheet) — Full-screen overlay with `zIndex: 1000`. Its own `translateY` from `-sheetHeight` to `0`. Contains: backdrop, header with title/back/close, content area, handle. Used as wrapper by SettingsSheet and WalletSwitcherSheet.

All three share the same visual language: dark background, scales pattern.

## Goals / Non-Goals

**Goals:**
- One animated surface (one `translateY`) for all three states
- Seamless visual transition: locked → collapsed (header) → expanded (settings/wallets)
- Lock screen appears instantly (no animation in)
- Unlock slides up to header position, then content fades in
- Opening settings/wallets slides down from header position
- Closing settings/wallets slides up to header position
- All existing functionality preserved (biometric, password, settings panels, wallet switching)

**Non-Goals:**
- Changing any business logic (biometric flow, settings panels, wallet switching)
- Affecting web or extension
- Changing the visual design of any content
- Modifying the AppState lock trigger (stays in root layout)

## Decisions

### D1: GateContainer owns animation, not content

```
GateContainer
├── Props: state, screenHeight, headerHeight, onStateChange
├── Owns: translateY, backdropOpacity, Animated.View, scales background
├── Renders children based on state
│
├── state='locked' → children[0] (LockContent)
│   translateY = 0 (full screen, instant)
│
├── state='collapsed' → children[1] (HeaderContent)
│   translateY = -(screenHeight - headerHeight)
│   content fades in after animation
│
├── state='settings' → children[2] (SettingsSheet content)
│   translateY = 0 (or partial, based on maxHeight)
│   backdrop visible
│
└── state='wallets' → children[3] (WalletSwitcherSheet content)
    translateY = 0 (or partial)
    backdrop visible
```

GateContainer is a "dumb" animation container. It doesn't import biometric hooks, account context, or settings logic. It receives a `state` prop and animates accordingly.

### D2: Content components are pure render

- **LockContent**: Receives `onUnlock`, `biometric`, etc. Renders logo, welcome, password input. No animation logic, no `Animated.View` wrapper.
- **HeaderContent**: Receives `accountName`, `address`, `onSettings`, `onWallets`, `onCopy`. Renders the header bar content. No positioning, no `position: absolute`.
- **SettingsSheet**: Drops its TopSheet wrapper. Renders its panel stack directly as a child of GateContainer.
- **WalletSwitcherSheet**: Same — drops TopSheet wrapper, renders account list directly.

### D3: GateContainer lives in tabs layout

The tabs `_layout.tsx` already has all the context needed (accounts, biometric, settings panels, etc.). The GateContainer replaces:
- The `WalletHeader` component
- The `SettingsSheet` + `TopSheet` wrapper
- The `WalletSwitcherSheet` + `TopSheet` wrapper

The root `_layout.tsx` keeps:
- Navigation logic (auth vs app routing)
- AppState listener (lock on background)
- No more LockScreenOverlay render

The `locked` state from `useAccountsContext` drives the GateContainer state in tabs layout.

### D4: Animation values

| Transition | translateY | Duration | Easing | Backdrop |
|---|---|---|---|---|
| → locked | instant 0 | 0ms | none | none |
| locked → collapsed | 0 → -(screenH - headerH) | 600ms | cubic out | none |
| collapsed → settings | -(screenH - headerH) → -(screenH - settingsH) | 300ms | cubic out | fade in |
| collapsed → wallets | same | 300ms | cubic out | fade in |
| settings → collapsed | reverse | 300ms | cubic in | fade out |
| wallets → collapsed | reverse | 300ms | cubic in | fade out |
| → locked (from any) | instant 0 | 0ms | none | instant hide |

`settingsH` = `screenHeight * 0.7` (current TopSheet maxHeightPercentage)

Content opacity:
- HeaderContent: opacity 0 when locked, animates to 1 (200ms) after collapsed animation completes
- Settings/Wallets content: immediate opacity 1 when state is settings/wallets

### D5: Backdrop handling

The backdrop (dark overlay behind the sheet) only appears in `settings` and `wallets` states. In `locked` state the gate covers the full screen so no backdrop needed. In `collapsed` state the gate is just the header bar, no backdrop.

The backdrop is a sibling `Animated.View` inside GateContainer with `pointerEvents` toggled.

## Risks / Trade-offs

- **[Risk] SettingsSheet header (title, back, close)** — Currently TopSheet renders the header. GateContainer needs to handle this for expanded states. → Mitigation: GateContainer renders a header area in expanded states, forwarding title/back/close props.
- **[Risk] TopSheet `fullHeight` mode** — Some uses may need full height. → Mitigation: GateContainer supports `maxHeightPercentage` per expanded state.
- **[Risk] Keyboard handling in lock content** — LockScreenOverlay uses `KeyboardAvoidingView`. → Mitigation: LockContent keeps its own KeyboardAvoidingView internally.
- **[Trade-off] TopSheet becomes unused** — If SettingsSheet and WalletSwitcherSheet were the only consumers, TopSheet can be removed. If other components use it, it stays but is no longer part of the gate system.
