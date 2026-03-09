# Confirm Sheet

Generic mobile bottom sheet for confirming destructive or password-protected actions.

## Requirements

### R1: Visibility and lifecycle
- Controlled by `visible: boolean` prop
- Resets internal state (password, errors, loading) when `visible` changes to `true`
- Calls `onClose` to dismiss

### R2: Content display
- Displays a `title` string in the sheet header area
- Displays a `message` string as body text describing the action

### R3: Action buttons
- Cancel button (SecondaryButton) — calls `onClose`
- Confirm button (PrimaryButton) — calls async `onConfirm`
- Custom text via `confirmText` and `cancelText` props, defaults to `t('actions.cancel')` / `t('actions.confirm')`

### R4: Danger mode
- When `isDanger` is true, confirm button uses danger styling (red background: `colors.status.error`)
- Visual cue that action is destructive

### R5: Password protection
- When `requirePassword` is true, shows `PasswordInput` between message and buttons
- Validates via `validatePassword: (password: string) => Promise<boolean>`
- Confirm button disabled until password is non-empty
- Shows error text on invalid password

### R6: Loading state
- Confirm button shows loading indicator while `onConfirm` is executing
- Both buttons disabled during loading
- Password input disabled during loading

### R7: Sheet behavior
- Uses `BottomSheetContainer` as base
- Content-sized (not 70% height default) — compact sheet
- Supports backdrop tap to dismiss and Android back button (inherited from BottomSheetContainer)

## Props Interface

```typescript
interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requirePassword?: boolean;
  validatePassword?: (password: string) => Promise<boolean>;
  onConfirm: () => Promise<void>;
}
```

## Files

- `apps/mobile/src/components/ConfirmSheet/ConfirmSheet.tsx`
- `apps/mobile/src/components/ConfirmSheet/index.ts`
