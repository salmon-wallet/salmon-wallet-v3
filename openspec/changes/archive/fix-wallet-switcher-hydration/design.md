## Context

MUI's `ListItemText` component wraps its `primary` prop in `<Typography variant="body1">` and its `secondary` prop in `<Typography variant="body2">`. By default, MUI `Typography` renders as a `<p>` element. In `WalletSwitcherSheet.tsx`, `AccountName` and `AccountAddress` are both `styled(Typography)` which also render as `<p>`. This creates `<p>` inside `<p>`, which is invalid HTML per the spec and triggers a hydration mismatch in React's reconciliation.

## Goals / Non-Goals

**Goals:**
- Eliminate the `<p>` nesting violation that causes the hydration error
- Preserve the exact same visual styling (font size, weight, color, etc.)
- Apply the minimal possible change

**Non-Goals:**
- Refactoring `ListItemText` usage patterns across the codebase
- Changing the component structure or layout of `WalletSwitcherSheet`
- Addressing other potential hydration issues in other components

## Decisions

### Decision 1: Add `component="span"` to styled Typography definitions

**Choice**: Pass `component="span"` as a default prop in the `styled(Typography)` call for both `AccountName` and `AccountAddress`.

**Rationale**: MUI's `styled()` API supports setting default props. By specifying `component="span"`, the Typography renders as `<span>` instead of `<p>`, making it a valid child of the outer `<p>` wrapper. This is the idiomatic MUI approach for this exact problem.

**Alternatives considered**:
- *Pass `component="span"` at the JSX call site*: Would work but requires changing it everywhere these components are used. Defining it in the styled component is more maintainable.
- *Use `ListItemText`'s `primaryTypographyProps`/`secondaryTypographyProps`*: Would require restructuring how we pass content to `ListItemText`, more invasive.
- *Use `Box` with `component="span"` instead of `Typography`*: Would lose Typography's built-in variant system and require manually applying all styles.

## Risks / Trade-offs

- **[Low risk] TypeScript type narrowing**: MUI's `styled(Typography)` with `component="span"` may require type annotations. Mitigation: if needed, cast or use `as any` on the component prop, though MUI typically handles this cleanly.
- **[No risk] Visual regression**: Changing from `<p>` to `<span>` does not affect styling since all visual properties (fontSize, fontWeight, color, etc.) are explicitly set in the styled definition. `<span>` is inline by default, but MUI Typography already sets `display: block` when needed.
