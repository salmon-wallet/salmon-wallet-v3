# transaction-success-screen Specification

## Purpose

Define a unified `TransactionSuccessScreen` shown after send and swap transactions complete on mobile and extension. The screen SHALL animate a checkmark, display a transaction-specific summary, conditionally surface a "View on Explorer" link via `getTransactionUrl`, return the user home via Continue, and route every visible string through i18n. Mobile additionally fires success haptics on mount, and `SendStep` SHALL include `'success'` so send flows can transition to it.

## Requirements

### Requirement: Unified transaction success screen displays after successful transaction

The system SHALL display a `TransactionSuccessScreen` component after a transaction (send or swap) completes successfully. The screen MUST show:
1. An animated green checkmark circle
2. A title indicating the transaction type (e.g., "Send Complete", "Swap Complete")
3. A summary of the transaction (e.g., "5.0 SOL to 7hQ9...xK2f" for send, "5.0 SOL → 84.65 USDC" for swap)
4. A "View on Explorer" link that opens the transaction in the blockchain explorer (conditionally shown when explorer URL is available)
5. A "Continue" button that navigates the user back to the home screen

Both mobile and extension platforms MUST implement this screen using their respective animation systems.

#### Scenario: Send transaction completes successfully on mobile
- **WHEN** a send transaction completes successfully in the mobile SendSheet
- **THEN** the SendSheet transitions to step `'success'` and renders TransactionSuccessScreen with the send title, summary showing amount + token + truncated recipient, explorer link for the txId, and a Continue button

#### Scenario: Send transaction completes successfully on extension
- **WHEN** a send transaction completes successfully in the extension SendPage
- **THEN** the SendPage transitions to step `'success'` and renders TransactionSuccessScreen with the same information as mobile

#### Scenario: Swap transaction completes successfully on mobile
- **WHEN** a swap transaction completes successfully in the mobile SwapScreen
- **THEN** the SwapScreen renders TransactionSuccessScreen (replacing the previous SwapSuccessScreen) with swap title, summary showing inAmount/inSymbol → outAmount/outSymbol, explorer link, and Continue button

#### Scenario: Swap transaction completes successfully on extension
- **WHEN** a swap transaction completes successfully in the extension SwapScreen
- **THEN** the SwapScreen renders TransactionSuccessScreen with the same information as mobile

### Requirement: Success screen animation sequence

The TransactionSuccessScreen MUST display an animated entrance sequence with staggered timing:
1. Green checkmark circle scales in (spring animation on mobile, CSS scale keyframe on extension)
2. Checkmark symbol fades in (200ms delay)
3. Title and summary text fade in (400ms delay)
4. Explorer link fades in (500ms delay)
5. Continue button fades in (600ms delay)

On mobile, the screen MUST trigger a success haptic feedback on mount.

#### Scenario: Animation plays on mount (mobile)
- **WHEN** TransactionSuccessScreen mounts on mobile
- **THEN** the system triggers haptic success feedback AND the checkmark circle scales from 0 to 1 with spring physics, followed by staggered fade-in of checkmark, text, explorer link, and button

#### Scenario: Animation plays on mount (extension)
- **WHEN** TransactionSuccessScreen mounts on extension
- **THEN** the checkmark circle scales in with CSS cubic-bezier animation, followed by staggered fade-in of text, explorer link, and button using CSS keyframes

### Requirement: View on Explorer opens transaction in blockchain explorer

The success screen MUST include a "View on Explorer" link that opens the transaction URL in the appropriate blockchain explorer. The URL MUST be generated using the existing `getTransactionUrl` function from `packages/shared/src/config/explorers.ts`.

The link SHALL be conditionally rendered — hidden when no explorer URL is available (e.g., unsupported network).

#### Scenario: User taps View on Explorer on mobile
- **WHEN** the user taps the "View on Explorer" link on mobile
- **THEN** the system opens the transaction URL using `Linking.openURL`

#### Scenario: User clicks View on Explorer on extension
- **WHEN** the user clicks the "View on Explorer" link on extension
- **THEN** the system opens the transaction URL in a new tab using `window.open`

#### Scenario: Explorer URL is unavailable
- **WHEN** `getTransactionUrl` returns null for the given blockchain/network/txId combination
- **THEN** the "View on Explorer" link is NOT rendered on the success screen

### Requirement: Continue button navigates to home screen

The "Continue" button MUST dismiss the success screen and navigate the user back to the home screen.

#### Scenario: User taps Continue after send on mobile
- **WHEN** the user taps "Continue" on the send success screen (mobile)
- **THEN** the SendSheet closes, state resets, and the user sees the home screen

#### Scenario: User taps Continue after send on extension
- **WHEN** the user taps "Continue" on the send success screen (extension)
- **THEN** the SendPage navigates back and the user sees the home screen

#### Scenario: User taps Continue after swap
- **WHEN** the user taps "Continue" on the swap success screen (either platform)
- **THEN** the swap flow resets to the input step and navigates to the home screen (preserving existing behavior from `handleSuccessContinue`)

### Requirement: SendStep type includes success step

The `SendStep` type in `packages/shared/src/types/ui/send-sheet.ts` MUST include `'success'` as a valid step so that send flow components can transition to the success screen.

#### Scenario: SendStep union type
- **WHEN** the SendStep type is defined
- **THEN** it SHALL be `'token-select' | 'address-amount' | 'confirmation' | 'success'`

### Requirement: All user-visible strings use i18n

All text displayed on the TransactionSuccessScreen MUST use i18n translation keys via `t()`. New keys MUST be added to both `en` and `es` translation files.

Required keys: title strings for send/swap complete, "View on Explorer" label, "Continue" button label.

#### Scenario: English translations exist
- **WHEN** the app renders TransactionSuccessScreen in English
- **THEN** all strings are resolved from `packages/shared/src/locales/en/translation.json`

#### Scenario: Spanish translations exist
- **WHEN** the app renders TransactionSuccessScreen in Spanish
- **THEN** all strings are resolved from `packages/shared/src/locales/es/translation.json`
