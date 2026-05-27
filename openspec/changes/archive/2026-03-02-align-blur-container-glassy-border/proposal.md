## Why

The BlurContainer component's border does not match the Figma design. Figma specifies a **radial gradient stroke** ("Glassy_BORDER" style, 0.75px inside, radial gradient) but the current implementation uses a flat solid border (`#404962`, 1px). The blur intensity and background opacity were also misaligned on web (already fixed). Mobile blur defaults need the same alignment pass.

## What Changes

- **Shared types**: Update `BlurContainerPropsBase` in `packages/shared/src/types/ui/blur-container.ts` to support gradient border configuration alongside the existing solid border props (backward compatible).
- **Shared theme**: Add gradient border constants (colors, stops) to `packages/shared/src/theme/` so both platforms reference the same design tokens.
- **Web BlurContainer**: Replace the solid CSS `border` with a `::before` pseudo-element using `radial-gradient` + `mask-composite: exclude` to render the gradient border with `border-radius` support. Technique chosen because `border-image` doesn't work with `border-radius` and `background-clip` doesn't work with transparent/blur backgrounds.
- **Mobile BlurContainer**: Add an SVG overlay using `react-native-svg` (already installed) with `<RadialGradient>` as stroke on a `<Rect>` to render the gradient border. Uses `onLayout` for dynamic sizing.
- **Mobile blur defaults**: Align `blurIntensity` default with Figma's Blur/100 token (currently 8, Figma suggests 4).

## Capabilities

### New Capabilities
- `glassy-border`: Radial gradient border rendering for BlurContainer across web (CSS mask-composite) and mobile (react-native-svg), matching the Figma "Glassy_BORDER" design token.

### Modified Capabilities
- `shared-ui-package`: BlurContainer props interface extends to support gradient border configuration.

## Impact

- **Packages affected**: `packages/shared` (types + theme), `packages/ui` (web BlurContainer), `apps/mobile` (mobile BlurContainer)
- **No new dependencies**: Web uses native CSS, mobile uses already-installed `react-native-svg`
- **Backward compatible**: Existing `borderColor`/`borderWidth` props remain functional; gradient border is the new default
- **Apps consuming BlurContainer**: Extension, web app, and mobile app all get the updated border automatically
