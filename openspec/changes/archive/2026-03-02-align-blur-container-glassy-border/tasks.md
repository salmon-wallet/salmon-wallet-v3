## 1. Shared: Theme tokens & types

- [x] 1.1 Add `glassyBorder` entry to `gradients` in `packages/shared/src/theme/colors.ts` with `stops` (array of `{offset, color, opacity}`), `css` (radial-gradient string), and `width: 0.75`
- [x] 1.2 Add `useGradientBorder?: boolean` prop to `BlurContainerPropsBase` in `packages/shared/src/types/ui/blur-container.ts` with JSDoc default `true`

## 2. Web: BlurContainer gradient border

- [x] 2.1 Remove `getTintColor()` function and the tint-related `$tintColor` prop from `BlurBox` in `packages/ui/src/components/BlurContainer/BlurContainer.tsx`
- [x] 2.2 Remove solid `borderColor`, `borderWidth`, `borderStyle` from `BlurBox` base styles when gradient mode is active
- [x] 2.3 Replace `::before` tint overlay with gradient border pseudo-element: `background` from `gradients.glassyBorder.css`, `padding: 0.75px`, `border-radius: inherit`, `mask` with `content-box` + `mask-composite: exclude` / `-webkit-mask-composite: xor`, `pointer-events: none`
- [x] 2.4 Implement `useGradientBorder` prop: when `false`, fall back to solid `borderColor`/`borderWidth`; when `true` (default), render the gradient pseudo-element
- [x] 2.5 Update `BlurContainerProps` in `packages/ui/src/components/BlurContainer/types.ts` to include `useGradientBorder` from the updated base interface

## 3. Mobile: BlurContainer gradient border & blur fix

- [x] 3.1 Change default `blurIntensity` from `8` to `4` in `apps/mobile/src/components/BlurContainer/BlurContainer.tsx`
- [x] 3.2 Add `onLayout` handler to capture container `width`/`height` via `useState`
- [x] 3.3 Add SVG gradient border overlay: absolutely-positioned `<Svg>` with `pointerEvents="none"`, `<Defs>` containing `<RadialGradient>` with stops from `gradients.glassyBorder.stops`, and `<Rect>` with `fill="none"`, `stroke="url(#...)"`, `strokeWidth={gradients.glassyBorder.width}`, matching `borderRadius` from style prop
- [x] 3.4 Use `useId()` to generate unique gradient `id` per BlurContainer instance
- [x] 3.5 Implement `useGradientBorder` prop: when `false`, keep solid border; when `true` (default), render SVG overlay and remove solid `borderColor`/`borderWidth` from the View/BlurView style
- [x] 3.6 Update `BlurContainerProps` in `apps/mobile/src/components/BlurContainer/types.ts` to include `useGradientBorder` from the updated base interface

## 4. Validation

- [x] 4.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and verify no type errors
- [ ] 4.2 Visually verify web gradient border in extension or web app dev server
- [ ] 4.3 Visually verify mobile gradient border on iOS simulator
