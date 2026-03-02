## Context

La web app usa tokens de tipografía de `@salmon/shared` que referencian `fontFamily: 'DM Sans'`, pero no declara `@font-face` ni sirve los archivos `.ttf`. El resultado es que el navegador usa el fallback `sans-serif` del sistema.

Estado actual por plataforma:
- **Mobile** (`apps/mobile`): Carga 7 pesos (300-900) + SpaceMono via `expo-font` / `useFonts()` en `_layout.tsx`
- **Extension** (`apps/extension`): Declara 3 pesos (400, 500, 700) en `src/assets/fonts.css` con `@font-face`, sirve `.ttf` desde `public/fonts/`
- **Web** (`apps/web`): No tiene nada — ni CSS, ni archivos de fuente en `public/`

Los archivos fuente `.ttf` viven en `packages/assets/src/fonts/` (7 pesos DM Sans + SpaceMono).

## Goals / Non-Goals

**Goals:**
- La web app carga DM Sans con todos los pesos que mobile soporta (300, 400, 500, 600, 700, 800, 900)
- Usar el mismo patrón que la extensión: `@font-face` en CSS + archivos en `public/fonts/`
- `font-display: swap` para evitar FOIT (Flash of Invisible Text)
- Zero configuración adicional en Vite — el directorio `public/` se sirve automáticamente

**Non-Goals:**
- No convertir a woff2 (optimización futura; mantener .ttf por consistencia con extension)
- No cargar SpaceMono en web (el tema define `fontFamily.mono = 'DM Mono'` pero no se usa activamente en componentes web)
- No modificar `packages/shared`, `packages/ui`, ni `packages/assets`
- No unificar el CSS de fuentes entre extension y web en un paquete compartido (overkill para un archivo CSS estático)

## Decisions

### 1. Archivos `.ttf` en `apps/web/public/fonts/` (no importados via Vite)

**Decisión:** Copiar los `.ttf` al directorio `public/fonts/` de la web app y referenciarlos con rutas absolutas (`/fonts/DMSans-*.ttf`).

**Alternativa considerada:** Importar los `.ttf` desde `@salmon/assets` en el CSS con rutas relativas y dejar que Vite los procese como assets (les agrega hash al nombre). Descartado porque:
- La extensión ya usa el patrón `public/fonts/` con rutas absolutas — mantener consistencia
- Vite sirve `public/` tal cual sin configuración adicional
- Los archivos de fuente no necesitan cache-busting via hash (cambian muy raramente)
- Más simple de razonar y debuggear

### 2. Todos los pesos (7) en vez de solo 3 como la extensión

**Decisión:** Declarar los 7 pesos que mobile carga (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800, Black 900).

**Rationale:** El tema en `typography.ts` define `fontWeight` con valores 300-700 y `fontFamilyNative` con los 7 pesos. La extensión solo tiene 3 porque fue configurada antes de que se expandiera el tema. La web app debe tener paridad con mobile desde el inicio. Los pesos faltantes hacen que el navegador sintetice bold/light con resultados subóptimos.

### 3. CSS en `apps/web/src/assets/fonts.css` importado en `main.tsx`

**Decisión:** Crear el CSS en `src/assets/fonts.css` (misma ubicación relativa que la extensión: `src/assets/fonts.css`) e importarlo en `main.tsx` antes de cualquier render.

**Alternativa considerada:** Inline `<style>` en `index.html`. Descartado porque no sigue el patrón de la extensión y mezcla concerns en el HTML.

### 4. No usar preload de fuentes

**Decisión:** No agregar `<link rel="preload">` en `index.html` por ahora.

**Rationale:** `font-display: swap` ya previene FOIT. Los preloads serían una optimización prematura — la web app no es un sitio público con SEO crítico, es una wallet app autenticada donde el usuario ya espera carga inicial.

## Risks / Trade-offs

- **Duplicación de archivos .ttf**: Los mismos `.ttf` existirán en `packages/assets/src/fonts/` y en `apps/web/public/fonts/`. → Aceptable: es el mismo patrón que la extensión usa. Los archivos de fuente son estáticos y no divergen. Una alternativa futura sería un script de build que los copie, pero es overkill ahora.
- **Tamaño de bundle**: 7 archivos `.ttf` (~70KB cada uno, ~490KB total). → Mitigado con `font-display: swap` — el navegador solo descarga los pesos que realmente usa el CSS de la página. Los no usados no se descargan.
- **Falta SpaceMono**: Si en el futuro componentes web usan `fontFamily.mono`, faltará la fuente. → El tema ya define `'DM Mono'` como mono, y no hay componentes web que lo usen activamente. Se puede agregar después.
