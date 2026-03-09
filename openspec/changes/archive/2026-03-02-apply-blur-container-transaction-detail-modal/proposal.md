## Why

The TransactionDetailModal web version uses plain styled `Box` containers (`CardContainer`, `TokenRow`) with solid borders and static backgrounds for its detail cards. These should use `BlurContainer` to match the mobile version (which already uses `BlurContainer`) and align with the Figma design's glassy blur effect. Additionally, the Transaction Hash value on mobile is missing the monospace font.

## What Changes

- **Web**: Replace `CardContainer` and `TokenRow` styled components with `BlurContainer` for: Date & Time card, Token amount rows, and Transaction Hash card
- **Web**: Remove solid border/background from these containers since `BlurContainer` provides blur + gradient border
- **Mobile**: Fix `hashValue` font to use `fontFamilyNative.mono` instead of `fontFamilyNative.medium`
- Address section is already correct on both platforms — no changes needed there

## Capabilities

### New Capabilities
- `blur-container-transaction-detail`: Apply BlurContainer to TransactionDetailModal detail cards on web, fix hash font on mobile

### Modified Capabilities

## Impact

- `packages/ui/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Replace `CardContainer` and `TokenRow` with `BlurContainer`, import BlurContainer
- `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Fix hashValue fontFamily to mono
