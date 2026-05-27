## Context

`apps/web` es una Vite SPA con react-router-dom que actualmente tiene páginas placeholder. Los componentes UI ya están en `@salmon/ui` y los hooks de datos en `@salmon/shared`. La extensión (`apps/extension/src/pages/home/HomePage.tsx`, ~1487 líneas) tiene todo cableado mediante state machines (`currentPage` state). Hay que replicar ese cableado adaptándolo a rutas URL.

**Estado actual**: 6 páginas placeholder (HomePage, TokenDetailRoute, SendRoute, ActivityRoute, NftDetailRoute, NftSeeAllRoute) que solo muestran texto "coming soon".

**Patrón de referencia**: `apps/extension/src/pages/home/HomePage.tsx` — usa `useAccountsContext`, `useBalance`, `useTransactions`, `useUserConfig`, `useAvailableNetworks`, `useCurrencyContext` y maneja navegación con `setCurrentPage(page)`.

## Goals / Non-Goals

**Goals:**
- Cablear los componentes de `@salmon/ui` con los hooks de `@salmon/shared` en cada página web
- Adaptar la navegación de state-machine a react-router-dom (`useNavigate`, `useParams`)
- Replicar la funcionalidad completa de la extensión en la web app
- Mantener privacy mode (hiddenBalance), network switching, account switching

**Non-Goals:**
- No crear componentes nuevos en `@salmon/ui` — usar los existentes tal cual
- No crear hooks nuevos en `@salmon/shared` — todos los necesarios ya existen
- No modificar `apps/extension` ni `packages/shared`
- No implementar browser extension APIs — la web app no necesita content scripts ni background workers

## Decisions

### 1. HomePage: Monolítico con tabs internos (como la extensión)

**Decisión**: El HomePage maneja los 3 tabs (home/collectibles/swap) con state local `activeTab`, exactamente como la extensión.

**Alternativa considerada**: Rutas separadas `/home`, `/collectibles`, `/swap`. Descartado porque los tabs comparten estado (balance, account, network) y el patrón de la extensión ya funciona bien.

**Implementación**: Copiar la estructura del HomePage de la extensión, reemplazando `setCurrentPage('tokenDetail')` por `navigate('/token/${address}')`, etc.

### 2. Token detail: URL param + re-fetch vs location state

**Decisión**: Usar URL param `/token/:address` + re-buscar el token en `useBalance().tokens` por address. Si no se encuentra (deep link), fetchar con `useToken()`.

**Alternativa considerada**: Pasar el token completo via `navigate('/token/X', { state: { token } })`. Descartado porque rompe deep links y refresh del browser.

### 3. NFTs: Fetch en CollectiblesTab, pasar via location state

**Decisión**: Los NFTs se fetchean en el CollectiblesTab (como la extensión los fetchea en CollectiblesPage). Para NftDetail y NftSeeAll, pasar los datos via location state + fallback a re-fetch si state es null (deep link).

**Razón**: Los NFTs no tienen un hook simple `useNft(mint)` — se obtienen en batch. Location state evita re-fetches innecesarios.

### 4. Sheets como componentes inline (no rutas)

**Decisión**: ReceiveSheet, WalletSwitcherSheet y SettingsSheet se renderizan como overlays en el HomePage controlados por state (`showReceive`, `showSwitcher`, `showSettings`), no como rutas separadas.

**Razón**: Son dialogs/sheets transitorios que no merecen URL propia. Es el patrón que usa la extensión.

### 5. Chart data y market data: fetch local en TokenDetailRoute

**Decisión**: TokenDetailRoute hace sus propios fetches de chart/market data usando `getMarketChart()` y `getCoinInfo()` de `@salmon/shared`, igual que la extensión.

**Razón**: Estos datos solo se necesitan en el detail view, no en el listing.

### 6. CollectiblesTab: Replicar CollectiblesPage de extensión

**Decisión**: Crear un componente `CollectiblesTab` en `apps/web/src/pages/home/` que replique la lógica de `apps/extension/src/pages/collectibles/CollectiblesPage.tsx` — fetchea NFTs por blockchain, renderiza NftCarouselSection por chain.

### 7. SwapTab: Replicar SwapPage de extensión

**Decisión**: Crear un componente `SwapTab` que instancia SwapScreen + bridge de `@salmon/ui`, cableado con `useSwap()` y `useBridge()`.

## Risks / Trade-offs

- **[Bundle size]** → El chunk principal ya es 3.5MB. Agregar más componentes de UI lo aumentará. Mitigación: las rutas ya usan lazy loading (`lazy: () => import(...)`).
- **[Deep links sin data]** → Si alguien navega directo a `/token/SOL_ADDRESS` sin pasar por home, necesitamos fetchear el token. Mitigación: fallback a `useToken()` hook.
- **[NFT fetch performance]** → NFTs se fetchean cada vez que el tab cambia. Mitigación: el hook de NFTs tiene cache interno.

## Migration Plan

No aplica — es una implementación nueva sin datos que migrar.

## Open Questions

Ninguna — la implementación replica el patrón probado de la extensión.
