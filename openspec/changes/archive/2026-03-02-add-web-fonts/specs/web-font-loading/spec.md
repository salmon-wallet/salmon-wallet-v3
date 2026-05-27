## ADDED Requirements

### Requirement: Web app declares @font-face for DM Sans
The web app (`apps/web`) SHALL declare `@font-face` rules for the DM Sans font family covering all 7 weights defined in the theme: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800), Black (900). Each declaration MUST use `font-family: 'DM Sans'` to match the value in `packages/shared/src/theme/typography.ts` (`fontFamily.sans`). Each declaration MUST specify `font-display: swap` and `font-style: normal`.

#### Scenario: All font weights are declared
- **WHEN** the CSS file at `apps/web/src/assets/fonts.css` is inspected
- **THEN** it SHALL contain exactly 7 `@font-face` blocks, one per weight (300, 400, 500, 600, 700, 800, 900), all with `font-family: 'DM Sans'`

#### Scenario: Font sources reference public directory
- **WHEN** a `@font-face` block references its `src`
- **THEN** the URL SHALL be an absolute path `/fonts/DMSans-<Variant>.ttf` with `format('truetype')`, matching the file names in `packages/assets/src/fonts/`

### Requirement: Font files are served from the web public directory
The web app SHALL serve the 7 DM Sans `.ttf` files from `apps/web/public/fonts/`. The files MUST be copies of the canonical sources in `packages/assets/src/fonts/`.

#### Scenario: Font files exist in public directory
- **WHEN** the `apps/web/public/fonts/` directory is listed
- **THEN** it SHALL contain: `DMSans-Light.ttf`, `DMSans-Regular.ttf`, `DMSans-Medium.ttf`, `DMSans-SemiBold.ttf`, `DMSans-Bold.ttf`, `DMSans-ExtraBold.ttf`, `DMSans-Black.ttf`

#### Scenario: Vite serves fonts without transformation
- **WHEN** the web app is built with `pnpm web:build`
- **THEN** the font files SHALL appear in `dist/fonts/` with their original names (no hash suffixes), since Vite copies the `public/` directory as-is

### Requirement: Font CSS is imported at app entry point
The web app entry point (`apps/web/src/main.tsx`) SHALL import the font CSS file before rendering the React tree, ensuring fonts begin loading immediately.

#### Scenario: Font CSS import is present
- **WHEN** `apps/web/src/main.tsx` is inspected
- **THEN** it SHALL contain `import './assets/fonts.css'` (or equivalent path) before the `ReactDOM.createRoot` call

#### Scenario: DM Sans renders in the browser
- **WHEN** the web app loads in a browser that does not have DM Sans installed as a system font
- **THEN** text styled with `fontFamily: 'DM Sans', sans-serif` SHALL render using the loaded DM Sans font (verifiable via browser DevTools computed styles showing "DM Sans" as the rendered font)

### Requirement: Font loading uses swap display strategy
All `@font-face` declarations MUST use `font-display: swap` to prevent Flash of Invisible Text (FOIT). The browser SHALL render text immediately with the fallback font and swap to DM Sans once loaded.

#### Scenario: No invisible text during font load
- **WHEN** the web app loads on a slow connection (throttled to Slow 3G in DevTools)
- **THEN** text SHALL be visible immediately using the system sans-serif fallback, then swap to DM Sans once the font file finishes downloading
