## Why

La experiencia de settings en mobile quedó funcionalmente navegable, pero visual y estructuralmente sigue dividida en dos capas:

- el header superior del `TopSheet` siempre dice `Settings`
- cada subscreen vuelve a renderizar su propio header interno con back + title
- el panel overlay usa un fondo distinto al menú raíz de settings

Eso produce una experiencia inconsistente: la navegación parece un overlay dentro de otro overlay, el título visible no representa la subscreen actual, y el fondo de los panels no mantiene la misma estética del settings root.

## What Changes

- Hacer que el shell superior de settings en mobile sea dueño del título y del back de la subscreen actual
- Permitir que las subscreens de settings actualicen ese header superior con su propio `title` y `onBack`
- Eliminar el header duplicado dentro de `SettingsScreenLayout` por defecto
- Hacer que los panels apilados usen el mismo fondo base de settings
- Alinear los items de panels representativos con la misma lógica de superficie del settings root

## Capabilities

### Added Capabilities

- `mobile-settings-shell`: El header superior de settings refleja la subscreen actual y su acción de back

### Modified Capabilities

- `settings-panel-stack`: Los panels mobile comparten el mismo fondo visual que el settings root
- `settings-screen-layout`: Las subscreens mobile de settings dejan de dibujar un header interno por defecto

## Impact

- **`apps/mobile/src/components/TopSheet/`** — Header superior con soporte para back + close simétricos
- **`apps/mobile/src/components/SettingsSheet/`** — Shell de settings con título dinámico y back contextual
- **`apps/mobile/src/components/SettingsPanelStack/`** — Fondo visual alineado con settings root y coordinación con el header superior
- **`apps/mobile/src/components/SettingsScreenLayout/`** — Layout sin header duplicado por defecto
- **`apps/mobile/src/components/*Panel` / `*Selector`** — Heredan el nuevo shell superior; algunos items representativos se alinean visualmente
