## Why

The web app renders all UI components enormously because the responsive scaling functions (`s`, `vs`, `ms` in `packages/shared/src/utils/scaling.ts`) use `window.innerWidth` as the reference dimension. On a typical 1440px-wide browser window, the scale factor becomes `1440 / 440 = 3.27x`, making a 60px balance font render at ~128px, a 38px token icon at ~124px, etc. In the extension popup (~360px), the same functions produce a ~0.82x factor that *shrinks* elements slightly — the exact opposite effect.

Additionally, `WalletLayout` defaults to `maxWidth: 500px`, which is wider than the extension popup (~360px), contributing to the oversized appearance.

## What Changes

- Cap the web scaling functions to use a fixed reference width matching the wallet container instead of the full browser `window.innerWidth`
- Reduce `WalletLayout` default `maxWidth` from 500px to 375px to match a standard mobile viewport width
- Ensure components in `packages/ui` render at the same visual scale in both extension and web

## Capabilities

### New Capabilities
- `web-scaling-cap`: Cap responsive scaling dimensions for web/extension contexts so components render at design-appropriate sizes regardless of browser window width

### Modified Capabilities
_None — no existing spec-level behavior changes._

## Impact

- `packages/shared/src/utils/scaling.ts` — Core change: cap dimensions used for scaling calculations
- `packages/ui/src/layouts/WalletLayout.tsx` — Reduce default maxWidth from 500 to 375
- `apps/web` — Visual fix, no code changes needed in web app itself
- `apps/extension` — Must verify extension still renders correctly (scaling was already working there by coincidence of popup width)
- `apps/mobile` — NOT affected (uses `scaling.native.ts` which reads from React Native Dimensions)
