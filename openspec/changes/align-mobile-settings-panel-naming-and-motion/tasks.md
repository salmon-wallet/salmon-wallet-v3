## 1. OpenSpec Audit

- [ ] 1.1 Comparar el naming actual de los panels mobile de settings contra `packages/ui/src/components`
- [ ] 1.2 Confirmar qué componentes ya coinciden y cuáles requieren rename sin tocar screen IDs
- [ ] 1.3 Revisar `apps/mobile/src/components/SettingsPanelStack/SettingsPanelStack.tsx` contra la referencia de `packages/ui/src/components/SettingsPanelStack/SettingsPanelStack.tsx`

## 2. Mobile Renaming

- [ ] 2.1 Renombrar `AvatarPicker` a `AccountAvatarPanel` en mobile
- [ ] 2.2 Renombrar `PrivateKeyReveal` a `PrivateKeyPanel` en mobile
- [ ] 2.3 Renombrar `AddressBookSelector` a `AddressBookPanel` en mobile
- [ ] 2.4 Renombrar `AddressBookAdd` a `AddressAddPanel` en mobile
- [ ] 2.5 Renombrar `AddressBookEdit` a `AddressEditPanel` en mobile
- [ ] 2.6 Actualizar barrels, imports y `panelRegistry` de settings mobile para usar los nombres nuevos

## 3. Motion Contract

- [ ] 3.1 Asegurar que push siga entrando desde la derecha en mobile settings
- [ ] 3.2 Asegurar que back/pop siga saliendo hacia la derecha en mobile settings
- [ ] 3.3 Verificar que el swipe-back no rompa ese contrato visual

## 4. Verification

- [ ] 4.1 Ejecutar `pnpm turbo run typecheck --filter=@salmon/mobile`
- [ ] 4.2 Validar manualmente Accounts, Profile Picture, Private Key y Address Book después de los renombres
- [ ] 4.3 Validar manualmente que abrir una subscreen y volver mantenga la animación lateral esperada
