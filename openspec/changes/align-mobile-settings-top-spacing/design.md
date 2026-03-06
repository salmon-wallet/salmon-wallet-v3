## Context

La auditoría del repo muestra dos patrones distintos para las pantallas internas de settings:

- **Web/extension**
  - `SettingsPanelContent` usa `PageShell`
  - `PageShell` renderiza un header compacto con back + title en la misma fila
  - el contenido arranca debajo de ese header con `scrollContentStyle={{ paddingTop: spacing.lg }}`

- **Mobile**
  - casi todas las sub-screens de settings usan `SettingsScreenLayout`
  - `SettingsScreenLayout` renderiza primero `ScreenHeader` (una fila de 56px con sólo back)
  - después renderiza el título centrado como bloque independiente
  - luego el `ScrollView`

Ese desacople entre back y title agrega una franja vertical extra en todas las screens. Los screenshots adjuntos confirman el síntoma en `Display Currency` y `Accounts`: el contenido arranca demasiado abajo respecto del header del overlay.

## Goals / Non-Goals

**Goals:**
- Igualar la densidad superior de las settings screens mobile con la de los panels web/extension
- Resolverlo una sola vez desde `SettingsScreenLayout`
- Usar únicamente tokens existentes de `@salmon/shared`
- Mantener la arquitectura actual de mobile (overlay top-entry, no panel lateral)
- Evitar warnings/bugs de `VirtualizedList` en las screens de settings que usan `FlatList`

**Non-Goals:**
- No rediseñar el contenido interno de cada panel
- No tocar `SettingsSheet` ni `SettingsPanelStack` salvo que aparezca una dependencia menor
- No rehacer `ScreenHeader` global para flujos no-settings
- No cambiar web/extension

## Decisions

### 1. `SettingsScreenLayout` pasa a usar un header interno propio, compacto

En vez de reutilizar `ScreenHeader`, `SettingsScreenLayout` renderizará su propio header de settings. Ese header combinará back y título en el mismo bloque superior, con spacing vertical tokenizado y sin la separación actual entre fila de back y título.

Why:
- `ScreenHeader` es una primitiva genérica de onboarding/auth y su altura fija de `componentSizes.headerHeight` crea el gap no deseado en settings
- cambiar sólo `SettingsScreenLayout` afecta a todas las settings screens sin riesgo para otros flows

### 2. El espaciado se alinea con la referencia de `SettingsPanelContent`

El nuevo layout mobile usará tokens compartidos para replicar la intención de web/extension:
- padding horizontal con `contentPadding.screen`
- densidad vertical basada en `spacing.md` / `spacing.lg`
- título con tokens tipográficos compartidos
- contenido scrollable arrancando inmediatamente después del header compacto

No se copiará literalmente el DOM de `PageShell`, pero sí su proporción visual.

### 3. El cambio queda encapsulado en settings

No se tocará `ScreenHeader.tsx`, porque hoy sirve a otros flujos. El layout de settings tendrá su propia implementación compacta para no propagar side effects a onboarding, auth o pantallas no relacionadas.

### 4. Las screens con listas pueden desactivar el wrapper scrollable del layout

`SettingsScreenLayout` expondrá un modo no-scrollable para las screens que necesitan ser dueñas de su propia lista virtualizada. Eso permite mantener un layout único para settings sin volver a introducir `FlatList` anidados dentro de un `ScrollView`.

Why:
- el warning reportado en `AvatarPicker` muestra que el layout compartido no puede asumir scroll nativo para todos los casos
- `AccountsPanel` y `AvatarPicker` necesitan mantener o controlar su propio scroll/lista

## Risks / Trade-offs

- **Pequeño cambio visual transversal**: afecta muchas screens de settings a la vez. Es intencional, pero exige validar que títulos largos/subtítulos sigan respirando bien.
- **Diferencia residual con web**: mobile seguirá siendo un overlay top-entry, no un panel lateral. Lo que se iguala es la densidad y estructura del header interno, no el contenedor externo.

## Migration Plan

1. Cambiar `SettingsScreenLayout` para usar un header compacto propio.
2. Mantener `subtitle` y `ScrollView` funcionando con el nuevo orden/layout.
3. Permitir que screens list-backed de settings desactiven el `ScrollView` del layout y evitar listas virtualizadas anidadas.
4. Verificar en componentes representativos (`CurrencySelector`, `AccountsPanel`, `AboutPanel`, `PrivateKeyReveal`, `AvatarPicker`) que heredan correctamente el ajuste.
5. Ejecutar typecheck de mobile.
