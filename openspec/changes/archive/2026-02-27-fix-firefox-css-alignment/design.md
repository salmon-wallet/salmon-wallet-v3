## Context

The Salmon Wallet extension uses MUI `styled()` components with CSS flex properties. Several components set `alignItems` and `gap` without declaring `display: flex`, and button-based components omit `textAlign: 'center'`. Chrome auto-infers these properties but Firefox strictly follows the CSS spec, causing misaligned layouts in the Firefox sidebar.

## Goals / Non-Goals

**Goals:**
- Fix all known alignment discrepancies between Firefox and Chrome in the extension
- Ensure changes are purely additive (explicit declarations of properties Chrome already infers)
- Zero visual regression in Chrome

**Non-Goals:**
- Responsive sizing differences due to Firefox sidebar width (~300px) vs Chrome sidePanel (~400px) — these are expected and not bugs
- Auditing the entire codebase for similar issues — scope is limited to the 3 reported components
- Mobile app changes — React Native StyleSheet is unaffected

## Decisions

### 1. Add explicit `display: flex` where flex properties are used without it

**Rationale:** `alignItems`, `justifyContent`, and `gap` are flex/grid properties. Per CSS spec they have no effect on `display: block` elements. Chrome is non-standard in applying them; Firefox is correct. Adding `display: 'flex'` and `flexDirection: 'column'` makes the intent explicit and cross-browser compliant.

**Alternative considered:** Replacing `alignItems: 'flex-end'` with `textAlign: 'right'` alone — rejected because the containers also use `gap` which requires flex context, and the vertical stacking needs `flexDirection: column`.

### 2. Add explicit `textAlign: 'center'` to button-based styled components

**Rationale:** HTML `<button>` elements have user-agent default `text-align: center`. When wrapped through MUI's `styled()` + Emotion, Firefox resets this default. Adding the property explicitly is the safest fix — it's a no-op in Chrome and fixes Firefox.

**Alternative considered:** Using a global CSS reset that restores button defaults — rejected as too broad and fragile.

### 3. Fix each component individually rather than creating a shared utility

**Rationale:** The fixes are 1-3 CSS property additions per component. A shared abstraction would be over-engineering. Each fix is self-contained and obvious at the call site.

## Risks / Trade-offs

- **[Low risk] Other components may have similar issues** → Mitigated by scoping this change to the 3 reported cases. A broader audit can be done later if more issues surface.
- **[No risk] Chrome regression** → We are only adding explicit declarations for properties Chrome already infers. No visual change.
