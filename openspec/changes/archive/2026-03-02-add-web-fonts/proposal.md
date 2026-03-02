## Why

La web app (`apps/web`) referencia `fontFamily: 'DM Sans', sans-serif` en todos sus componentes vía los tokens de tipografía de `@salmon/shared`, pero no tiene declaraciones `@font-face` ni sirve los archivos `.ttf`. El navegador no encuentra "DM Sans" y cae al fallback genérico `sans-serif` del sistema, haciendo que la tipografía no coincida con el diseño. Mobile y extension ya resuelven esto correctamente — la web app es la única plataforma sin carga de fuentes.

## What Changes

- Crear un archivo CSS con declaraciones `@font-face` para DM Sans (todos los pesos usados: 300-900) en la web app, siguiendo el mismo patrón que `apps/extension/src/assets/fonts.css`
- Copiar los archivos `.ttf` necesarios al directorio `public/fonts/` de la web app (Vite sirve archivos del directorio `public` en la raíz `/` sin hash, igual que WXT en la extensión)
- Importar el CSS de fuentes en el entry point (`apps/web/src/main.tsx`) antes del render de la app
- Incluir todos los pesos que el tema define en `fontFamilyNative` (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800, Black 900) — la extensión solo tiene 3 pesos (400, 500, 700), la web app debe tener paridad completa con mobile

## Capabilities

### New Capabilities
- `web-font-loading`: Declaración y carga de fuentes DM Sans en la web app vía `@font-face` + directorio público de Vite

### Modified Capabilities
<!-- No se modifican capacidades existentes — solo se añade carga de fuentes que faltaba -->

## Impact

- **`apps/web`**: Nuevos archivos (`src/assets/fonts.css`, `public/fonts/*.ttf`), modificación menor en `src/main.tsx` (import del CSS)
- **`packages/assets`**: Sin cambios — los `.ttf` ya existen ahí como fuente de verdad; se copian al `public/` de web
- **`packages/shared`**: Sin cambios — los tokens de `typography.ts` ya usan `'DM Sans'` que es el nombre correcto para `@font-face`
- **`packages/ui`**: Sin cambios — los componentes ya referencian `fontFamily.sans` correctamente
- **Dependencias**: Ninguna nueva — solo CSS nativo y archivos estáticos
- **Build**: Vite copia `public/` tal cual al `dist/`, sin configuración adicional
