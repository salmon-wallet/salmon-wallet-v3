# Settings Selector List

Reusable generic list component for mobile settings selection screens.

## Requirements

### R1: Generic item rendering
- Accepts generic type `T` for item data
- Renders list of items using `items: T[]`
- Unique key per item via `getKey: (item: T) => string`

### R2: Selection state
- Highlights selected item via `isSelected: (item: T) => boolean`
- Selected items show checkmark icon (`Ionicons checkmark-circle`) and accent border
- Calls `onSelect: (item: T) => void` on press

### R3: Text display
- Primary text via `getPrimaryText: (item: T) => string`
- Optional secondary text via `getSecondaryText?: (item: T) => string`

### R4: Custom leading element
- Optional `renderLeadingElement?: (item: T) => React.ReactNode` for custom content before text (e.g., currency symbol container)

### R5: Loading state
- When `loading` is true, shows centered `ActivityIndicator`
- Hides list items while loading

### R6: Empty state
- When `items` is empty and not loading, shows `emptyMessage` text if provided

### R7: Styling
- Each item: card background (`colors.background.card`), `borderRadius.md`, `padding: spacing.md`, `marginBottom: spacing.sm`
- Selected item: `borderWidth.thin` + `borderColor: colors.accent.primary`
- Primary text: `colors.text.primary`, `fontFamilyNative.medium`, `fontSize.md`
- Secondary text: `colors.text.secondary`, `fontFamilyNative.regular`, `fontSize.base`
- Uses `TouchableOpacity` with `activeOpacity={0.7}`

## Props Interface

```typescript
interface SettingsSelectorListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  getPrimaryText: (item: T) => string;
  getSecondaryText?: (item: T) => string;
  renderLeadingElement?: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}
```

## Files

- `apps/mobile/src/components/SettingsSelectorList/SettingsSelectorList.tsx`
- `apps/mobile/src/components/SettingsSelectorList/index.ts`

## Selector Refactors

Each selector replaces its inline `.map()` rendering with `SettingsSelectorList`:
- `LanguageSelector` — `getPrimaryText: lang.nativeName`, `getSecondaryText: lang.code.toUpperCase()`
- `NetworkSelector` — `getPrimaryText: network.name`, `getSecondaryText: network.blockchain`
- `CurrencySelector` — `getPrimaryText: item.name`, `getSecondaryText: item.code.toUpperCase()`, `renderLeadingElement: symbol container`
- `ExplorerSelector` — `getPrimaryText: item.name`, no secondary text
