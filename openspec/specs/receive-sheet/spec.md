# receive-sheet Specification

## Purpose
TBD - created by archiving change send-receive-polish. Update Purpose after archive.
## Requirements
### Requirement: Mobile ReceiveSheet shows copy feedback
The `ReceiveSheet` in `apps/mobile/src/components/ReceiveSheet/ReceiveSheet.tsx` SHALL display visual feedback after copying the address: the copy button text SHALL change to "Copied!" with a check icon for 2 seconds, then revert to "Copy address" with the copy icon.

#### Scenario: User copies address on mobile
- **WHEN** user taps the "Copy address" button on mobile ReceiveSheet
- **THEN** the button SHALL display a check icon and "Copied!" text for 2000ms, then revert to the copy icon and "Copy address" text

#### Scenario: Sheet closes while showing copied feedback
- **WHEN** user closes the ReceiveSheet while "Copied!" is displayed
- **THEN** the `copied` state SHALL reset to false so the next open shows "Copy address"

### Requirement: Responsive QR code sizing on web/extension
The `ReceiveSheet` in `packages/ui/src/components/ReceiveSheet/ReceiveSheet.tsx` SHALL calculate QR code size dynamically based on available container width instead of using a fixed 220px value.

#### Scenario: ReceiveSheet opens on web/extension
- **WHEN** ReceiveSheet opens in the BaseSheetDialog
- **THEN** the QR code size SHALL be calculated as available content width minus horizontal padding minus QR border width on both sides

#### Scenario: Fallback for initial render
- **WHEN** the container width has not yet been measured
- **THEN** the QR code SHALL render at a reasonable default size (220px) until measurement completes

### Requirement: Unified QR border width token
Both ReceiveSheet implementations SHALL use `componentSizes.qrBorderWidth` (22px) from `packages/shared/src/theme/spacing.ts` for the QR code white border, replacing the hardcoded 20px (web) and 24px (mobile) values.

#### Scenario: QR code renders on either platform
- **WHEN** ReceiveSheet renders the QR code on web/extension or mobile
- **THEN** the white border around the QR code SHALL be `componentSizes.qrBorderWidth` (22px)

### Requirement: Unified content gap token
Both ReceiveSheet implementations SHALL use `componentSizes.receiveContentGap` (32px) from `packages/shared/src/theme/spacing.ts` for vertical spacing between content elements (QR code, address text, copy button), replacing the hardcoded `spacing.xl` (20px on web) and `vs(42)` (42px on mobile) values.

#### Scenario: ReceiveSheet content layout on either platform
- **WHEN** ReceiveSheet renders its content (QR, address, copy button)
- **THEN** the vertical gap between these elements SHALL be `componentSizes.receiveContentGap` (32px), scaled with `vs()` on mobile

### Requirement: ReceiveSheet strings use i18n
All user-visible strings in ReceiveSheet on both platforms SHALL use `t()` translations: the title "Receive", button text "Copy address", and feedback text "Copied!".

#### Scenario: ReceiveSheet renders with translations
- **WHEN** ReceiveSheet renders on either platform
- **THEN** the title, copy button text, and copied feedback text SHALL be rendered via `t()` using translation keys from `packages/shared/src/locales/`

