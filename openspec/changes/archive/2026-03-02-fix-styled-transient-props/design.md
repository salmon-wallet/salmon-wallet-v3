## Context

Emotion's `styled()` forwards all props to the underlying DOM element by default. Props like `isDanger`, `isActive`, `bgColor` are not valid HTML attributes, so React warns/errors when they appear on the DOM. The Emotion convention is to prefix transient (styling-only) props with `$` — Emotion strips these before forwarding to the DOM.

The codebase already follows this pattern in ~23 components (e.g., `$clickable`, `$topOffset`, `$active`, `$hasError`). This fix brings the remaining 25 components into alignment.

## Goals / Non-Goals

**Goals:**
- Eliminate all "React does not recognize the prop" console errors from `@salmon/ui` components
- Standardize on the `$` prefix convention for all transient styled props

**Non-Goals:**
- Changing any visual behavior or styling logic
- Refactoring styled component architecture
- Touching mobile components (React Native has no DOM)

## Decisions

### 1. Use `$` prefix (not `shouldForwardProp`)

**Decision**: Rename props with `$` prefix.

Emotion supports two approaches: `shouldForwardProp` filter or `$` transient prefix. The `$` prefix is simpler, already used in the codebase, and self-documenting. `shouldForwardProp` requires extra boilerplate per component.

### 2. Skip props that are valid native/MUI props

**Decision**: Props like `disabled`, `selected`, and `fullWidth` that are valid on the base MUI component do NOT need the `$` prefix — MUI handles them correctly. Only rename props that are truly custom and not part of the base component's API.

Exceptions to still rename:
- `disabled` on `Box` (Box is a div, doesn't accept `disabled`)
- `selected` on components that don't natively support it

### 3. Scope to packages/ui only

**Decision**: Only fix `packages/ui/src/`. The extension and web apps consume these components but don't need changes — the prop rename is internal to the styled definition and its JSX usage within the same file.

## Risks / Trade-offs

- **[Low] Missed renames**: Typecheck will catch any prop name mismatches since the generic type on `styled()` will require the `$` prefix.
