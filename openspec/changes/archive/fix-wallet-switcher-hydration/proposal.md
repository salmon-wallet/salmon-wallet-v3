## Why

The `WalletSwitcherSheet` component produces invalid HTML by nesting `<p>` elements inside other `<p>` elements. MUI's `ListItemText` wraps its `primary` and `secondary` props in `<Typography>` (which renders `<p>` by default), but the custom `AccountName` and `AccountAddress` styled components are also based on `Typography` and render as `<p>`. This causes a hydration mismatch error on the web app because the server-rendered HTML differs from what the browser's HTML parser produces when it encounters the invalid nesting.

## What Changes

- Modify `AccountName` and `AccountAddress` styled components in `WalletSwitcherSheet.tsx` to render as `<span>` instead of `<p>`, by adding `component="span"` to each styled declaration.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none -- this is a pure implementation-level fix with no spec-level behavior change)

## Impact

- **Affected code**: `packages/ui/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx` (lines 71 and 80)
- **Affected platforms**: Web app and extension (both use MUI/DOM rendering via `packages/ui`)
- **No risk of code duplication**: The fix is self-contained in the styled component definitions
- **No breaking changes**: Visual output is identical; only the underlying HTML element changes from `<p>` to `<span>`
