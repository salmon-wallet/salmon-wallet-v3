## Context

In v2, `TokenSendPage.js` and `NftsSendPage.js` rendered address book contacts and own wallets inline via `GlobalCollapse` sections. Contacts came from `AppContext.addressBook` (resolved `Address[]`), filtered by `network.id === networkId` and excluding the sender's address. Tapping a contact set `inputAddress`.

In v3, the send flow was rebuilt as a multi-step sheet (`SendSheet`/`SendPage` → `StepAddressAmount`). The address book management exists in settings (uses `useAddressbook` hook, `AddressBookSelector` component), but `StepAddressAmount` was never wired to it. It currently accepts only `token`, `blockchain`, `account`, `onBack`, `onReview`, `onCancel` — no access to contacts or other accounts.

**Existing code to reuse:**
- `useAddressbook` hook (`packages/shared/src/hooks/useAddressbook.ts`) — loads, resolves, and manages contacts
- `useAccountsContext` (`packages/shared/src/contexts/AccountsContext.tsx`) — provides `accounts`, `networkId`, `activeBlockchainAccount`
- `useAvailableNetworks` — provides `allNetworks` for building `NetworkAdapter`
- `AddressBookItem` type (`packages/shared/src/types/settings.ts`) — display-ready contact shape
- `getShortAddress` (`packages/shared/src/utils/address.ts`) — address truncation
- `Address` type (`packages/shared/src/types/address.ts`) — resolved contact with network

## Goals / Non-Goals

**Goals:**
- Restore address book contact selection in the send flow (feature parity with v2)
- Show user's other wallets in the send flow (feature parity with v2)
- Share filtering/resolution logic via a new shared hook, avoiding duplication between mobile and extension
- Both platforms use identical data logic, only UI differs

**Non-Goals:**
- Adding new contacts from the send flow (use settings for that)
- QR code scanning integration (separate feature)
- Changing how the address book is stored or managed
- Modifying the address validation flow (already works via `useAddressValidation`)

## Decisions

### 1. New shared hook `useSendContacts` in `packages/shared/src/hooks/useSendContacts.ts`

**Decision:** Create a thin orchestration hook that composes `useAddressbook` + `useAccountsContext` + `useAvailableNetworks` to produce two filtered lists: contacts and own wallets.

**Rationale:** Both mobile and extension need the exact same filtering logic (filter by networkId, exclude sender). Putting it in a shared hook avoids duplicating this logic in two `StepAddressAmount` implementations. The hook returns platform-agnostic data; the UI layer renders it differently per platform.

**Alternative considered:** Pass contacts as props from `SendSheet`/`SendPage` parents. Rejected because it would require threading `useAddressbook` + `useAccountsContext` + filtering into both parent components, creating more prop drilling and duplication.

**Interface:**
```ts
interface SendContact {
  name: string;
  address: string;
  networkName: string;
  domain?: string | null;
}

interface SendOwnWallet {
  accountName: string;
  address: string;
}

interface UseSendContactsResult {
  contacts: SendContact[];
  ownWallets: SendOwnWallet[];
  isLoading: boolean;
}

function useSendContacts(senderAddress: string): UseSendContactsResult
```

The hook internally reads `networkId` from `useAccountsContext`, builds the `NetworkAdapter` from `useAvailableNetworks`, calls `useAddressbook`, and filters. The `senderAddress` param is used to exclude the sender from both lists.

### 2. Extend `StepAddressAmountPropsBase` — NO prop changes needed

**Decision:** `StepAddressAmount` will call `useSendContacts` internally rather than receiving contacts as props.

**Rationale:** The hook reads context directly. The `account` prop already provides the sender address via `account.getReceiveAddress()` or similar. No new props need to be threaded from parents, keeping the change minimal and non-breaking.

### 3. UI placement: inline sections below the address input

**Decision:** Render contacts and own wallets as scrollable sections directly below the Recipient address input field (before the Amount field), matching v2's layout pattern.

**Rationale:** This is the proven UX from v2. Users see available contacts while filling in the address. No modal or extra navigation needed.

**Mobile:** Use `View` with `Text` section headers and `TouchableOpacity` list items inside the existing `ScrollView`.
**Extension:** Use MUI `Box` and `ButtonBase` styled components with the same layout.

### 4. Contact display format

Each contact row shows:
- Contact name (primary text)
- Truncated address via `getShortAddress` (secondary text)
- Network name (tertiary/chip, if contacts span multiple networks on the same blockchain)

Tapping a contact calls `setAddress(contact.address)` which triggers the existing `useAddressValidation` debounce flow.

### 5. Section visibility logic

- "My Wallets" section: shown only when `ownWallets.length > 0`
- "Address Book" section: shown only when `contacts.length > 0`
- When address input is non-empty, both sections are hidden (user is typing/validating)
- Both sections use i18n keys: `send.myWallets`, `send.addressBook`

## Risks / Trade-offs

- **Risk:** `useAddressbook` requires a `NetworkAdapter`, which is built from `useAvailableNetworks`. This adds hook composition complexity inside `useSendContacts`.
  → **Mitigation:** The same pattern is already used in `settings/address-book.tsx`. Copy the adapter-building logic into the shared hook.

- **Risk:** Loading contacts is async (reads storage). The UI may flash briefly.
  → **Mitigation:** Use `isLoading` from the hook; sections simply don't render while loading. Given contacts are typically few, load time is negligible.

- **Trade-off:** Sections are hidden when address input is non-empty. This means the user can't see contacts while editing. Acceptable because: (a) the input can be cleared to see contacts again, (b) avoids visual clutter during validation.
