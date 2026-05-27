## 1. Web: Replace CardContainer with BlurContainer

- [x] 1.1 Import `BlurContainer` from `../BlurContainer` in `packages/ui/src/components/TransactionDetailModal/TransactionDetailModal.tsx`
- [x] 1.2 Replace `<CardContainer>` wrapping the Date & Time / Confirmation / Block section with `<BlurContainer style={{ borderRadius: borderRadius.md, padding: spacing.md }}>`
- [x] 1.3 Replace `<CardContainer>` wrapping the Fee / Hash section with `<BlurContainer style={{ borderRadius: borderRadius.md, padding: spacing.md }}>`
- [x] 1.4 Remove the `CardContainer` styled component definition (no longer used)

## 2. Web: Replace TokenRow with BlurContainer

- [x] 2.1 Replace `<TokenRow>` in the `TokenAmountRow` sub-component with `<BlurContainer style={{ borderRadius: borderRadius.md, padding: spacing.md, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>`
- [x] 2.2 Remove the `TokenRow` styled component definition (no longer used)

## 3. Mobile: Fix hash font

- [x] 3.1 Change `hashValue` style `fontFamily` from `fontFamilyNative.medium` to `fontFamilyNative.mono` in `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx`
- [x] 3.2 Import `fontFamilyNative` mono variant if not already available (verified it's exported from `@salmon/shared`)

## 4. Validation

- [x] 4.1 Run `pnpm turbo run typecheck --filter=@salmon/ui` and verify no type errors
