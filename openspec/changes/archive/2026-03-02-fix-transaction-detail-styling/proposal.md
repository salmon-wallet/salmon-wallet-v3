## Why

The Transaction Detail modal on web/extension lacks visual consistency with the rest of the app. Section cards don't use BlurContainer (unlike mobile), the transaction hash uses a monospace font instead of the project font, and the "View on Explorer" button uses red (accent.primary) which is too similar to error states.

## What Changes

- **Web**: Replace `CardContainer` styled Box with `BlurContainer` for detail sections (Date & Time, tokens, addresses, transaction hash)
- **Web**: Change transaction hash font from `fontFamily.mono` to `fontFamily.sans`
- **Web + Mobile**: Change "View on Explorer" button color from `colors.accent.primary` to `colors.palette.amber`

## Capabilities

### New Capabilities
- `transaction-detail-visual-consistency`: Ensures transaction detail sections use BlurContainer and consistent fonts/colors across platforms.

### Modified Capabilities

## Impact

- **packages/ui**: `TransactionDetailModal.tsx` — replace CardContainer with BlurContainer, fix hash font
- **packages/ui**: `ExplorerLinkButton.tsx` — change button color to amber
- **apps/mobile**: `ExplorerLinkButton.tsx` — change button color to amber
