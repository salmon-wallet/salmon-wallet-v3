## 1. Shared Types & Hook

- [x] 1.1 Create `SendContact` and `SendOwnWallet` interfaces and `UseSendContactsResult` type in `packages/shared/src/types/ui/send-sheet.ts` (alongside existing send types)
- [x] 1.2 Create `useSendContacts` hook in `packages/shared/src/hooks/useSendContacts.ts` that composes `useAccountsContext`, `useAvailableNetworks`, and `useAddressbook` to return filtered contacts (by active networkId, excluding sender) and own wallets (excluding sender), with `isLoading` state
- [x] 1.3 Export `useSendContacts` and its types from `packages/shared/src/hooks/index.ts` and ensure they are accessible via `@salmon/shared`

## 2. i18n

- [x] 2.1 Add `send.myWallets` and `send.addressBook` keys to `packages/shared/src/locales/en/translation.json`
- [x] 2.2 Add `send.myWallets` and `send.addressBook` keys to `packages/shared/src/locales/es/translation.json`

## 3. Mobile — StepAddressAmount Integration

- [x] 3.1 Import and call `useSendContacts` in `apps/mobile/src/components/SendSheet/StepAddressAmount.tsx`, passing the sender address from `account`
- [x] 3.2 Add "My Wallets" section UI below the Recipient input field: section header with `t('send.myWallets')`, list of `TouchableOpacity` rows showing account name + truncated address (`getShortAddress`). Only render when `address` input is empty and `ownWallets.length > 0`. Tapping sets `setAddress(wallet.address)`
- [x] 3.3 Add "Address Book" section UI below "My Wallets": section header with `t('send.addressBook')`, list of `TouchableOpacity` rows showing contact name + truncated address. Only render when `address` input is empty and `contacts.length > 0`. Tapping sets `setAddress(contact.address)`
- [x] 3.4 Add styles for section headers and contact/wallet rows using design tokens (`colors`, `fontFamilyNative`, `ms`, `vs`, `s`)

## 4. Extension — StepAddressAmount Integration

- [x] 4.1 Import and call `useSendContacts` in `apps/extension/src/components/SendPage/StepAddressAmount.tsx`, passing the sender address from `account`
- [x] 4.2 Add "My Wallets" section UI below the Recipient input field: section header with `t('send.myWallets')`, list of MUI `ButtonBase` styled rows showing account name + truncated address. Only render when `address` input is empty and `ownWallets.length > 0`. Clicking sets `setAddress(wallet.address)`
- [x] 4.3 Add "Address Book" section UI below "My Wallets": section header with `t('send.addressBook')`, list of MUI `ButtonBase` styled rows showing contact name + truncated address. Only render when `address` input is empty and `contacts.length > 0`. Clicking sets `setAddress(contact.address)`
- [x] 4.4 Add styled components for section headers and contact/wallet rows using design tokens (`colors`, `fontFamily`, `fontWeight`, `spacing`)

## 5. Typecheck

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/mobile --filter=@salmon/extension` and fix any type errors (shared & mobile pass clean; extension has pre-existing tweetnacl error unrelated to this change)
