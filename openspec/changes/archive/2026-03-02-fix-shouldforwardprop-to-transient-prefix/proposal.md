## Why

Five files in `packages/ui/src/` use `shouldForwardProp` as a manual workaround to prevent custom props from leaking to the DOM, instead of using the standard `$` transient prefix convention. This creates inconsistency — the rest of the codebase (40+ props) uses `$` prefix. Migrating these 5 files eliminates the `shouldForwardProp` boilerplate and standardizes the convention.

## What Changes

- Replace `shouldForwardProp` filters with `$` prefixed transient props in 5 files (11 props total)
- Remove the now-unnecessary `shouldForwardProp` option objects from `styled()` calls
- Update generic types, destructuring, and JSX usage sites to use `$` prefixed names

## Capabilities

### New Capabilities
_None_

### Modified Capabilities
- `styled-transient-props`: Extend the existing requirement to cover the `shouldForwardProp` cases that were missed in the first pass

## Impact

- **packages/ui** — 5 component files modified:
  - `Button/SecondaryButton.tsx` — 1 prop (`buttonVariant`)
  - `Button/TextButton.tsx` — 1 prop (`customColor`)
  - `PasswordInput/PasswordStrengthBar.tsx` — 3 props (`active`, `barColor`, `labelColor`)
  - `TokenDetailPage/TokenBadgesSection.tsx` — 1 prop (`badgeColor`, used in 2 styled components)
  - `TokenFeatures/TokenFeatures.tsx` — 2 props (`badgeColor`, `labelColor`)
- No impact on mobile, extension, or web apps — changes are internal to styled definitions
