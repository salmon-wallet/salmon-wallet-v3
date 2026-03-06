## Context

El flujo actual de settings en mobile ya intentó adoptar el patrón de panel stack, pero quedó a mitad de camino:

- `SettingsSheet` crea una instancia local de `useSettingsPanelStack()` para decidir si hay panels abiertos y para hacer `push()` al tocar una opción
- `SettingsPanelStack` crea otra instancia distinta del mismo hook y renderiza a partir de esa segunda pila
- como el hook usa `useState` local y no un store/context compartido, ambas pilas están desconectadas y las acciones de navegación no impactan sobre lo que se renderiza

Eso explica el bug reportado: hoy tocar una opción de settings en mobile puede no abrir nada aunque exista un renderer en el `panelRegistry`.

Del lado de UX, el contenedor también queda en un punto intermedio:

- `TopSheet` ya entra desde arriba y soporta `fullHeight`
- `SettingsSheet` hoy lo usa como sheet parcial, con `ScrollView` limitado por `maxHeight: 500`
- los subpanels aparecen como una capa absoluta encima del menú, lo que se siente más como un panel solapado que como una screen interna

El usuario pidió explícitamente otra dirección: que funcione como en web/extension en términos de navegación interna, pero visualmente como un overlay de pages que entra desde arriba, ocupa toda la altura y se cierra entero al salir.

## Goals / Non-Goals

**Goals:**
- Hacer que mobile tenga una sola pila de navegación de settings por apertura del overlay
- Mantener todo el flujo dentro del `TopSheet`, sin `router.push()` ni navegación externa
- Hacer que settings se perciba como una screen modal full-screen que entra desde arriba
- Hacer que cerrar settings cierre también cualquier subpage abierta y resetee la pila
- Reutilizar hooks, tipos y tokens existentes desde `@salmon/shared`

**Non-Goals:**
- No migrar settings mobile a Expo Router o a una navegación global nueva
- No rediseñar los componentes internos de cada panel/settings page
- No tocar web/extension en este cambio
- No introducir un nuevo sistema de navegación genérico fuera del alcance de settings

## Decisions

### 1. Compartir la pila desde `SettingsSheet` hacia `SettingsPanelStack`

`SettingsSheet` será el dueño de una única instancia de `useSettingsPanelStack()`. Esa instancia se pasará a `SettingsPanelStack` mediante props explícitas (`stack`, `push`, `pop`, `canGoBack`), en vez de volver a crear el hook dentro del stack renderer.

Why:
- resuelve el bug actual sin introducir un store global extra
- mantiene el hook compartido en `packages/shared`
- deja la sesión de navegación encapsulada en cada apertura de settings, que es exactamente el comportamiento deseado

Alternativa considerada:
- mover la pila a un context/provider nuevo. Rechazada por ahora porque agrega más infraestructura de la necesaria para un estado estrictamente local al overlay.

### 2. Tratar `TopSheet` como un overlay full-screen de settings

`SettingsSheet` pasará a abrir `TopSheet` en modo full-height y a renderizar su contenido con layout de pantalla completa. El menú base seguirá siendo el nivel raíz, pero visualmente el contenedor debe sentirse como una screen modal desde arriba, no como una tarjeta parcial.

Detalles esperados:
- `fullHeight`
- sin limitar el contenido principal a `500px`
- mantener header/close del contenedor
- preservar el fondo/estilo ya usado por mobile

Why:
- aprovecha una primitiva existente que ya encaja con la dirección UX pedida
- evita el riesgo de bottom-sheet dismiss por scroll
- conserva el patrón mobile actual de entrada desde arriba

### 3. Mantener la navegación interna como overlay de pages dentro del mismo contenedor

El menú base de settings y las subpages seguirán viviendo dentro de un mismo contenedor. Tocar una opción de navegación hará `push(screen)`, lo que renderiza la page correspondiente dentro del stack. Hacer back hará `pop()`. Cerrar el overlay invocará `reset()` y `onClose()`.

Why:
- alinea mobile con la semántica de web/extension: settings vive dentro de su propio contenedor y navega internamente
- evita overlays anidados o navegación que escape del sheet
- hace que el cierre sea inequívoco: salir de settings mata toda la sesión de navegación

### 4. Respetar la arquitectura shared existente

Se conservarán:
- `useSettingsPanelStack()` en `packages/shared`
- `SettingsScreen` y `SettingsPanelEntry`
- `SettingsScreenLayout` para las páginas hijas
- `TopSheet` como primitiva visual del contenedor
- el `panelRegistry` mobile ya existente

No se introducirán tipos paralelos, stacks mobile-only ni constantes duplicadas.

## Risks / Trade-offs

- **No habrá deep linking interno para settings mobile**: aceptable, porque el flujo es modal e interno
- **El menú base y los subpanels seguirán en el mismo árbol**: esto es deseado, pero obliga a cuidar `zIndex` y reset al cerrar
- **Seguir usando `TopSheet` mantiene affordances de modal/sheet**: mitigado haciendo full-screen y evitando que el contenido principal se vea como una tarjeta parcial

## Migration Plan

1. Refactorizar las props de `SettingsPanelStack` para recibir la pila compartida desde el padre.
2. Actualizar `SettingsSheet` para ser dueño de la pila, hacer `push/pop/reset` sobre una única sesión y abrir el `TopSheet` en full-screen.
3. Mantener el `panelRegistry` actual y el wiring existente en `_layout.tsx`, pero ahora sobre el stack compartido real.
4. Verificar que cerrar settings desde close/backdrop/back resetee la pila completa.
5. Ejecutar typecheck de mobile.
