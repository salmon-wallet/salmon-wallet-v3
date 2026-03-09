## Context

Hoy el entrypoint de settings mobile es `SettingsSheet`, que monta un `TopSheet` con título fijo `Settings`. Dentro del content area, el menú base vive en el root y las subscreens se renderizan encima a través de `SettingsPanelStack`.

El problema es que esas subscreens casi siempre usan `SettingsScreenLayout`, y ese layout a su vez dibuja otro header interno con back + title. El resultado es:

- header externo fijo
- header interno variable
- panel overlay con fondo propio distinto al root

La arquitectura correcta para el comportamiento pedido es que exista un único shell visual dueño del header superior, mientras que las subscreens sólo renderizan contenido.

## Goals / Non-Goals

**Goals:**
- Unificar el header superior de settings en mobile
- Hacer que el título visible refleje la subscreen actual
- Hacer que el back superior use la acción contextual correcta, incluyendo flows con pasos internos
- Reutilizar `SettingsScreenLayout` como wrapper de contenido, no como segundo shell
- Mantener la estética base del root settings a través de los panels

**Non-Goals:**
- No modificar web/extension
- No reescribir cada panel de settings desde cero
- No cambiar el sistema de stack o los `SettingsScreen` IDs

## Decisions

### 1. `TopSheet` pasa a soportar un back button opcional

El shell superior seguirá siendo `TopSheet`, pero ahora podrá renderizar:
- botón back a la izquierda
- título centrado
- botón close a la derecha

Esto permite que settings use un header superior único sin crear una primitiva nueva.

### 2. `SettingsSheet` será dueño del header activo

`SettingsSheet` mantendrá el header activo a partir de:
- estado de stack actual
- override de header provisto por la subscreen activa

Se usará un fallback por `SettingsScreen` para los panels simples y un override dinámico para panels con navegación interna propia (`AccountAddPanel`, `PrivateKeyPanel`, etc.).

### 3. `SettingsScreenLayout` deja de renderizar header por defecto

`SettingsScreenLayout` se mantiene como layout reutilizable, pero ya no dibuja por defecto el back/title interno. En cambio:
- registra `title` + `onBack` en el shell superior mediante contexto
- conserva el contenido, scroll y subtítulo del panel

Esto evita duplicar header y permite que panels multi-step sigan controlando el back correcto.

### 4. `SettingsPanelStack` comparte el mismo shell visual del root

El panel overlay ya no debe sentirse como una capa gris separada. Para eso:
- se elimina el fondo secundario plano
- se usa el mismo fondo base de settings dentro del overlay

### 5. Ajustes representativos de surface

No todos los panels necesitan reescritura completa para esta iteración. Se priorizan:
- shell/header
- fondo del panel overlay
- items representativos visibles como `AccountsPanel`

## Risks / Trade-offs

- **Header contextual más acoplado al layout**: se introduce una coordinación extra entre subscreen y shell mediante contexto
- **Flows internos requieren override correcto**: si un panel no registra bien su back/title, el header superior puede caer en el fallback
- **La unificación visual completa de todos los panels puede requerir iteraciones adicionales**: este cambio ordena el shell y deja la base visual correcta

## Migration Plan

1. Extender `TopSheet` para soportar back opcional.
2. Agregar contexto de header para settings mobile.
3. Hacer que `SettingsSheet` use título dinámico + back contextual.
4. Cambiar `SettingsScreenLayout` a modo headerless por defecto.
5. Alinear el fondo del panel overlay y ajustar panels representativos.
6. Ejecutar typecheck de mobile.
