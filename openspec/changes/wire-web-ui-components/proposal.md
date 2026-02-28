## Why

Las páginas de `apps/web` son placeholders ("coming soon") que no usan los componentes reales de `@salmon/ui`. Los componentes ya están extraídos y exportados (WalletHeader, BalanceCardCarousel, TokenList, TokenDetailPage, SendPage, TransactionHistoryPage, NftDetailPage, NftSeeAllPage, SwapScreen, etc.) pero las páginas web no los importan ni los conectan con los hooks de datos (`useBalance`, `useTransactions`, `useMultiChainTokens`, `useSwap`, etc.). La extensión ya tiene este cableado funcionando — hay que replicar el patrón adaptándolo a react-router-dom.

## What Changes

- Reemplazar `HomePage` placeholder con el componente real: WalletHeader + BalanceCardCarousel + ActionButtonRow + TokenList + tabs (home/collectibles/swap)
- Reemplazar `TokenDetailRoute` placeholder con TokenDetailPage de @salmon/ui, cableado con chart data y market data vía API de CoinGecko
- Reemplazar `SendRoute` placeholder con SendPage de @salmon/ui, cableado con `useSendTransaction`
- Reemplazar `ActivityRoute` placeholder con TransactionHistoryPage + TransactionDetailModal
- Reemplazar `NftDetailRoute` placeholder con NftDetailPage + NftSendDialog
- Reemplazar `NftSeeAllRoute` placeholder con NftSeeAllPage
- Agregar CollectiblesTab al HomePage (NftCarouselSection para cada blockchain)
- Agregar SwapTab al HomePage (SwapScreen + BridgeScreen)
- Agregar sheets: ReceiveSheet, WalletSwitcherSheet, SettingsSheet como dialogs en la web app
- Agregar `useUserConfig` y `useAvailableNetworks` al flujo de datos del HomePage

## Capabilities

### New Capabilities
- `web-home-page`: HomePage completo con WalletHeader, BalanceCardCarousel, ActionButtonRow, TokenList, tabs, sheets (receive, wallet-switcher, settings)
- `web-token-detail`: TokenDetailPage con chart data, market data, period selector
- `web-send-flow`: SendPage cableado con useSendTransaction y fee estimation
- `web-activity`: TransactionHistoryPage con infinite scroll y TransactionDetailModal
- `web-nft-pages`: NftDetailPage, NftSeeAllPage, NftCarouselSection en collectibles tab
- `web-swap-bridge`: SwapScreen y BridgeScreen en swap tab

### Modified Capabilities

(ninguna — no se modifican specs existentes)

## Impact

- **Archivos modificados**: 6 archivos en `apps/web/src/pages/` (reemplazo de placeholders)
- **Archivos nuevos**: ~2-3 archivos auxiliares (CollectiblesTab, SwapTab si se separan)
- **Dependencias**: Ninguna nueva — todos los hooks y componentes ya existen en `@salmon/shared` y `@salmon/ui`
- **Paquetes afectados**: Solo `apps/web` — no se toca `@salmon/shared`, `@salmon/ui`, ni `apps/extension`
- **Riesgo**: Bajo — es cableado de componentes existentes con hooks existentes, adaptado a react-router
