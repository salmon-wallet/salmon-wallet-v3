## Context

The TransactionDetailModal has two platform implementations:
- **Web** (`packages/ui/src/components/TransactionDetailModal/TransactionDetailModal.tsx`): Uses styled MUI `Box` components (`CardContainer`, `TokenRow`) with solid borders and static backgrounds
- **Mobile** (`apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx`): Already uses `BlurContainer` for all sections but has a bug where `hashValue` uses `fontFamilyNative.medium` instead of `fontFamilyNative.mono`

The web version needs to be aligned with the mobile version by wrapping the detail card containers with `BlurContainer`.

## Goals / Non-Goals

**Goals:**
- Replace `CardContainer` and `TokenRow` on web with `BlurContainer` for glassy blur effect
- Fix monospace font for transaction hash on mobile
- Maintain visual consistency between web and mobile

**Non-Goals:**
- Changing the Address section (already correct)
- Modifying BlurContainer itself
- Changing layout or content of the modal

## Decisions

### 1. Web: Wrap existing content with BlurContainer instead of replacing inner containers

The `CardContainer` wraps multiple rows (Date & Time, Confirmation, Block, Fee, Hash) with internal dividers. Rather than restructuring, we wrap the content section with `BlurContainer` and keep the inner layout intact. The `BlurContainer` provides blur + gradient border, so we remove the solid `border` and `backgroundColor` from `CardContainer`.

Similarly, `TokenRow` gets replaced by wrapping each `TokenAmountRow` with `BlurContainer`.

### 2. BlurContainer props for these sections

Use default props (gradient border enabled) with `borderRadius.md` to match existing card styling. No custom border color needed — default `colors.border.default` applies.

### 3. Mobile: Minimal fix

Only the `hashValue` font needs fixing: `fontFamilyNative.medium` → `fontFamilyNative.mono`. Everything else already uses `BlurContainer`.

## Risks / Trade-offs

- **Minimal risk**: Web change is purely visual — wrapping existing content with `BlurContainer` doesn't change layout or behavior
- **No new dependencies**: `BlurContainer` already exists in `packages/ui`
