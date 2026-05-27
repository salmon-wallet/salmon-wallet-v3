## Context

This is a follow-up to `fix-styled-transient-props` which fixed 25 cases of unprefixed custom props. That change missed 5 files that use `shouldForwardProp` as an alternative approach to prevent DOM forwarding. While `shouldForwardProp` works, it adds boilerplate and diverges from the codebase convention.

## Goals / Non-Goals

**Goals:**
- Replace all `shouldForwardProp` usage with `$` transient prefix in `packages/ui`
- Remove the `shouldForwardProp` option objects (less boilerplate)

**Non-Goals:**
- Changing any styling logic or visual behavior
- Touching files outside `packages/ui/src/`

## Decisions

### 1. Mechanical rename: remove `shouldForwardProp`, add `$` prefix

**Decision**: For each affected `styled()` call:
1. Remove the `{ shouldForwardProp: ... }` second argument
2. Rename props in the generic type from `propName` to `$propName`
3. Update destructuring in the style function
4. Update all JSX usage sites

### 2. `fullWidth` on Button remains unprefixed

**Decision**: In `SecondaryButton.tsx`, the `fullWidth` prop is a valid MUI `Button` prop — it stays unprefixed. Only `buttonVariant` gets the `$` prefix.

### 3. `active` on Box needs `$` prefix

**Decision**: In `PasswordStrengthBar.tsx`, `active` on `Box` (a div) is not a valid HTML attribute, so it needs `$active`.

## Risks / Trade-offs

- **[Low]**: Typecheck catches any missed renames since the generic type enforces `$` prefix.
