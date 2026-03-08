## Why

El flujo actual de `Settings` en mobile está roto y además no termina de respetar el modelo de navegación interna que ya existe en web/extension. Hoy `SettingsSheet` y `SettingsPanelStack` crean instancias separadas de `useSettingsPanelStack()`, así que tocar una opción puede no abrir ningún subpanel. Incluso cuando el contenido existe, la experiencia sigue sintiéndose como un sheet parcial con un panel solapado, no como una sesión de settings contenida dentro de un overlay propio.

El objetivo es llevar mobile al mismo criterio funcional que web/extension: una sola sesión de navegación interna de settings, donde el menú base abre pantallas hijas dentro del mismo contenedor, y cerrar ese contenedor termina también toda la sesión. En mobile, en lugar de un panel lateral, eso debe verse como un overlay full-screen que entra desde arriba y administra sus "pages" internamente hasta que el usuario decida cerrarlo.

## What Changes

- Corregir el estado de navegación de settings en mobile para que `SettingsSheet` y `SettingsPanelStack` compartan una única pila de paneles/pages por apertura
- Hacer que el contenedor de settings use el `TopSheet` como overlay full-screen, con comportamiento visual más cercano a una screen modal que a un sheet parcial
- Mantener la navegación de subpantallas completamente dentro de ese overlay: abrir una opción empuja una page interna; volver hace `pop`; cerrar settings resetea toda la pila y cierra el overlay completo
- Reutilizar el modelo existente de `SettingsScreen`, `SettingsPanelEntry`, `useSettingsPanelStack`, tokens y layouts compartidos, evitando estado o contratos duplicados del lado mobile

## Capabilities

### Modified Capabilities

- `settings-panel-stack`: En mobile, `Settings` pasa a comportarse como una sesión interna full-screen con navegación propia dentro del overlay
- `settings-sheet`: El menú base de settings sigue siendo el entrypoint, pero deja de convivir con un stack separado y pasa a orquestar una única pila de navegación compartida

## Impact

- **`apps/mobile/src/components/SettingsSheet/`** — Debe dejar de instanciar navegación aislada y pasar a conducir el overlay full-screen con stack compartido
- **`apps/mobile/src/components/SettingsPanelStack/`** — Debe renderizar la pila real del contenedor padre en vez de crear su propio estado
- **`apps/mobile/src/components/TopSheet/`** — Se reutiliza como contenedor visual del overlay de settings, sin introducir una primitiva nueva
- **`packages/shared/src/hooks/useSettingsPanelStack.ts` y tipos de settings** — Se preservan como base compartida del flujo, reutilizando contratos ya existentes
