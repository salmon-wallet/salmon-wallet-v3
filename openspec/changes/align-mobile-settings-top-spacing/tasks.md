## 1. OpenSpec Audit

- [x] 1.1 Tomar como referencia el header/top spacing de `packages/ui/src/components/SettingsPanelContent.tsx` y `packages/ui/src/components/PageShell/PageShell.tsx`
- [x] 1.2 Confirmar qué componentes de mobile settings heredan `SettingsScreenLayout` para que el ajuste salga centralizado

## 2. Implementation

- [x] 2.1 Refactorizar `apps/mobile/src/components/SettingsScreenLayout/SettingsScreenLayout.tsx` para reemplazar la estructura `ScreenHeader + title bloque separado` por un header interno compacto alineado con la densidad de web/extension
- [x] 2.2 Usar tokens de `@salmon/shared` para spacing, tamaños y tipografía; no introducir valores hardcodeados
- [x] 2.3 Preservar soporte para `subtitle` y contenido scrollable en todas las settings screens existentes
- [x] 2.4 Evitar `VirtualizedList` anidadas en settings permitiendo que las screens con listas usen el layout sin `ScrollView` compartido o sin listas virtualizadas innecesarias

## 3. Verification

- [x] 3.1 Revisar el impacto sobre screens representativas de settings (`AccountsPanel`, `CurrencySelector`, `AboutPanel`, `PrivateKeyReveal`, `AvatarPicker`)
- [x] 3.2 Ejecutar `pnpm turbo run typecheck --filter=@salmon/mobile`
