## ADDED Requirements

### Requirement: Glassy border gradient token exists in shared theme
`packages/shared/src/theme/colors.ts` SHALL export a `glassyBorder` entry in the `gradients` object containing: an array of gradient stops (offset, color, opacity) for react-native-svg, a CSS `radial-gradient()` string for web, and a `width` value of `0.75`. Both platforms MUST reference this single token — no hardcoded gradient values in platform components.

#### Scenario: Token is importable from @salmon/shared
- **WHEN** any app imports `gradients` from `@salmon/shared`
- **THEN** `gradients.glassyBorder` is defined with `stops`, `css`, and `width` properties

#### Scenario: Gradient stop values match Figma Glassy_BORDER
- **WHEN** reading `gradients.glassyBorder.stops`
- **THEN** the first stop is at offset `0` with a visible white color (e.g., `rgba(255, 255, 255, 0.25)`)
- **THEN** the last stop is at offset `1` with fully transparent color (e.g., `rgba(255, 255, 255, 0)`)

#### Scenario: CSS value matches Figma Glassy_BORDER
- **WHEN** reading `gradients.glassyBorder.css`
- **THEN** it contains a `radial-gradient()` string with an ellipse shape centered at top, fading from visible white to transparent

### Requirement: Web BlurContainer renders radial gradient border
The web BlurContainer (`packages/ui/src/components/BlurContainer/`) SHALL render the glassy border using a CSS `::before` pseudo-element with `radial-gradient` background and `mask-composite: exclude` to create a border ring effect. The pseudo-element MUST inherit `border-radius` from the parent, use `padding` equal to `gradients.glassyBorder.width` for the border thickness, and set `pointer-events: none`.

#### Scenario: Gradient border visible on web
- **WHEN** a BlurContainer renders in the browser (extension or web app)
- **THEN** a radial gradient border is visible around the container edges
- **THEN** the border fades from a subtle white glow to transparent

#### Scenario: Border respects border-radius
- **WHEN** BlurContainer has a `borderRadius` style applied
- **THEN** the gradient border follows the same rounded corners

#### Scenario: Border does not block interactions
- **WHEN** a user clicks or hovers on content inside BlurContainer
- **THEN** the gradient border pseudo-element does not intercept the event

#### Scenario: Safari compatibility
- **WHEN** BlurContainer renders in Safari
- **THEN** the gradient border is visible (via `-webkit-mask-composite: xor` fallback)

### Requirement: Mobile BlurContainer renders radial gradient border via SVG
The mobile BlurContainer (`apps/mobile/src/components/BlurContainer/`) SHALL render the glassy border using an absolutely-positioned `react-native-svg` overlay with a `<RadialGradient>` definition applied as `stroke` on a `<Rect>`. The SVG MUST use `pointerEvents="none"`, measure dimensions via `onLayout`, and generate a unique gradient `id` per instance via `useId()`.

#### Scenario: Gradient border visible on iOS
- **WHEN** BlurContainer renders on iOS with expo-blur BlurView
- **THEN** an SVG radial gradient border is visible around the container

#### Scenario: Gradient border visible on Android
- **WHEN** BlurContainer renders on Android with solid background fallback
- **THEN** an SVG radial gradient border is still visible around the container

#### Scenario: Dynamic sizing
- **WHEN** BlurContainer's dimensions change (e.g., content grows)
- **THEN** the SVG border resizes to match the new dimensions on the next layout pass

#### Scenario: Multiple instances on same screen
- **WHEN** multiple BlurContainers render on the same screen
- **THEN** each has a unique SVG gradient `id` and borders render independently

#### Scenario: SVG does not block touch events
- **WHEN** a user taps on content inside BlurContainer
- **THEN** the SVG overlay does not intercept the touch

### Requirement: useGradientBorder prop controls border mode
`BlurContainerPropsBase` in `packages/shared/src/types/ui/blur-container.ts` SHALL include a `useGradientBorder` boolean prop defaulting to `true`. When `true`, the component renders the radial gradient border. When `false`, it falls back to the solid `borderColor`/`borderWidth` props.

#### Scenario: Default renders gradient border
- **WHEN** BlurContainer is rendered without specifying `useGradientBorder`
- **THEN** the gradient border is rendered (default `true`)

#### Scenario: Solid border fallback
- **WHEN** BlurContainer is rendered with `useGradientBorder={false}`
- **THEN** the solid border is rendered using `borderColor` and `borderWidth` props
- **THEN** no gradient pseudo-element or SVG overlay is present

### Requirement: Mobile blur intensity aligned with Figma
The mobile BlurContainer SHALL use a default `blurIntensity` of `4` (down from `8`) to align with Figma's `Blur/100 = 4` design token.

#### Scenario: Default blur on iOS
- **WHEN** BlurContainer renders on iOS without a custom `blurIntensity`
- **THEN** expo-blur BlurView uses intensity `4`

#### Scenario: Custom blur still works
- **WHEN** BlurContainer is rendered with `blurIntensity={20}`
- **THEN** the blur intensity is `20`, overriding the default

### Requirement: Web tint overlay removed
The web BlurContainer SHALL NOT render the tint overlay `::before` pseudo-element (the `getTintColor` overlay). The `::before` pseudo-element is now used exclusively for the gradient border. The `blurTint` prop MAY remain in the interface for backward compatibility but SHALL have no visual effect on web.

#### Scenario: No tint overlay on web
- **WHEN** BlurContainer renders on web with `blurTint="dark"`
- **THEN** no tint color overlay is applied
- **THEN** the `::before` pseudo-element shows only the gradient border
