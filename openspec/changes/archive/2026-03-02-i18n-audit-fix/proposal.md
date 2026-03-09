## Why

~150 user-visible strings across mobile, web/extension UI, and shared constants are hardcoded in English instead of using the `t()` function from react-i18next. Additionally, 7 keys in the Spanish translation file remain untranslated. This makes the wallet unusable in Spanish for features added after the initial i18n setup (send, swap, bridge, NFT detail, transaction detail, market data). Fixing this now is critical before adding more languages.

## What Changes

- **Replace all hardcoded English strings** in `packages/ui` components (~30 strings across TokenMarketData, TokenInfo, TokenAbout, ActionButtonRow) with `t()` calls
- **Replace all hardcoded English strings** in `apps/mobile` components (~110 strings across SendSheet, SwapScreen, BridgeScreen, NftDetailSheet, NftSendSheet, TransactionDetailModal, ActionButtonRow) with `t()` calls
- **Add missing translation keys** to `packages/shared/src/locales/en/translation.json` for all new `t()` calls (~100 new keys)
- **Add corresponding Spanish translations** to `packages/shared/src/locales/es/translation.json` for all new keys
- **Translate 7 existing keys** in `es/translation.json` that are still in English (onboarding content, bridge alerts)
- **Internationalize `DEFAULT_WALLET_TIPS`** in `packages/shared/src/types/ui.ts` — convert from hardcoded array to translation keys
- **Ensure `apps/web` shared components** inherit the same fixes via `packages/ui`

## Capabilities

### New Capabilities

_None — this change enforces an existing requirement across all components._

### Modified Capabilities

_No spec-level behavior changes — the user-facing functionality is identical. This is a cross-cutting i18n compliance fix that affects implementation only._

## Impact

- **`packages/shared/src/locales/en/translation.json`** — ~100 new keys added across sections: `token.marketData.*`, `token.about.*`, `token.info.*`, `nft.detail.*`, `nft.send.*`, `swap.review.*`, `bridge.recipient.*`, `bridge.review.*`, `transaction.detail.*`, `general.tips.*`
- **`packages/shared/src/locales/es/translation.json`** — Same ~100 new keys with Spanish translations + 7 existing keys fixed
- **`packages/shared/src/types/ui.ts`** — `DEFAULT_WALLET_TIPS` refactored to use translation keys
- **`packages/ui/src/components/`** — 4 components modified (TokenMarketData, TokenInfo, TokenAbout, ActionButtonRow)
- **`apps/mobile/src/components/`** — ~10 components modified (SendSheet/*, SwapScreen/*, BridgeScreen/*, NftDetailSheet, NftSendSheet, TransactionDetailModal, ActionButtonRow, LoadingScreen)
- **No API changes, no dependency additions, no breaking changes**
- **Risk**: Translation key typos could cause missing text — mitigated by keeping English fallback defaults in `t()` calls
