## Context

The Send flow (SendPage in web/extension, SendSheet in mobile) and ReceiveSheet have visual and behavioral gaps. Token data is passed synchronously from the parent, but a `loading` prop is missing — meaning there's no way to show a skeleton even if the parent's data is still fetching. The ReceiveSheet has diverged between platforms: web has copy feedback + fallback but fixed QR size; mobile has responsive QR but no copy feedback.

Relevant existing code:
- `StepTokenSelectProps` in `packages/shared/src/types/ui/send-sheet.ts` — no `loading` prop today
- `TokenListSkeleton` in `packages/ui` (MUI Skeleton) and `apps/mobile` (react-content-loader via `ContentLoader` from `@salmon/shared`) — established skeleton patterns
- `colors.skeleton.base` / `colors.skeleton.highlight` — shared skeleton color tokens
- `copyToClipboard` in `packages/shared/src/utils/clipboard.ts` — web-only (uses `navigator.clipboard`)
- `ReceiveSheetPropsBase` in `packages/shared/src/types/ui/receive-sheet.ts` — shared base props

## Goals / Non-Goals

**Goals:**
- Add a `loading` prop to `StepTokenSelectProps` so parents can signal "tokens are still loading"
- Show platform-appropriate skeletons in StepTokenSelect when loading is true
- Fix the missing `paddingTop` on StepTokenSelect in web/extension
- Unify ReceiveSheet behavior: copy feedback on both platforms, responsive QR on both, consistent spacing tokens
- Keep changes minimal — only touch what's needed

**Non-Goals:**
- Refactoring Send into a shared component (mobile uses RN, web uses MUI — they can't share UI)
- Adding skeletons to other Send steps (address-amount, confirmation)
- Adding a skeleton for Bitcoin's send flow (it skips token-select)
- Changing the ReceiveSheet container type (BottomSheetContainer on mobile, BaseSheetDialog on web)
- Making `copyToClipboard` cross-platform (mobile uses expo-clipboard via `onCopy` prop from parent)

## Decisions

### 1. Add `loading?: boolean` to `StepTokenSelectProps` (shared type)

**Rationale**: The type lives in `packages/shared/src/types/ui/send-sheet.ts` and is consumed by both platforms. Adding an optional `loading` prop here keeps both implementations aligned without breaking existing callers (defaults to `false`/`undefined`).

**Alternative considered**: Detecting `tokens.length === 0` as "loading". Rejected because an empty token list is a valid state (new wallet, filtered results) and should show "No tokens found", not a skeleton.

### 2. Skeleton implementation per platform follows existing patterns

- **Web/Extension** (`packages/ui`): Use MUI `<Skeleton>` component, same approach as `TokenListSkeleton` in `packages/ui/src/components/TokenList/TokenList.tsx`. Skeleton layout: search bar placeholder + 5 token row placeholders with circle (logo) + two text bars, all wrapped in `BlurContainer`.
- **Mobile** (`apps/mobile`): Use `ContentLoader` / `Rect` / `Circle` from `@salmon/shared` (re-exported react-content-loader), same approach as `TokenListSkeleton` in `apps/mobile/src/components/TokenList/TokenListSkeleton.tsx`. Same visual layout.

**Rationale**: Follows the established pattern in each platform. No new dependencies.

### 3. StepTokenSelect padding fix — `paddingTop: spacing.xl`

Apply to the `Container` styled component in `packages/ui/src/components/SendPage/StepTokenSelect.tsx`. Value: `spacing.xl` (20px), matching the existing `paddingLeft`/`paddingRight` on the same container for uniform spacing.

### 4. ReceiveSheet unification — cherry-pick best from each platform

| Feature | Source | Target | Approach |
|---------|--------|--------|----------|
| Copy feedback ("Copied!" + check icon + 2s timeout) | Web | Mobile | Add `copied` state + `setTimeout` to mobile ReceiveSheet. Use `Ionicons` check icon (already imported in SendSheet). |
| Copy fallback (`copyToClipboard`) | Web | Mobile | Mobile can't use `navigator.clipboard`. Keep the current pattern: mobile parent passes `onCopy` using `expo-clipboard`. No change needed — the web fallback is web-specific by nature. |
| Responsive QR sizing | Mobile | Web | Replace fixed `QR_SIZE = 220` with a calculation based on container/dialog width. Web will use a CSS `calc()` or a ref-based measurement. The dialog is constrained by `BaseSheetDialog size="small"`, so we measure available width and subtract padding + border. |
| Unified QR border width | Both → shared token | Both | Add `componentSizes.qrBorderWidth: 22` to `packages/shared/src/theme/spacing.ts`. Both platforms use this instead of their hardcoded values (20px web, 24px mobile). Meet in the middle at 22px. |
| Unified content gap | Both → shared token | Both | Add `componentSizes.receiveContentGap: 32` to `packages/shared/src/theme/spacing.ts`. Both platforms use this for vertical spacing between QR, address, and copy button. Current values: 20px (web) vs 42px (mobile). Settle at 32px — comfortable without excessive whitespace in the extension popup. |

### 5. Mobile copy feedback — no `copyToClipboard` fallback

**Rationale**: `copyToClipboard` in shared uses `navigator.clipboard` which doesn't exist in React Native. The mobile ReceiveSheet always receives `onCopy` from its parent (which uses expo-clipboard). Adding a fallback would require a cross-platform clipboard abstraction — out of scope. The copy *feedback* (visual state "Copied!") is what's missing on mobile and that's what we'll add.

### 6. i18n for copy feedback strings

The "Copied!" and "Copy address" strings in ReceiveSheet should use `t()` translations. Check existing translation keys before adding new ones.

## Risks / Trade-offs

- **Responsive QR on web**: Measuring container width on web requires either a `ref` + `ResizeObserver` or CSS-based approach. Risk of flash on first render. → Mitigation: Use a reasonable default (220px) while measuring, then update. The dialog has a known constrained size so the measurement is fast.
- **New shared tokens (qrBorderWidth, receiveContentGap)**: Adding tokens that are only used by one component. → Acceptable trade-off for cross-platform consistency. These are semantic tokens tied to a specific feature.
- **Gap value compromise (32px)**: Neither platform gets their current exact value. → 32px is visually balanced for both the 360px extension popup and mobile screens. Can be fine-tuned after visual review.
