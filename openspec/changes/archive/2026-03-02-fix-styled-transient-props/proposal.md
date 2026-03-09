## Why

Emotion `styled()` components in `packages/ui` pass custom props (e.g., `isDanger`, `isActive`, `bgColor`, `borderColor`) directly to the DOM, causing React "does not recognize the prop on a DOM element" errors in the browser console. The codebase already uses the correct `$` prefix pattern in ~23 components, but 25 components still use unprefixed custom props. This is a consistency fix to eliminate all DOM prop leaking errors.

## What Changes

- Rename all unprefixed custom props in `styled()` calls to use the `$` prefix (Emotion transient prop convention) across `packages/ui/src/`
- Update all usage sites that pass these props to use the `$` prefix
- No functional or visual changes — purely mechanical prop renaming

## Capabilities

### New Capabilities

_(none — mechanical refactor)_

### Modified Capabilities

_(no spec-level changes — fixing prop forwarding convention)_

## Impact

- **Affected code**: `packages/ui/src/` — 14 files with 25 styled components
- **Extension**: Consumes `@salmon/ui` — errors will disappear, no code changes needed in extension
- **Web**: Consumes `@salmon/ui` — errors will disappear, no code changes needed in web
- **Mobile**: Not affected — uses React Native, not Emotion styled components
- **Risk**: Low — renaming is mechanical, no logic changes, typecheck will catch any missed renames
