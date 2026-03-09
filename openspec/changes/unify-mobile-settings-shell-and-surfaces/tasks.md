## 1. OpenSpec Audit

- [x] 1.1 Auditar `SettingsSheet`, `TopSheet`, `SettingsPanelStack` y `SettingsScreenLayout`
- [x] 1.2 Confirmar que el problema visual proviene de header duplicado y fondo de panel separado

## 2. Shell Unification

- [x] 2.1 Extender `TopSheet` para soportar back opcional en el header
- [x] 2.2 Hacer que `SettingsSheet` derive el título visible de la subscreen activa
- [x] 2.3 Hacer que el back superior use la acción contextual correcta de la subscreen activa

## 3. Panel Layout

- [x] 3.1 Introducir un mecanismo para que las subscreens registren `title` y `onBack` en el shell superior
- [x] 3.2 Hacer que `SettingsScreenLayout` deje de renderizar un header interno por defecto
- [x] 3.3 Alinear el fondo visual de `SettingsPanelStack` con el settings root

## 4. Surface Alignment

- [x] 4.1 Ajustar al menos un panel representativo (`AccountsPanel`) para seguir la misma lógica de surface del settings root

## 5. Verification

- [x] 5.1 Ejecutar `pnpm turbo run typecheck --filter=@salmon/mobile`
