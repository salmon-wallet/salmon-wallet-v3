## 1. Shared tokens and types

- [x] 1.1 Add `loading?: boolean` to `StepTokenSelectProps` in `packages/shared/src/types/ui/send-sheet.ts`
- [x] 1.2 Add `componentSizes.qrBorderWidth: 22` and `componentSizes.receiveContentGap: 32` to `packages/shared/src/theme/spacing.ts`
- [x] 1.3 Add i18n keys for ReceiveSheet strings (`receive.title`, `receive.copyAddress`, `receive.copied`) to `packages/shared/src/locales/en/translation.json` and `packages/shared/src/locales/es/translation.json`

## 2. Send — StepTokenSelect padding fix (web/extension)

- [x] 2.1 Add `paddingTop: spacing.xl` to the `Container` styled component in `packages/ui/src/components/SendPage/StepTokenSelect.tsx`

## 3. Send — StepTokenSelect skeleton (web/extension)

- [x] 3.1 Add skeleton UI to `packages/ui/src/components/SendPage/StepTokenSelect.tsx`: when `loading` is true, render a search bar placeholder (Skeleton rect inside BlurContainer) + 5 token row skeletons (circular Skeleton for logo + two text Skeletons inside BlurContainer), using MUI `<Skeleton>` and `colors.skeleton.base`/`colors.skeleton.highlight`
- [x] 3.2 Wire `loading` prop from parent: pass a loading flag from `SendPage` to `StepTokenSelect` in `packages/ui/src/components/SendPage/SendPage.tsx` (derive from `tokens.length === 0` while parent loading state is true, or accept a new `loading` prop on `SendPageProps`)

## 4. Send — StepTokenSelect skeleton (mobile)

- [x] 4.1 Add skeleton UI to `apps/mobile/src/components/SendSheet/StepTokenSelect.tsx`: when `loading` is true, render a search bar placeholder + 5 token row skeletons using `ContentLoader`/`Rect`/`Circle` from `@salmon/shared` and `colors.skeleton.base`/`colors.skeleton.highlight`, wrapped in `BlurContainer`
- [x] 4.2 Wire `loading` prop from parent: pass a loading flag from `SendSheet` to `StepTokenSelect` in `apps/mobile/src/components/SendSheet/SendSheet.tsx`

## 5. ReceiveSheet — unified tokens and i18n (both platforms)

- [x] 5.1 Update `packages/ui/src/components/ReceiveSheet/ReceiveSheet.tsx`: replace hardcoded `QR_BORDER_WIDTH = 20` with `componentSizes.qrBorderWidth`, replace `gap: spacing.xl` with `componentSizes.receiveContentGap`, replace hardcoded strings ("Receive", "Copy address", "Copied!") with `t()` calls
- [x] 5.2 Update `apps/mobile/src/components/ReceiveSheet/ReceiveSheet.tsx`: replace hardcoded `QR_BORDER_WIDTH = 24` with `componentSizes.qrBorderWidth`, replace `gap: vs(42)` with `vs(componentSizes.receiveContentGap)`, replace hardcoded strings with `t()` calls

## 6. ReceiveSheet — copy feedback (mobile)

- [x] 6.1 Add `copied` state + `setTimeout(2000ms)` to `apps/mobile/src/components/ReceiveSheet/ReceiveSheet.tsx`: toggle copy button between check icon ("Copied!") and copy icon ("Copy address"), reset `copied` to false when `visible` becomes false

## 7. ReceiveSheet — responsive QR (web/extension)

- [x] 7.1 Replace fixed `QR_SIZE = 220` in `packages/ui/src/components/ReceiveSheet/ReceiveSheet.tsx` with dynamic sizing: use a `ref` + `useEffect` to measure `ContentWrapper` width, calculate QR size as `measuredWidth - (contentPadding * 2) - (qrBorderWidth * 2)`, default to 220px until measured

## 8. Typecheck

- [x] 8.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and fix any errors
- [x] 8.2 Run `pnpm turbo run typecheck --filter=@salmon/mobile` and fix any errors (preexisting error in TransactionDetailModal.tsx — not from this change)
