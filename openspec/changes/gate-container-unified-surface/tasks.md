## 1. Create GateContainer component

- [ ] 1.1 Create `apps/mobile/src/components/GateContainer/types.ts` — Define `GateState = 'locked' | 'collapsed' | 'settings' | 'wallets'` and `GateContainerProps` (state, headerHeight, screenHeight, onBackdropPress, children/render props for each state, header title/back/close for expanded states)
- [ ] 1.2 Create `apps/mobile/src/components/GateContainer/GateContainer.tsx` — Single `Animated.View` with `translateY` shared value. Handles:
  - `locked`: translateY=0 instant, no backdrop, renders lockContent
  - `collapsed`: translateY=-(screenH-headerH), no backdrop, renders headerContent with fade-in
  - `settings`/`wallets`: translateY=0 or partial, backdrop visible, renders expandedContent with TopSheet-style header (title, back, close)
  - Shared visual surface: LinearGradient bg + ScalesBackground + SafeAreaView
  - Backdrop Animated.View with pointerEvents toggle
- [ ] 1.3 Create `apps/mobile/src/components/GateContainer/index.ts` — Barrel export
- [ ] 1.4 Export from `apps/mobile/src/components/index.ts`

## 2. Extract LockContent from LockScreenOverlay

- [ ] 2.1 Create `apps/mobile/src/components/GateContainer/LockContent.tsx` — Extract the render content from `LockScreenOverlay`: logo, "Welcome back" text, password input (shown when `showPasswordFallback`), unlock button, forgot password link. Keep all biometric auto-prompt logic, password unlock logic, and state (password, error, isLoading, showPasswordFallback, biometricReady, etc.). Remove animation logic (translateY, animatedStyle). Receives same props as LockScreenOverlay minus animation-related ones.
- [ ] 2.2 The component should fill its parent container (flex: 1) and handle its own KeyboardAvoidingView.

## 3. Extract HeaderContent from WalletHeader

- [ ] 3.1 Create `apps/mobile/src/components/GateContainer/HeaderContent.tsx` — Extract the inner content from `WalletHeader`: avatar/wallet icon + account name+address + copy button + settings button. Remove `position: absolute`, `zIndex`, `paddingTop: safeAreaTop` (GateContainer handles positioning). Receives: accountName, address, onCopy, onSettings, onWallets, developerMode, avatarUrl, accountId.
- [ ] 3.2 The component should be a simple flex row matching current WalletHeader innerContainer layout.

## 4. Refactor SettingsSheet to drop TopSheet wrapper

- [ ] 4.1 `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx` — Remove `<TopSheet>` wrapper. The component now renders its content directly (settings sections, panel stack). It receives `visible` to know if it should mount/render panels. The header (title, back, close) is handled by GateContainer's expanded state header.
- [ ] 4.2 Export `onBack` and `title` state so GateContainer can render the header. This can be done via the existing `SettingsHeaderContext` or by lifting the panel stack state up.

## 5. Refactor WalletSwitcherSheet to drop TopSheet wrapper

- [ ] 5.1 `apps/mobile/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx` — Remove `<TopSheet>` wrapper. Render account list content directly. Header (title, close) handled by GateContainer.

## 6. Orchestrate in tabs _layout.tsx

- [ ] 6.1 `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Replace `WalletHeader`, `SettingsSheet`, and `WalletSwitcherSheet` with a single `<GateContainer>` component. Compute `gateState`:
  - `accountState.locked` → `'locked'`
  - `settingsVisible` → `'settings'`
  - `walletSwitcherVisible` → `'wallets'`
  - else → `'collapsed'`
- [ ] 6.2 Pass lock-related props (onUnlock, biometric, etc.) to LockContent inside GateContainer
- [ ] 6.3 Pass header props (accountName, address, etc.) to HeaderContent inside GateContainer
- [ ] 6.4 Pass settings/wallet props to their respective content components
- [ ] 6.5 Remove the `headerAnimateIn` state and the `wasLockedRef` — GateContainer handles this internally

## 7. Clean up root _layout.tsx

- [ ] 7.1 `apps/mobile/app/_layout.tsx` — Remove `LockScreenOverlay` render and its imports. Keep AppState listener for `actions.lockAccounts()`. Keep navigation logic (auth vs app routing). Remove `handleUnlock`, `handleUnlockWithKey`, `handleGetDerivedKey`, `handleRemoveAllAccounts` — these move to tabs layout.
- [ ] 7.2 Remove `useBiometricAuth` from root layout (it moves to tabs layout where it's already present).

## 8. Remove deprecated components

- [ ] 8.1 Delete or deprecate `apps/mobile/src/components/LockScreenOverlay/` — replaced by GateContainer + LockContent
- [ ] 8.2 Delete or deprecate `apps/mobile/src/components/WalletHeader/` — replaced by GateContainer + HeaderContent
- [ ] 8.3 Delete or deprecate `apps/mobile/src/components/TopSheet/` — no longer used (SettingsSheet and WalletSwitcherSheet were the only consumers)
- [ ] 8.4 Update `apps/mobile/src/components/index.ts` — Remove exports for LockScreenOverlay, WalletHeader, TopSheet. Add exports for GateContainer.

## 9. Verify

- [ ] 9.1 Typecheck passes: `pnpm turbo run typecheck --filter=@salmon/mobile`
- [ ] 9.2 Lock → unlock → header appears (gate slides up, header fades in)
- [ ] 9.3 Tap settings → gate slides down showing settings panels
- [ ] 9.4 Close settings → gate slides up to header
- [ ] 9.5 Tap wallet icon → gate slides down showing wallet switcher
- [ ] 9.6 Lock while settings open → gate instantly covers full screen
- [ ] 9.7 Biometric auto-prompt works on lock screen
- [ ] 9.8 Password fallback works when biometric fails
- [ ] 9.9 Forgot password / reset wallet works
