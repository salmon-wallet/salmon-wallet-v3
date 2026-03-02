## Context

The responsive scaling system (`s`, `vs`, `ms`, `mvs`) was designed for React Native where `Dimensions.get('window')` returns the device screen size — typically 375–440px wide. The web implementation (`scaling.ts`) mirrors this by reading `window.innerWidth`, which on a desktop browser is typically 1440px+. This produces a scale factor of ~3.27x (1440/440), making every dimension balloon to ~3x its intended size.

The extension popup works by coincidence: Chrome's popup viewport is ~360px, so `window.innerWidth` returns ~360px → scale factor ~0.82x, which is reasonable.

**Current scaling math (1440px browser window):**
- `s(38)` (token icon) = `(1440/440) * 38` = **124px** (intended: ~31px)
- `ms(60)` (balance font) = `60 + (196 - 60) * 0.5` = **128px** (intended: ~55px)
- `vs(12)` (padding) = `(900/956) * 12` = **11px** (roughly correct by coincidence)

## Goals / Non-Goals

**Goals:**
- Components in `packages/ui` render at visually identical sizes in both extension and web
- Fix requires minimal changes — cap the scaling input, don't rewrite components
- Mobile (`scaling.native.ts`) remains completely unaffected

**Non-Goals:**
- Making components truly responsive to arbitrary viewport widths (that's a larger redesign)
- Changing any component pixel values or theme tokens
- Adding CSS media queries or breakpoint-based responsive behavior

## Decisions

### D1: Cap `getDimensions()` width/height to fixed max values

Modify `scaling.ts` `getDimensions()` to cap the width and height to values that match the intended wallet container:

```typescript
const MAX_SCALING_WIDTH = 440;   // DESIGN_WIDTH — never scale UP
const MAX_SCALING_HEIGHT = 956;  // DESIGN_HEIGHT — never scale UP

const getDimensions = (): { width: number; height: number } => {
  if (_width !== null && _height !== null) {
    return { width: _width, height: _height };
  }
  if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
    _width = Math.min(window.innerWidth, MAX_SCALING_WIDTH);
    _height = Math.min(window.innerHeight, MAX_SCALING_HEIGHT);
    return { width: _width, height: _height };
  }
  return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
};
```

**Rationale:** Capping at DESIGN_WIDTH (440) means the scale factor can never exceed 1.0. On the extension popup at 360px, the factor is 360/440 = 0.82x (unchanged). On a 1440px browser, the factor becomes 440/440 = 1.0x (identity). This means web components render at the raw design-spec pixel values — which look correct in a 375px container.

**Why not cap at 375?** That would unnecessarily shrink elements on the extension sidepanel (which can be wider than the popup). Capping at 440 is safe: it means "never scale up, only scale down for smaller viewports."

### D2: Reduce WalletLayout default maxWidth from 500 to 375

Change the default in `WalletLayout.tsx` from `maxWidth = 500` to `maxWidth = 375`.

**Rationale:** 375px matches the iPhone SE/mini viewport width and is close to the extension popup (~360px). At this width, components render at nearly identical proportions to the extension. The 500px default was too wide — components designed for ~360px looked stretched and disproportionate.

### D3: No changes to `scaling.native.ts`

The React Native version reads from `Dimensions.get('window')` which returns actual device dimensions. Mobile scaling works correctly and must not be touched.

## Risks / Trade-offs

- **Risk:** Extension sidepanel (which can be wider than 360px) will now scale up to 1.0x max instead of beyond. This is actually desirable — elements should not grow larger than their design-spec size.
- **Trade-off:** Web components render at 1:1 design pixels (since scale = 1.0x at 440px cap). If the WalletLayout is 375px, some elements may appear slightly large relative to the container. This is acceptable — the extension at 360px also has elements at ~0.82x scale. The visual result is very similar.
- **Low risk:** The cached `_width`/`_height` in `scaling.ts` means the cap is applied once on first render. If the user resizes the browser, the cached value persists — but since the cap is at 440px and the wallet container is 375px, resize behavior is irrelevant.
