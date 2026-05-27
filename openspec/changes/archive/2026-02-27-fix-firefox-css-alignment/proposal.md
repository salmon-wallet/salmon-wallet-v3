## Why

Several extension UI components use CSS flex properties (`alignItems`, `gap`) without declaring `display: flex`, and buttons lack explicit `textAlign: 'center'`. Chrome is permissive and applies these properties anyway, but Firefox strictly follows the CSS spec and ignores them, causing layout differences (left-aligned prices, uncentered tabs and buttons) in the Firefox sidebar.

## What Changes

- Add `display: 'flex'` and `flexDirection: 'column'` to `ValueContainer`, `BitcoinAmountContainer`, and `SkeletonValueContainer` in `TokenListItem.tsx` so `alignItems: 'flex-end'` and `gap` take effect
- Add `textAlign: 'center'` to `TabButton` in `HomePage.tsx` so tab labels are centered
- Add `textAlign: 'center'` to `ForgotPasswordButton` in `LockPage.tsx` so the link is centered

## Capabilities

### New Capabilities
- `cross-browser-css-compliance`: Ensure all styled components in the extension use explicit CSS property declarations required by strict-spec browsers (Firefox), adding missing `display: flex` and `textAlign` where Chrome was silently filling them in.

### Modified Capabilities
<!-- No existing specs are changing requirements -->

## Impact

- **Affected files** (extension only):
  - `apps/extension/src/components/TokenList/TokenListItem.tsx`
  - `apps/extension/src/pages/home/HomePage.tsx`
  - `apps/extension/src/pages/lock/LockPage.tsx`
- **No shared package changes** — all fixes are extension-only CSS additions
- **No mobile impact** — mobile uses React Native StyleSheet, not CSS
- **Chrome unaffected** — adding explicit properties that Chrome already infers; no visual change
