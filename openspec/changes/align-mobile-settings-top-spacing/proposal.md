## Why

Las sub-screens de settings en mobile quedaron con demasiado espacio vertical entre el header del overlay (`Settings` + close) y el contenido real de cada screen. El problema no está disperso por componente: hoy todas esas pantallas comparten `SettingsScreenLayout`, que renderiza una fila de back (`ScreenHeader`) y recién después el título, generando una separación visual más grande que la de los panels equivalentes en web/extension.

En web/extension, los panels de settings usan `SettingsPanelContent`, que a su vez delega en `PageShell`: back y título viven dentro del mismo header compacto, y el contenido arranca con un `paddingTop` tokenizado (`spacing.lg`). Queremos que mobile replique ese criterio de densidad superior, adaptado a su overlay top-entry y sin introducir una primitiva paralela.

## What Changes

- Auditar y tomar como referencia el header/top spacing de `packages/ui/src/components/SettingsPanelContent.tsx` y `PageShell.tsx`
- Ajustar `apps/mobile/src/components/SettingsScreenLayout/SettingsScreenLayout.tsx` para que el encabezado interno de todas las screens de settings sea más compacto y equivalente en intención al de web/extension
- Permitir que las settings screens con contenido list-backed usen el mismo layout sin anidar `VirtualizedList` dentro del `ScrollView` compartido
- Mantener el cambio concentrado en el layout compartido de mobile, usando tokens de `@salmon/shared`, para evitar arreglos aislados screen por screen

## Capabilities

### Modified Capabilities

- `settings-screen-layout`: Las screens internas de settings en mobile pasan a usar un top spacing y header interno alineados con el patrón de web/extension

## Impact

- **`apps/mobile/src/components/SettingsScreenLayout/`** — Punto central del cambio para afectar todas las screens de settings que lo consumen
- **`apps/mobile/src/components/*Panel` y selectors de settings** — Quedan alineados automáticamente al heredar el layout nuevo
- **`packages/ui/src/components/SettingsPanelContent.tsx` y `PageShell.tsx`** — Se toman como referencia funcional/visual; no se modifican
