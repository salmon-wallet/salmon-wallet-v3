# i18n-compliance Specification

## Purpose
TBD - created by archiving change i18n-audit-fix. Update Purpose after archive.
## Requirements
### Requirement: All user-visible strings use translation keys
Every user-visible string rendered in `packages/ui` components and `apps/mobile` components SHALL use the `t()` function from `react-i18next` instead of hardcoded English text. Each `t()` call MUST include an English fallback as the second argument.

#### Scenario: packages/ui component renders translated text
- **WHEN** any component in `packages/ui/src/components/` renders user-visible text (labels, titles, buttons, placeholders, snackbar messages)
- **THEN** the text MUST be wrapped in `t('namespace.key', 'English fallback')` using `useTranslation()` from `react-i18next`

#### Scenario: apps/mobile component renders translated text
- **WHEN** any component in `apps/mobile/src/components/` renders user-visible text
- **THEN** the text MUST be wrapped in `t('namespace.key', 'English fallback')` using `useTranslation()` from `react-i18next`

#### Scenario: Fallback prevents blank UI on missing key
- **WHEN** a translation key is missing from a language file
- **THEN** the English fallback text provided in the `t()` call SHALL be displayed instead of a raw key string

### Requirement: Translation files contain all keys in both languages
`packages/shared/src/locales/en/translation.json` and `packages/shared/src/locales/es/translation.json` SHALL contain identical key structures. Every key present in `en` MUST also be present in `es` with a Spanish translation (not English text).

#### Scenario: New keys added to English file
- **WHEN** a new translation key is added to `en/translation.json`
- **THEN** the same key MUST be added to `es/translation.json` with a Spanish translation

#### Scenario: No untranslated Spanish entries
- **WHEN** inspecting `es/translation.json`
- **THEN** no value SHALL contain English text (except for brand names, technical identifiers, and universal terms like "USD", "SOL", "NFT")

### Requirement: Existing untranslated Spanish keys are fixed
The following 7 keys in `es/translation.json` that currently contain English text SHALL be replaced with proper Spanish translations:
- `wallet.onboarding.content1`
- `wallet.onboarding.title2`
- `wallet.onboarding.content2`
- `wallet.onboarding.title3`
- `wallet.onboarding.content3`
- `bridge.own_wallet_alert`
- `bridge.other_wallet_alert`

#### Scenario: Onboarding content displayed in Spanish
- **WHEN** the app language is set to Spanish and the user views the onboarding screens
- **THEN** the content text (`content1`, `title2`, `content2`, `title3`, `content3`) SHALL display in Spanish

#### Scenario: Bridge alerts displayed in Spanish
- **WHEN** the app language is set to Spanish and the user sees bridge wallet alerts
- **THEN** the alert messages (`own_wallet_alert`, `other_wallet_alert`) SHALL display in Spanish

### Requirement: Wallet tips are translatable
The `DEFAULT_WALLET_TIPS` constant in `packages/shared/src/types/ui.ts` SHALL be converted from hardcoded English strings to an array of translation key identifiers. The LoadingScreen component SHALL resolve these keys via `t()` at render time.

#### Scenario: Tips displayed in user's language
- **WHEN** the LoadingScreen displays cycling tips
- **THEN** each tip SHALL be resolved through `t()` and display in the user's selected language

#### Scenario: Tips keys exist in both language files
- **WHEN** inspecting `en/translation.json` and `es/translation.json`
- **THEN** both files SHALL contain keys `general.tips.0` through `general.tips.9` with translated content

### Requirement: Translation key namespaces follow existing conventions
New translation keys SHALL be organized under existing top-level namespaces in the translation JSON files. Keys SHALL use dot-notation and camelCase for the leaf key name.

#### Scenario: Market data keys use token namespace
- **WHEN** TokenMarketData or TokenInfo components need translation keys for market labels
- **THEN** keys SHALL be placed under `token.marketData.*` or `token.info.*` respectively

#### Scenario: Swap review keys use swap namespace
- **WHEN** SwapReviewScreen needs translation keys for review labels
- **THEN** keys SHALL be placed under `swap.review.*`

#### Scenario: Bridge screen keys use bridge namespace
- **WHEN** BridgeRecipientScreen or BridgeReviewScreen need translation keys
- **THEN** keys SHALL be placed under `bridge.recipient.*` or `bridge.review.*` respectively

#### Scenario: NFT detail keys use nft namespace
- **WHEN** NftDetailSheet or NftSendSheet need translation keys
- **THEN** keys SHALL be placed under `nft.detail.*` or `nft.send.*` respectively

#### Scenario: Transaction detail keys use transactions namespace
- **WHEN** TransactionDetailModal needs translation keys
- **THEN** keys SHALL be placed under `transactions.detail.*`

#### Scenario: Reuse existing keys where available
- **WHEN** a component needs a translation for "Send", "Receive", "Cancel", "Confirm", or other common actions
- **THEN** the component SHALL reuse the existing key from `actions.*` (e.g., `actions.send`, `actions.receive`, `actions.cancel`, `actions.confirm`) instead of creating a duplicate key

### Requirement: Certain strings are exempt from translation
Brand names, blockchain identifiers in technical contexts, percentage labels in quick-fill buttons, numeric placeholders, and accessibility labels (aria-label / accessibilityLabel) SHALL NOT be required to use `t()`.

#### Scenario: Brand name remains untranslated
- **WHEN** the UI displays "Salmon Wallet", "StealthEX", "Jupiter", or "Hyperspace"
- **THEN** these strings SHALL remain as hardcoded English text

#### Scenario: Quick fill percentages remain untranslated
- **WHEN** the send flow displays quick fill buttons "25%", "50%", "MAX"
- **THEN** these labels SHALL remain as hardcoded text (universal across languages)

