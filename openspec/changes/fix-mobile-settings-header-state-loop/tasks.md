## 1. Audit

- [x] 1.1 Confirmar todos los panels que hoy dependen de `SettingsScreenLayout` para sincronizar header
- [x] 1.2 Clasificar panels entre `header estándar` y `header con override dinámico`

## 2. Header Contract

- [x] 2.1 Mover el header estándar a metadata estable derivada del stack activo
- [x] 2.2 Dejar `SettingsScreenLayout` como layout puro sin `setHeaderState(...)` implícito
- [x] 2.3 Mantener `back` del shell superior basado en `pop` para panels estándar

## 3. Dynamic Overrides

- [x] 3.1 Definir una API explícita para flows que necesiten override de título/back
- [x] 3.2 Migrar sólo los panels con navegación interna real a esa API

## 4. Verification

- [ ] 4.1 Verificar que `Accounts` abre sin `Maximum update depth exceeded`
- [ ] 4.2 Verificar que `Profile Picture` abre sin `Maximum update depth exceeded`
- [ ] 4.3 Verificar que el back superior sigue saliendo hacia la derecha
- [x] 4.4 Ejecutar `pnpm turbo run typecheck --filter=@salmon/mobile`
