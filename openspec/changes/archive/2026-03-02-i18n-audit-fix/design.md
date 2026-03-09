## Context

The project uses i18next + react-i18next with translation files at `packages/shared/src/locales/{en,es}/translation.json`. Older components (settings, onboarding, lock, wallet creation) correctly use `t()`. Newer components (send sheet, swap, bridge, NFT, transaction detail, market data) were built with hardcoded English strings, bypassing the i18n system entirely.

The existing key structure uses dot-notation namespaces: `tabs.*`, `general.*`, `actions.*`, `settings.*`, `token.*`, `swap.*`, `bridge.*`, `nft.*`, `transactions.*`, `wallet.*`, `lock.*`, `transaction.*`, `accessibility.*`.

## Goals / Non-Goals

**Goals:**
- Every user-visible string in every component uses `t()` from `useTranslation()`
- All new keys have English and Spanish translations
- Fix existing untranslated Spanish entries
- Consistent key naming that follows existing conventions
- English fallback defaults in `t()` calls to prevent blank text on key typos

**Non-Goals:**
- Adding new languages beyond en/es
- Creating a linter/CI check for hardcoded strings (future improvement)
- Translating accessibility labels (aria-label, accessibilityLabel) — these remain English for screen reader compatibility unless platform-specific localization is needed
- Translating technical identifiers (blockchain names in badges, provider names like "StealthEX", "Jupiter")

## Decisions

### 1. Key namespace structure — Extend existing namespaces

**Decision**: Add new keys within existing top-level namespaces rather than creating new ones.

**Rationale**: The current structure already has `token.*`, `swap.*`, `bridge.*`, `nft.*`, `transactions.*`. Adding sub-groups within these keeps the hierarchy flat and discoverable.

**Key mapping:**

| Component | Namespace | Example keys |
|-----------|-----------|-------------|
| TokenMarketData | `token.marketData.*` | `token.marketData.marketCap`, `token.marketData.rank` |
| TokenInfo | `token.info.*` | `token.info.about`, `token.info.marketStats`, `token.info.visitWebsite` |
| TokenAbout | `token.about.*` | `token.about.readMore`, `token.about.readLess` |
| ActionButtonRow | `actions.*` | Reuse existing `actions.send`, `actions.receive`; add `actions.activity` |
| SendSheet steps | `token.send.*` | `token.send.recipient`, `token.send.amount`, `token.send.reviewAndSend` |
| SwapInputScreen | `swap.*` | Reuse existing `swap.you_send`, `swap.you_receive`, `swap.enter_amount` |
| SwapReviewScreen | `swap.review.*` | `swap.review.title`, `swap.review.salmonFee`, `swap.review.pleaseNote` |
| BridgeRecipientScreen | `bridge.recipient.*` | `bridge.recipient.title`, `bridge.recipient.description` |
| BridgeReviewScreen | `bridge.review.*` | `bridge.review.title`, `bridge.review.fromNetwork` |
| NftDetailSheet | `nft.detail.*` | `nft.detail.tokenStandard`, `nft.detail.compressed` |
| NftSendSheet | `nft.send.*` | `nft.send.title`, `nft.send.sending` |
| TransactionDetailModal | `transactions.detail.*` | `transactions.detail.sent`, `transactions.detail.swapRoute` |
| LoadingScreen tips | `general.tips.*` | `general.tips.0` through `general.tips.9` |

### 2. Fallback defaults in every `t()` call

**Decision**: Always provide English fallback as second argument: `t('key', 'English text')`.

**Rationale**: If a key is mistyped or missing from a language file, the UI still shows readable English rather than the raw key string. This is the existing pattern used by well-translated components like LanguageSelector.

### 3. DEFAULT_WALLET_TIPS — Convert to translation key array

**Decision**: Keep `DEFAULT_WALLET_TIPS` as a constant array of translation keys (strings), and resolve them via `t()` at render time in LoadingScreen.

```ts
// Before (packages/shared/src/types/ui.ts)
export const DEFAULT_WALLET_TIPS = ['Never share...', ...] as const;

// After
export const DEFAULT_WALLET_TIP_KEYS = [
  'general.tips.0', 'general.tips.1', ...
] as const;
```

**Rationale**: Keeps the tips definition in shared (no React dependency), while actual translation happens in the component. The LoadingScreen already receives tips as a prop, so it just maps through `t()`.

**Alternative considered**: Using a single `general.tips` key with an array value — rejected because i18next handles flat key-value pairs better than arrays, and numbered keys are simpler to manage.

### 4. Strings that should NOT be translated

**Decision**: The following remain hardcoded (not i18n):
- Brand names: "Salmon Wallet", "StealthEX", "Jupiter", "Hyperspace"
- Blockchain names in technical contexts: "Solana", "Ethereum", "Bitcoin" (when used as network identifiers, not UI labels)
- Percentage formats: "25%", "50%", "MAX" (quick fill buttons — these are universal)
- Numeric placeholders: "0"
- Accessibility labels (aria-label / accessibilityLabel) — kept in English for now

**Rationale**: Brand/technical terms are universal. Quick fill percentages and numeric placeholders are understood across languages.

### 5. Implementation order — Translation files first, then components

**Decision**:
1. First add all new keys to `en/translation.json` and `es/translation.json`
2. Then update components group by group (packages/ui first, then apps/mobile by feature area)

**Rationale**: Having all keys in place before touching components avoids broken intermediate states. Also enables parallel work since the key names are defined upfront.

### 6. Address placeholder translation — Use interpolation

**Decision**: For address placeholders like "Solana Address", "Ethereum Address", use a single key with interpolation: `t('token.send.blockchainAddress', { blockchain: 'Solana' })`.

**Rationale**: Avoids creating separate keys per blockchain. The blockchain name is not translated (it's a proper noun), but the word "Address" is.

## Risks / Trade-offs

- **Key typos** → Mitigated by always including English fallback in `t()` calls
- **Spanish translation quality** → Some translations may need review by a native speaker; we produce best-effort translations matching the existing `es/translation.json` tone and style
- **Large diff** → ~15 component files + 2 JSON files changed. Mitigated by grouping into logical commits (translation files first, then component groups)
- **Missed strings** → The audit was thorough but new hardcoded strings could be introduced in future PRs. A linting rule would be the long-term fix (non-goal for now)
