## Why

The lock screen and TopSheet (settings/wallet switcher) are conceptually the same surface — a "gate" that covers the app. Currently the lock screen slides down on lock (wrong — it should appear instantly) and slides up on unlock, but has no visual connection to the TopSheet. The TopSheet slides down independently. Unifying them creates a cohesive "gate/curtain" metaphor: the surface is always present at the top (collapsed = WalletHeader bar), expands to full screen when locked, and slides down to reveal settings/wallet switching.

## What Changes

- **Lock screen appears instantly** (no slide-down animation on lock). It's simply already there covering the screen.
- **Unlock animation** slides the lock screen UP to the TopSheet's collapsed position (WalletHeader height), then fades in the header elements (account selector, settings button).
- **TopSheet open** slides the gate DOWN from the collapsed header position to reveal settings/wallet content — same surface, same animation direction as locking.
- **TopSheet close** slides the gate UP back to the collapsed header position, with fade-in of header elements — same animation as unlocking.
- The LockScreenOverlay and TopSheet share the same visual surface (background, scales pattern) to reinforce that they're the same "gate."

## Capabilities

### New Capabilities
- `gate-animation`: Defines the unified gate/curtain animation system — lock screen instant appear, unlock slide-up with header fade-in, TopSheet slide-down/up sharing the same surface

### Modified Capabilities
_None_

## Impact

- **`apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx`** — Remove slide-down animation on lock (instant appear). Change unlock animation to slide up to header height instead of off-screen. Add fade-in callback for header elements.
- **`apps/mobile/src/components/TopSheet/TopSheet.tsx`** — Adjust animation to start from collapsed header position. Add fade-in for header content on close.
- **`apps/mobile/app/(app)/(tabs)/_layout.tsx`** — Coordinate LockScreenOverlay and TopSheet as the same conceptual surface. Pass header height for animation targets.
- Mobile-only change — no extension/web impact.
