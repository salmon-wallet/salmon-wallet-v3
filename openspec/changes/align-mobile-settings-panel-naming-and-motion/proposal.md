## Why

Las subscreens de settings en mobile ya siguen funcionalmente el mismo flujo de panel stack que web/extension, pero todavía quedaron dos inconsistencias importantes:

- varios componentes de mobile usan nombres distintos a sus equivalentes conceptuales en `packages/ui/src/components`, lo que dificulta mantener paridad mental y navegar el código entre plataformas
- el comportamiento lateral de entrada/salida existe hoy en mobile, pero no está explicitado como contrato del cambio que va a ordenar esos panels y su naming

Queremos que mobile use el mismo vocabulario de panels que web/extension cuando se trata de la misma pantalla conceptual, sin tocar código de web/extension. Además, queremos dejar asentado que la navegación interna de settings entra desde la derecha y, al volver, también sale hacia la derecha.

## What Changes

- Renombrar en mobile los componentes/settings panels cuyo nombre hoy no coincide con `packages/ui`
- Mantener estables los `SettingsScreen` IDs y el wiring del `panelRegistry`; el cambio es de nombres de componentes/directorios/exports, no de rutas internas
- Formalizar en OpenSpec que el panel stack mobile debe animar entrada desde la derecha y salida hacia la derecha al hacer back
- Verificar el comportamiento tomando `packages/ui/src/components/SettingsPanelStack/` como referencia semántica, sin modificar web/extension

## Capabilities

### Added Capabilities

- `settings-panel-components`: Los panels mobile de settings usan naming consistente con `packages/ui` para las mismas pantallas conceptuales

### Modified Capabilities

- `settings-panel-stack`: El motion lateral de mobile queda explicitado como contrato de navegación interna de settings

## Impact

- **`apps/mobile/src/components/`** — Renombres de componentes/directorios/export barrels para los panels de settings mobile que hoy difieren de `packages/ui`
- **`apps/mobile/app/(app)/(tabs)/_layout.tsx`** — Actualización del `panelRegistry` para apuntar a los nombres nuevos
- **`apps/mobile/src/components/SettingsPanelStack/`** — Se audita y, si hace falta, se ajusta para que el contrato de motion quede alineado con el esperado
- **`packages/ui/src/components/`** — Sólo referencia de naming y motion; no se modifica
