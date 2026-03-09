## Why

The Send and Receive flows lack loading skeletons and have visual inconsistencies between platforms. The Send token-select step renders instantly without a loading state (no skeleton), the search bar is visually glued to the header in web/extension (missing top padding), and the ReceiveSheet implementations diverge in copy feedback, QR sizing, spacing, and fallback behavior despite sharing the same purpose.

## What Changes

- **Send skeleton (token-select step)**: Add a real loading skeleton for StepTokenSelect in both `packages/ui` (web/extension) and `apps/mobile`. The skeleton displays when `tokens` is empty/loading, matching existing skeleton patterns (MUI Skeleton for web, react-content-loader for mobile). Not needed for Bitcoin (skips token-select).
- **Send top padding fix (web/extension)**: Add `paddingTop: spacing.xl` to the StepTokenSelect container in `packages/ui` so the search bar has breathing room below the PageShell header.
- **ReceiveSheet unification**: Align both platform implementations by adopting the best of each:
  - **Copy feedback** (from web → mobile): Add "Copied!" visual state with check icon and timeout to mobile ReceiveSheet.
  - **Copy fallback** (from web → mobile): Add `copyToClipboard(address)` fallback in mobile when no `onCopy` prop is provided.
  - **Responsive QR sizing** (from mobile → web): Replace the fixed 220px QR size in web with dynamic sizing based on container width.
  - **Consistent spacing**: Unify gap and QR border values across platforms using shared design tokens.

## Capabilities

### New Capabilities
- `send-token-select-skeleton`: Loading skeleton for the Send token-select step on both platforms

### Modified Capabilities
- `web-send-flow`: Adding top padding to StepTokenSelect for proper spacing below header
- `receive-sheet`: Unifying copy feedback, copy fallback, responsive QR sizing, and spacing consistency across platforms (note: no existing spec — will need delta spec referencing the current implementations)

## Impact

- `packages/ui/src/components/SendPage/StepTokenSelect.tsx` — padding fix + skeleton integration
- `packages/ui/src/components/ReceiveSheet/ReceiveSheet.tsx` — responsive QR, consistent spacing
- `apps/mobile/src/components/SendSheet/StepTokenSelect.tsx` — skeleton integration (mobile version)
- `apps/mobile/src/components/ReceiveSheet/ReceiveSheet.tsx` — copy feedback, copy fallback, consistent spacing
- `packages/shared/src/theme/spacing.ts` — possible new tokens if needed for unified gaps
- No breaking changes. No new dependencies. No API changes.
