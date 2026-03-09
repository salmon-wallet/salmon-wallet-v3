## Context

El shell actual de settings mobile tiene tres responsabilidades mezcladas:

1. `SettingsSheet` es dueño del header visible.
2. `SettingsPanelStack` es dueño de la navegación horizontal.
3. `SettingsScreenLayout` informa al shell qué header debería verse.

El punto 3 es el que falla. Hoy cada subscreen estándar registra `{ title, onBack }` en el shell superior a través de un efecto. Eso introduce una dependencia circular:

- el panel se renderiza
- el layout escribe estado en `SettingsSheet`
- `SettingsSheet` rerenderiza
- el stack rerenderiza el panel activo con callbacks nuevos o potencialmente nuevos
- el layout vuelve a escribir estado

Aunque algunos setters estén memoizados, el contrato sigue siendo frágil porque el header vive fuera del stack pero depende de callbacks creados dentro del render path del stack.

## Goals / Non-Goals

**Goals**
- Eliminar el loop de render al abrir subscreens de settings
- Mantener un único header superior
- Hacer que el título y back del shell provengan de una fuente estable
- Seguir permitiendo back contextual para flows internos

**Non-Goals**
- No volver al header duplicado anterior
- No tocar web/extension
- No rediseñar todos los panels visualmente en este change

## Decision

### 1. El header estándar debe derivarse del stack, no del panel renderizado

Para panels estándar (`Accounts`, `Language`, `Currency`, `About`, etc.), el shell debe resolver `title` y `back` desde metadatos estables del screen activo:

- `screen id`
- `stack depth`
- acción de `pop`

Esto evita depender de un `useEffect` dentro de `SettingsScreenLayout`.

### 2. Los overrides dinámicos deben ser explícitos y acotados

Sólo panels con steps internos reales deberían poder redefinir el header activo. Ese override no debe nacer de un efecto genérico en el layout compartido, sino de una API explícita del flow interno.

Ejemplos:
- `PrivateKeyPanel`
- `AccountAddPanel`
- cualquier panel con wizard/stepper local

### 3. `SettingsScreenLayout` vuelve a ser layout puro

`SettingsScreenLayout` no debería sincronizar estado del shell por defecto. Su trabajo debe limitarse a:

- spacing
- scroll
- subtitle
- safe area del contenido

Si algún panel necesita header local por excepción, debería opt-in explícitamente.

### 4. El stack debe publicar metadata estable del panel activo

Hay dos opciones válidas:

- `SettingsSheet` deriva el header desde `stack[stack.length - 1]` y un registry de metadata
- o `SettingsPanelStack` publica un `activeHeaderDescriptor` estable basado en el stack actual

La primera opción es preferible porque mantiene ownership del shell en `SettingsSheet` y deja al stack concentrado en animación y navegación.

## Audit Findings

### Finding 1: `SettingsScreenLayout` escribe estado del padre desde un efecto compartido

Archivo: `apps/mobile/src/components/SettingsScreenLayout/SettingsScreenLayout.tsx`

El layout compartido hace `setHeaderState({ title, onBack })` y limpia con `setHeaderState(null)`. Eso mete un side effect global en todos los panels que usan el layout.

### Finding 2: el header state persiste callbacks creados dentro del stack

Archivo: `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx`

`headerOverride` guarda `onBack`, y ese callback proviene del render path del panel activo. El shell termina almacenando funciones cuya estabilidad depende de la implementación del stack/panel registry.

### Finding 3: `SettingsPanelStack` inyecta props render-time

Archivo: `apps/mobile/src/components/SettingsPanelStack/SettingsPanelStack.tsx`

Cada panel recibe `onBack` y `onNavigate` al renderizarse. Eso es normal para navegación, pero no es una base suficientemente estable para que un layout hijo sincronice estado del shell padre en un efecto.

### Finding 4: el `panelRegistry` en `_layout.tsx` recrea closures por screen

Archivo: `apps/mobile/app/(app)/(tabs)/_layout.tsx`

Aunque está memoizado, el registry depende de muchos estados del tab layout. Cada cambio relevante puede recrear handlers internos de screens, por lo que no conviene que el header shell dependa de esas identidades.

## Proposed Implementation

1. Introducir un `SETTINGS_SCREEN_HEADERS` estable en `SettingsSheet` o en un módulo adyacente.
2. Derivar `currentTitle` y `currentBackAction` desde `currentPanel` y `pop`, sin depender de `SettingsScreenLayout`.
3. Remover el registro automático de header desde `SettingsScreenLayout`.
4. Definir una API explícita de override sólo para panels con navegación interna real.
5. Verificar manualmente apertura/cierre de al menos `Accounts`, `Profile Picture`, `Language` y `About`.

## Risks / Trade-offs

- Los panels que hoy confían en overrides implícitos pueden perder título/back contextual si no se migran a la API explícita.
- Algunos flows internos van a requerir un paso de adaptación adicional.
- El cambio toca la frontera entre shell, stack y panel registry, así que conviene validarlo con pruebas manuales en simulator además del typecheck.
