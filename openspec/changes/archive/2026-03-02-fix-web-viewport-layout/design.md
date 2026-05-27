## Context

The web app (`apps/web`) renders inside a `WalletLayout` (from `packages/ui`) that constrains content to a centered 375px column. Both WalletLayout and every individual page component use `minHeight: '100vh'` on their root containers, which means when the sum of padding, text, inputs, and buttons exceeds the viewport, the page grows and becomes scrollable at the document level. This is wrong for a wallet app — full-screen pages (Welcome, Create, Recover, Password, Lock, dApp approvals, Home) should be locked to the viewport with no page scroll. Only specific sections within a page (token lists, derived account lists) should scroll internally.

Pages that use `PageShell` with `fullHeight={true}` (the default) already get `height: 100vh` and work correctly. The problem is in the 11 pages that define their own Container with `minHeight: '100vh'`.

## Goals / Non-Goals

**Goals:**
- All web app screens occupy exactly `100vh` with no page-level scroll
- Internal scrollable sections (token list in HomePage, derived account list in DerivedAccountsPage, content in CreatePage for seed grid/verify step) remain scrollable via `overflowY: auto`
- WalletLayout enforces viewport lock at the wrapper level
- Minimal changes — only modify the CSS properties, no structural refactoring

**Non-Goals:**
- Refactoring pages to use PageShell (would be a larger change; some pages have custom layouts that don't fit PageShell's header pattern)
- Changing the extension app (uses its own popup container with different sizing constraints)
- Changing mobile app (React Native, completely separate rendering engine)
- Adding `dvh` or other modern viewport units (stick with `100vh` for browser compatibility)

## Decisions

### 1. `height: '100vh'` + `overflow: 'hidden'` on root containers

**Decision**: Replace `minHeight: '100vh'` with `height: '100vh'` and add `overflow: 'hidden'` on every page's root Container.

**Rationale**: `height: 100vh` constrains the container to exactly the viewport. `overflow: hidden` prevents any content that overflows from creating scrollbars at the page level. Internal flex children with `flex: 1` + `minHeight: 0` + `overflowY: auto` will handle scroll where needed.

**Alternative considered**: Using `max-height: 100vh` instead — rejected because it doesn't guarantee the container fills the viewport when content is small.

### 2. Fix WalletLayout at the wrapper level

**Decision**: Change WalletLayout's Outer to `height: '100vh'` + `overflow: 'hidden'`, and Inner to `height: '100%'` (inheriting from Outer).

**Rationale**: WalletLayout wraps all web routes. Fixing it at this level provides a safety net even if individual pages miss the constraint. Inner uses `height: '100%'` instead of `100vh` because its parent (Outer) already defines the viewport boundary.

### 3. Add `overflowY: 'auto'` to content sections that need scroll

**Decision**: For pages with variable-height content, add `overflowY: 'auto'` + `minHeight: 0` to the flex child that should scroll.

Affected sections:
- **CreatePage**: The `CenterContent` area (contains seed grid in `seedPhrase` step and validation inputs in `validate` step)
- **DerivedAccountsPage**: The `ListContainer` (already has `overflowY: auto`, just needs parent to be viewport-locked)
- **HomePage**: Already correct — `TokenSection` has `overflowY: auto`

### 4. Keep SettingsPage as-is

**Decision**: SettingsPage already uses `PageShell fullHeight={false}`, which produces `minHeight: 100vh`. This is intentional — the settings list can exceed the viewport and should page-scroll. No change needed.

## Risks / Trade-offs

- **[Risk] Content clipping on very small viewports** → Mitigated by using flex layout with `overflowY: auto` on content sections, so content scrolls internally rather than being clipped.
- **[Risk] WalletLayout change affects extension app** → WalletLayout is only used by `apps/web`. Extension uses its own popup/sidepanel containers. No risk.
- **[Risk] Mobile keyboard on lock/password pages could cause viewport issues** → On mobile browsers `100vh` may not account for virtual keyboard. This is a known limitation of `100vh`; using `100dvh` would fix it but has less browser support. Acceptable trade-off for now since the web app targets desktop primarily.
