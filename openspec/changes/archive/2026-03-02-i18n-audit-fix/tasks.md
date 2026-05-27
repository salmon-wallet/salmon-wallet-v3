## 1. Translation files — Add new keys and fix existing

- [x] 1.1 Add `actions.activity`, `token.marketData.*` (marketCap, rank, volume24h, high24h, low24h, circulatingSupply, totalSupply, maxSupply, allTimeHigh, fromATH, athDate, allTimeLow, fromATL, atlDate), `token.info.*` (about, marketStats, marketCap, volume24h, circulating, totalSupply, maxSupply, contractAddress, visitWebsite, contractAddressCopied), `token.about.*` (readMore, readLess) keys to `packages/shared/src/locales/en/translation.json`
- [x] 1.2 Add `token.send.recipient`, `token.send.amount`, `token.send.reviewAndSend`, `token.send.blockchainAddress`, `token.send.networkFee`, `token.send.sending`, `token.send.retry` keys to `en/translation.json` (reuse existing `actions.cancel`, `actions.confirm`)
- [x] 1.3 Add `swap.review.*` (title, salmonFee, route, totalPriceImpact, pleaseNote, pleaseNoteText, confirmSwap, priorityFee, rentFee, slippageTolerance, minimumReceived, swapMode, reviewAndSwap) keys to `en/translation.json`
- [x] 1.4 Add `bridge.recipient.*` (title, description, destinationAddress, enterRecipientAddress, important, importantText, review) and `bridge.review.*` (title, youReceiveEstimated, recipient, fromNetwork, toNetwork, minimumAmount, estimatedOutput, provider, pleaseNote, pleaseNoteText, confirmSwap) keys to `en/translation.json`
- [x] 1.5 Add `nft.detail.*` (tokenStandard, compressed, collectionVerified, royalties, tokenType, contract, tokenId, balance, inscriptionNumber, rarity, contentType, genesisBlock) and `nft.send.*` (title, sending, enterRecipientAddress, ordinalsNotSupported) keys to `en/translation.json`
- [x] 1.6 Add `transactions.detail.*` (sent, received, swapped, minted, burned, staked, loan, interaction, unknown, completed, failed, pending, processed, confirmed, finalized, nftDetails, collection, attributes, dateTime, confirmation, block, conversion, swapRoute, addresses, networkFee, swapFee, transactionHash, developerInfo, heliusType, accountsInvolved, programs, innerSwaps, swapFees, sentLabel, receivedLabel, priceImpact, rate) keys to `en/translation.json`
- [x] 1.7 Add `general.tips.0` through `general.tips.9` keys to `en/translation.json` with the current English tip strings from `DEFAULT_WALLET_TIPS`
- [x] 1.8 Add all corresponding Spanish translations for tasks 1.1–1.7 to `packages/shared/src/locales/es/translation.json`
- [x] 1.9 Fix 7 existing untranslated keys in `es/translation.json`: translate `wallet.onboarding.content1`, `wallet.onboarding.title2`, `wallet.onboarding.content2`, `wallet.onboarding.title3`, `wallet.onboarding.content3`, `bridge.own_wallet_alert`, `bridge.other_wallet_alert` to Spanish

## 2. Shared — Refactor DEFAULT_WALLET_TIPS

- [x] 2.1 In `packages/shared/src/types/ui.ts`, rename `DEFAULT_WALLET_TIPS` to `DEFAULT_WALLET_TIP_KEYS` and convert values from English strings to translation key identifiers (`general.tips.0` through `general.tips.9`). Keep the old export name as a deprecated alias if needed for backward compat, or update all consumers.

## 3. packages/ui — Internationalize web/extension components

- [x] 3.1 Add `useTranslation()` to `packages/ui/src/components/TokenMarketData/TokenMarketData.tsx` and replace all 14 hardcoded label strings with `t()` calls using `token.marketData.*` keys. Replace default `title = 'Info'` prop with `t('token.marketData.title', 'Info')`.
- [x] 3.2 Add `useTranslation()` to `packages/ui/src/components/TokenInfo/TokenInfo.tsx` and replace all 10 hardcoded strings ("About", "Market Stats", "Market Cap", "24h Volume", "Circulating", "Total Supply", "Max Supply", "Contract Address", "Visit Website", snackbar message) with `t()` calls using `token.info.*` keys.
- [x] 3.3 Add `useTranslation()` to `packages/ui/src/components/TokenAbout/TokenAbout.tsx` and replace default `title = 'About'` and "Read more"/"Read less" with `t()` calls using `token.about.*` keys.
- [x] 3.4 Add `useTranslation()` to `packages/ui/src/components/ActionButtonRow/ActionButtonRow.tsx` and replace "Send", "Receive", "Activity" with `t('actions.send')`, `t('actions.receive')`, `t('actions.activity')`.

## 4. apps/mobile — Internationalize Send flow

- [x] 4.1 In `apps/mobile/src/components/ActionButtonRow/ActionButtonRow.tsx`, add `useTranslation()` and replace "Send", "Receive", "Activity" with `t('actions.send')`, `t('actions.receive')`, `t('actions.activity')`.
- [x] 4.2 In `apps/mobile/src/components/SendSheet/StepAddressAmount.tsx`, replace hardcoded "Recipient", "Amount", "Cancel", "Review & Send" and address placeholders with `t()` calls. Use `t('token.send.blockchainAddress', { blockchain })` for dynamic placeholders.
- [x] 4.3 In `apps/mobile/src/components/SendSheet/StepConfirmation.tsx`, add `useTranslation()` and replace "Network Fee:", "Sending...", "CANCEL", "CONFIRM", "RETRY" with `t()` calls reusing `actions.cancel`, `actions.confirm`, `actions.retry` and new `token.send.*` keys.
- [x] 4.4 In `apps/mobile/src/components/SendSheet/StepTokenSelect.tsx`, replace "Search..." and "Select Token" with `t('actions.search_placeholder')` and `t('wallet.select_token')`.

## 5. apps/mobile — Internationalize Swap flow

- [x] 5.1 In `apps/mobile/src/components/SwapScreen/SwapInputScreen.tsx`, replace "You Send", "You Receive", "Enter an amount", "Includes 0.5% platform fee", "Review & Swap" with `t()` calls reusing existing `swap.*` keys and new `swap.review.reviewAndSwap`.
- [x] 5.2 In `apps/mobile/src/components/SwapScreen/SwapReviewScreen.tsx`, replace all ~15 hardcoded strings ("Swap Review", "You Send", "You Receive", "Salmon fee", "Router", "Route", "Gasless", "Yes", "Priority Fee", etc.) with `t()` calls using `swap.*` and `swap.review.*` keys.
- [x] 5.3 In `apps/mobile/src/components/SwapScreen/SwapAmountInput.tsx`, replace "Select" with `t('actions.select')`.

## 6. apps/mobile — Internationalize Bridge flow

- [x] 6.1 In `apps/mobile/src/components/BridgeScreen/BridgeRecipientScreen.tsx`, replace all ~7 hardcoded strings ("Recipient Address", description, "Destination Address", "Enter recipient address", "Important", warning text, "Back", "Review") with `t()` calls using `bridge.recipient.*` keys.
- [x] 6.2 In `apps/mobile/src/components/BridgeScreen/BridgeReviewScreen.tsx`, replace all ~12 hardcoded strings ("Swap Review", "You Send", "You Receive (estimated)", detail labels, "Please Note", warning text, "Confirm Swap") with `t()` calls using `bridge.review.*` keys.

## 7. apps/mobile — Internationalize NFT components

- [x] 7.1 In `apps/mobile/src/components/NftDetailSheet/NftDetailSheet.tsx`, replace all ~15 hardcoded strings ("Description", "Attributes", "Details", "Send", "Burn", "Token Standard", "Compressed", "Collection Verified", "Royalties", "Token Type", "Contract", "Token ID", "Balance", "Inscription #", "Rarity", "Content Type", "Genesis Block") with `t()` calls using `nft.detail.*` keys.
- [x] 7.2 In `apps/mobile/src/components/NftSendSheet/NftSendSheet.tsx`, replace "Send NFT", "Sending NFT...", "Enter recipient address", "Recipient", "Cancel", "Send", "Ordinal transfers are not yet supported." with `t()` calls using `nft.send.*` and existing `actions.*` keys.

## 8. apps/mobile — Internationalize Transaction detail

- [x] 8.1 In `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx`, replace hardcoded `TRANSACTION_TYPE_CONFIG` labels ("Sent", "Received", "Swapped", etc.), `STATUS_CONFIG` labels ("Completed", "Failed", "Pending"), `CONFIRMATION_STATUS_CONFIG` labels ("Processed", "Confirmed", "Finalized"), and all section headers with `t()` calls using `transactions.detail.*` keys. Convert static config objects to use `t()` inside the component (or use a getter function).

## 9. apps/mobile — Internationalize LoadingScreen tips

- [x] 9.1 In `apps/mobile/src/components/LoadingScreen/LoadingScreen.tsx`, update tip rendering to resolve `DEFAULT_WALLET_TIP_KEYS` through `t()`. Add `useTranslation()` and map each tip key to `t(tipKey)`.
- [x] 9.2 In `packages/ui/src/components/LoadingScreen/LoadingScreen.tsx` (web version), apply the same tip key resolution via `t()` if tips are displayed.

## 10. Verification

- [x] 10.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` to verify no type errors in shared and ui packages
- [x] 10.2 Run `pnpm turbo run typecheck` for full monorepo typecheck
- [x] 10.3 Verify both translation JSON files have identical key structures (no missing keys in either language)
