## Why

The address book (contact selector) is completely disconnected from the send flow in v3. In v2, the send pages had a collapsible section showing saved contacts filtered by the active network, plus a "My Wallets" section showing the user's other accounts. In v3, `StepAddressAmount` (both mobile and extension) uses a plain `TextInput` with no way to select from saved contacts or own wallets. Users must manually type or paste every address, defeating the purpose of the address book feature that already exists in settings.

## What Changes

- Add a contact list section to `StepAddressAmount` in both mobile and extension, showing address book contacts filtered by the active network
- Add a "My Wallets" section showing the user's other blockchain accounts (excluding the sender)
- Tapping a contact or wallet auto-fills the address input field
- Create a shared hook `useSendContacts` in `packages/shared` that encapsulates the logic for loading, filtering contacts by network, and filtering own wallets (excluding sender) — consumed by both mobile and extension
- Add new shared base prop types to pass `networkId` and `accounts` data to `StepAddressAmount`

## Capabilities

### New Capabilities
- `send-contact-selector`: Contact and wallet selection UI integrated into the send flow's address step, with network-aware filtering and auto-fill behavior

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **packages/shared**: New `useSendContacts` hook, updated `StepAddressAmountPropsBase` type to include `networkId` and `accounts`
- **apps/mobile**: Updated `StepAddressAmount.tsx` to render contact/wallet lists, updated `SendSheet.tsx` to pass new props
- **apps/extension**: Updated `StepAddressAmount.tsx` to render contact/wallet lists, updated `SendPage.tsx` to pass new props
- **i18n**: New translation keys for "Address Book" and "My Wallets" section labels
- **Dependencies**: Reuses existing `useAddressbook` hook, `useAccountsContext`, `AddressBookItem` type, `getShortAddress` util
