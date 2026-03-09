## Why

El cambio `unify-mobile-settings-shell-and-surfaces` unificó visualmente el shell de settings mobile, pero introdujo una regresión funcional: al abrir subscreens como `Accounts` o `Profile Picture`, la app cae en `Maximum update depth exceeded`.

La auditoría muestra que el problema no es sólo un `useEffect` mal memoizado. El loop nace de una arquitectura donde:

- `SettingsScreenLayout` escribe estado de header en el padre desde un efecto
- ese estado incluye callbacks (`onBack`) que se originan en el render path del panel activo
- `SettingsPanelStack` inyecta callbacks render-time (`onBack`, `onNavigate`) en cada panel
- el `panelRegistry` en `app/(app)/(tabs)/_layout.tsx` recrea closures para la mayoría de los screens

Eso deja al shell dependiente de identidades de función inestables y hace que cualquier rerender del panel activo pueda reinyectar estado al header superior.

## What Changes

- Redefinir el contrato del header de settings mobile para que el shell derive su estado desde navegación/stack metadata, no desde efectos en layouts hijos.
- Sacar la sincronización `child -> parent setState` del camino de render normal de las subscreens estándar.
- Reservar overrides dinámicos sólo para flows internos que realmente cambian de paso dentro de un mismo panel.
- Formalizar que abrir cualquier subscreen de settings no debe producir loops de render ni errores de runtime.

## Impact

- `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx`
- `apps/mobile/src/components/SettingsPanelStack/SettingsPanelStack.tsx`
- `apps/mobile/src/components/SettingsScreenLayout/SettingsScreenLayout.tsx`
- `apps/mobile/app/(app)/(tabs)/_layout.tsx`
- OpenSpec specs de shell y panel stack
