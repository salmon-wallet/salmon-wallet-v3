## Context

BlurContainer renders a glassmorphism card used across mobile, extension, and web. The current border is a flat solid color (`#404962`, 1px). Figma specifies a **radial gradient stroke** ("Glassy_BORDER" style) at 0.75px inside, which creates a subtle luminous edge that fades from visible to transparent. Web blur/background defaults were already corrected (2px blur, 10% opacity). Mobile background is already correct (`colors.background.tokenItem`).

Existing gradient pattern in the codebase: `packages/shared/src/theme/colors.ts` already defines `gradients` with both RN-compatible (`colors`/`start`/`end`) and CSS (`*CSS`) formats. The glassy border gradient follows the same dual-format pattern.

## Goals / Non-Goals

**Goals:**
- Match Figma's "Glassy_BORDER" radial gradient stroke on both web and mobile
- Add gradient border tokens to `packages/shared/src/theme/colors.ts` following existing `gradients` pattern
- Update `BlurContainerPropsBase` to support gradient border mode as the default
- Keep backward compatibility: consumers passing `borderColor`/`borderWidth` still work (solid fallback)

**Non-Goals:**
- Making a generic `<GradientBorder>` component — this is specific to BlurContainer
- Supporting linear gradient borders — only radial as per Figma
- Changing BlurContainer's layout, padding, or children behavior
- Android blur improvements (stays as solid background fallback)

## Decisions

### 1. Gradient border tokens in shared theme

**Decision:** Add a `glassyBorder` entry to the `gradients` object in `packages/shared/src/theme/colors.ts`.

**Format:**
```ts
glassyBorder: {
  // For react-native-svg RadialGradient
  stops: [
    { offset: 0, color: 'rgba(255, 255, 255, 0.25)', opacity: 1 },
    { offset: 1, color: 'rgba(255, 255, 255, 0)', opacity: 1 },
  ],
  // For CSS radial-gradient()
  css: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)',
  width: 0.75,
}
```

**Why:** Keeps both platforms reading from the same source of truth. Follows the existing pattern where RN and CSS gradient formats coexist in the same token object.

**Alternative considered:** Separate `border.gradient` in `colors` object — rejected because gradients already have their own section and this is a gradient definition, not a flat color.

### 2. Web: Pseudo-element with mask-composite

**Decision:** Replace the solid `border` on `BlurBox` with a `::before` pseudo-element that renders the radial gradient, masked to only show the border ring.

**Technique:**
```css
&::before {
  content: '""';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 0.75px;              /* border width */
  background: radial-gradient(...);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

**Why over alternatives:**
- `border-image` with gradient: **doesn't work with `border-radius`** — disqualified
- `background-clip: padding-box/border-box`: requires **opaque background** on inner layer — breaks glassmorphism transparency
- Pseudo-element + mask: **works with any background** including `backdrop-filter: blur()`, supports `border-radius` via `inherit`, and the `padding` controls exact sub-pixel width

**Browser support:** `mask-composite: exclude` is supported in Chrome 120+, Firefox 53+, Safari 15.4+. Both `-webkit-mask-composite: xor` (Safari) and `mask-composite: exclude` (standard) are included for full coverage. Extension targets Chrome/Firefox; web app targets modern browsers. No issues.

**Note:** The existing `::before` pseudo-element (tint overlay) will be repurposed. The tint overlay and gradient border can coexist by moving the tint to `::after` or merging them. Since the tint overlay adds a barely-visible color tint (`rgba(0,0,0,0.08)`), the simplest approach is to **remove the tint overlay** (it was compensating for differences between CSS and native blur — with the corrected blur values this compensation is unnecessary) and use `::before` exclusively for the gradient border.

### 3. Mobile: SVG overlay with react-native-svg

**Decision:** Add an absolutely-positioned `<Svg>` with a `<RadialGradient>` stroke on a `<Rect>` inside BlurContainer.

**Approach:**
- Use `onLayout` to capture dynamic `width`/`height`
- Render `<Svg>` with `pointerEvents="none"` as an overlay
- `<Rect>` with `fill="none"`, `stroke="url(#glassy-border)"`, `strokeWidth={0.75}`
- `<RadialGradient>` with stops from shared tokens
- Unique gradient `id` per instance via `useId()`

**Why over alternatives:**
- `@shopify/react-native-skia`: adds 4-8 MB to bundle, overkill for a 0.75px border
- `expo-linear-gradient` with MaskedView: no radial gradient support
- `react-native-svg`: already installed (~15.12.1), zero bundle cost, native SVG rendering

**Android:** SVG overlay works on Android too. Even though Android BlurContainer falls back to a solid background (no blur), it still gets the gradient border via SVG.

### 4. Props interface update

**Decision:** Add a `useGradientBorder` boolean prop (default `true`) to `BlurContainerPropsBase`. When `true`, the component renders the gradient border from theme tokens. When `false`, falls back to the existing solid `borderColor`/`borderWidth` props.

**Why a boolean over gradient config props:** The gradient is a fixed design token ("Glassy_BORDER"). There's no use case for per-instance gradient customization. A simple toggle keeps the API clean. If future designs need different gradients, the token can be updated centrally.

### 5. Mobile blur intensity

**Decision:** Lower mobile default `blurIntensity` from `8` to `4` to align with Figma's `Blur/100 = 4` token.

**Note:** expo-blur's intensity scale (0-100) is not directly comparable to CSS `backdrop-filter: blur(Npx)`. The value `4` on expo-blur produces a very subtle blur, consistent with the 2px CSS blur we set for web. Both produce a light frosted glass effect.

## Risks / Trade-offs

- **[Sub-pixel rendering]** 0.75px borders may render inconsistently across displays/DPIs. → On retina displays (2x+) this maps to 1.5 physical pixels which renders cleanly. On 1x displays it rounds to 1px. Acceptable trade-off.
- **[SVG onLayout flash]** Mobile: first render has no SVG border until `onLayout` fires. → The delay is a single frame (16ms). Imperceptible. Could initialize with `{width: 0, height: 0}` and skip SVG render until measured.
- **[Tint overlay removal on web]** Removing the `::before` tint overlay changes the visual slightly. → The tint was added to compensate for the old 12px/20% values. With corrected 2px/10% values, the tint is no longer needed. Visual difference is negligible.
- **[Unique SVG gradient IDs]** Multiple BlurContainers on the same screen need unique gradient IDs. → Use React 18's `useId()` hook (available in Expo SDK 54 / React 19).
