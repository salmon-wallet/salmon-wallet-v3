## Context

La auditoría actual de settings mobile muestra que la mayoría de las subscreens ya están montadas a través de un `panelRegistry` local en `apps/mobile/app/(app)/(tabs)/_layout.tsx`. El flujo funcional es correcto, pero el naming de varios componentes todavía se desvió respecto de `packages/ui`:

- `AvatarPicker` vs `AccountAvatarPanel`
- `PrivateKeyReveal` vs `PrivateKeyPanel`
- `AddressBookSelector` vs `AddressBookPanel`
- `AddressBookAdd` vs `AddressAddPanel`
- `AddressBookEdit` vs `AddressEditPanel`

En cambio, otros panels ya están alineados y no deberían tocarse (`AccountsPanel`, `AccountEditPanel`, `AccountNamePanel`, `AccountAddPanel`, `BackupPanel`, `AboutPanel`, `LanguageSelector`, `CurrencySelector`, `ExplorerSelector`, `SupportSelector`, `TrustedAppsSelector`, `NetworkSelector`, `SecurityPanel`).

Del lado de motion, mobile ya implementa la semántica deseada en `SettingsPanelStack`: push desde la derecha y pop hacia la derecha. El problema no es necesariamente funcional hoy, sino de contrato y consistencia futura. Queremos dejarlo especificado junto con el refactor de naming para que no vuelva a divergir.

## Goals / Non-Goals

**Goals:**
- Alinear el naming de los panels mobile de settings con `packages/ui` cuando la pantalla conceptual es la misma
- Mantener el alcance estrictamente en mobile
- Preservar los `SettingsScreen` IDs y el flujo de navegación existente
- Formalizar que el panel stack mobile entra desde la derecha y sale hacia la derecha al hacer back

**Non-Goals:**
- No renombrar ni modificar componentes en web/extension
- No cambiar el diseño visual de los panels
- No reemplazar el sistema actual de `panelRegistry`
- No cambiar los IDs de navegación (`avatar`, `privateKey`, `addressBook`, etc.) salvo que aparezca un bloqueo técnico

## Decisions

### 1. Alinear nombres por componente, no por screen ID

El refactor va a renombrar componentes, carpetas e imports de mobile para que reflejen el mismo naming de `packages/ui`, pero va a conservar los `SettingsScreen` IDs actuales.

Ejemplos:
- `avatar` seguirá siendo el screen ID, pero renderizará `AccountAvatarPanel`
- `privateKey` seguirá siendo el screen ID, pero renderizará `PrivateKeyPanel`
- `addressBook`, `address-book-add`, `address-book-edit` seguirán igual, pero renderizarán `AddressBookPanel`, `AddressAddPanel`, `AddressEditPanel`

Why:
- evita expandir el cambio a tipos compartidos y rutas internas
- consigue la consistencia buscada donde realmente duele hoy: el nombre del componente y su carpeta/export

### 2. Usar `packages/ui` sólo como referencia semántica

El naming canon para mobile va a salir de `packages/ui/src/components`, pero no se modificará nada allí. Mobile se adapta a ese vocabulario.

Why:
- respeta el pedido de no tocar web/extension
- evita abrir un frente extra en plataformas que ya están usando esos nombres

### 3. Mantener el motion lateral como contrato explícito de stack

El `SettingsPanelStack` mobile debe seguir este patrón:
- push: panel entra desde la derecha
- back/pop: panel actual sale hacia la derecha

La implementación puede seguir usando `react-native-reanimated` y el mismo patrón actual, pero el cambio debe dejarlo asentado en spec y validado en la revisión.

Why:
- el comportamiento ya existe y coincide con la referencia web/extension
- al dejarlo especificado, el futuro refactor de nombres no corre el riesgo de introducir regresiones de animación

### 4. Renombrar sólo los panels realmente desalineados

No se tocarán componentes que ya coinciden con `packages/ui`. El cambio debe ser quirúrgico.

Why:
- reduce churn innecesario
- mantiene el diff enfocado en las inconsistencias reales

## Risks / Trade-offs

- **Renombres con bastante ripple interno**: cambiar carpetas/exports/imports puede romper imports si no se hace de forma atómica
- **Falsa sensación de cambio funcional**: el motion probablemente ya cumple; el valor del cambio ahí es de contrato, no de feature nueva
- **Asimetría temporal entre screen IDs y nombres de componente**: es intencional y aceptable porque evita tocar tipos/rutas compartidas

## Migration Plan

1. Auditar y listar los components mobile que no coinciden con `packages/ui`.
2. Renombrar carpetas/componentes/exports mobile para alinearlos con `packages/ui`.
3. Actualizar imports y el `panelRegistry` de settings mobile.
4. Verificar que `SettingsPanelStack` conserve entrada desde derecha y salida hacia derecha.
5. Ejecutar typecheck de mobile y validar navegación manual en settings.
