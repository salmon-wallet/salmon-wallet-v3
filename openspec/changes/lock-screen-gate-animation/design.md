## Context

Currently:
- `LockScreenOverlay` is an absolute-positioned view with `zIndex: 1000` that slides from `-screenHeight` to `0` (lock) and `0` to `-screenHeight` (unlock). Duration 800ms.
- `TopSheet` is a separate absolute-positioned view with `zIndex: 1000` that slides from `-sheetHeight` to `0` (open) and back (close). Duration 300ms. Uses scales background + `colors.background.primary`.
- `WalletHeader` is a third absolute-positioned component showing account name, address, copy button, settings button. It sits at the top always visible.
- These three are siblings in `_layout.tsx`.

The "gate" concept means the lock screen and TopSheet behave as one surface:
- **Locked state**: Gate is fully expanded (full screen), showing logo + "Welcome back"
- **Collapsed state**: Gate is at the top, showing only WalletHeader (account info + settings)
- **TopSheet open**: Gate is partially expanded (70% of screen), showing settings content

## Goals / Non-Goals

**Goals:**
- Lock screen appears instantly when `locked` becomes true (no animation in)
- Unlock slides the gate up from full screen to the WalletHeader position, then fades in header elements
- TopSheet open/close starts from the WalletHeader position (not off-screen)
- Visually continuous surface between lock screen and TopSheet (same background, same scales)

**Non-Goals:**
- Merging LockScreenOverlay and TopSheet into a single component (too risky, keep separate but coordinated)
- Changing the TopSheet content (settings panels, wallet switcher)
- Changing the WalletHeader layout or content
- Affecting extension or web

## Decisions

### D1: Keep LockScreenOverlay and TopSheet as separate components, coordinate via animation

Merging them into one component would require massive refactoring of state management, panel stacks, biometric flow, etc. Instead:
- LockScreenOverlay handles the lock→unlock transition (full screen → header height)
- TopSheet handles the settings/wallet transitions (header height → expanded)
- Both share the same visual styling (background color, scales pattern)

### D2: Lock screen animation changes

**Lock (appear):** No animation. `translateY` starts at `0` immediately. The gate is just there.

**Unlock (slide up):** `translateY` animates from `0` to `-(screenHeight - headerHeight)` where `headerHeight = insets.top + componentSizes.headerHeight`. This positions the bottom edge of the lock screen at the top of the content area, visually matching where the WalletHeader sits. Duration: 600ms with cubic easing.

After the slide completes, call `onAnimationComplete` so the parent knows the unlock is done. The WalletHeader fades in its elements with a 200ms delay after the slide.

### D3: WalletHeader fade-in on unlock

The `WalletHeader` receives an `animateIn` prop (boolean). When true, its content (account pill, settings button) animates from `opacity: 0` to `opacity: 1` with a 200ms duration. This creates the "gate stops, then header elements appear" effect.

The `_layout.tsx` sets `animateIn` to `true` after `onAnimationComplete` fires from the lock screen, and resets it when locking.

### D4: TopSheet already works from the correct position

The TopSheet slides from `-maxSheetHeight` (off the top of the screen) to `0`. This already creates a "sliding down from the top" effect. No change needed — it already looks like the gate expanding down. The shared background color and scales pattern create visual continuity.

## Risks / Trade-offs

- **[Risk] Animation timing feels disjointed** — The lock screen slides up 600ms, then header fades in 200ms = 800ms total. If it feels sluggish, reduce the slide to 500ms. → Mitigation: values are constants, easy to tune.
- **[Risk] WalletHeader flash** — The header is always rendered but during lock it's behind the lock screen. When the lock screen slides up past the header position, there could be a flash of the header before the fade-in completes. → Mitigation: Keep WalletHeader opacity at 0 while locked, only animate to 1 after unlock completes.
- **[Trade-off] Not a single component** — The gate metaphor would be purest as one component, but the complexity cost is too high. Coordinating two components via props achieves 95% of the UX goal.
