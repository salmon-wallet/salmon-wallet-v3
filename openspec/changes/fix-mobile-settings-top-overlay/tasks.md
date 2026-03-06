## 1. Shared Navigation State

- [x] 1.1 Refactor `apps/mobile/src/components/SettingsPanelStack/` para que deje de crear su propia instancia de `useSettingsPanelStack()` y consuma la pila compartida recibida por props
- [x] 1.2 Actualizar los tipos mobile de settings panel stack para tipar correctamente `stack`, `push`, `pop` y `canGoBack` reutilizando contratos de `@salmon/shared`

## 2. Settings Overlay Behavior

- [x] 2.1 Actualizar `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx` para que sea el dueño de la única instancia de `useSettingsPanelStack()` por apertura
- [x] 2.2 Hacer que el `TopSheet` de settings opere en modo full-height y que el contenido base de settings se renderice como overlay full-screen, sin límite parcial de altura
- [x] 2.3 Asegurar que cerrar settings resetee la pila completa y cierre toda la sesión, incluyendo subpages abiertas

## 3. Verification

- [x] 3.1 Revisar el wiring en `apps/mobile/app/(app)/(tabs)/_layout.tsx` para confirmar que el `panelRegistry` sigue funcionando sobre la nueva pila compartida sin romper `initialPanels`
- [x] 3.2 Ejecutar `pnpm turbo run typecheck --filter=@salmon/mobile`
