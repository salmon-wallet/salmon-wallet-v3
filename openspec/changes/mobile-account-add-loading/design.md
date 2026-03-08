## Context

The web `AccountAddPanel` (`packages/ui/src/components/AccountAddPanel/AccountAddPanel.tsx`) has a `loading` state and renders `<LoadingScreen visible={loading} ... />` as a fullscreen overlay during `handleConfirm`. The mobile version (`apps/mobile/src/components/AccountAddPanel/AccountAddPanel.tsx`) lacks this entirely — no loading state, no overlay, empty catch block.

A mobile `LoadingScreen` component already exists at `apps/mobile/src/components/LoadingScreen/LoadingScreen.tsx` with the same props interface (`LoadingScreenBaseProps` from `@salmon/shared`). It uses reanimated animations (pulsing logo, spinning arc, cycling tips) and has `visible` prop-driven fade in/out — identical API to the web version.

## Goals / Non-Goals

**Goals:**
- Add `loading` state + `LoadingScreen` overlay to mobile `AccountAddPanel.handleConfirm`, matching web behavior exactly
- Show localized error feedback via `Alert.alert()` on creation failure
- Prevent double-tap by gating on `loading` state

**Non-Goals:**
- Changing the `LoadingScreen` component itself (it's already complete)
- Modifying the web/extension `AccountAddPanel` (it's the source of truth)
- Changing `createAccount()` or `accountActions.addAccount()` APIs
- Adding loading state to the derive-scan step (already has `ActivityIndicator`)

## Decisions

### 1. Reuse existing `LoadingScreen` component
**Decision:** Import and render `LoadingScreen` from `../LoadingScreen` inside `AccountAddPanel`.
**Why:** The component already exists with the same API as the web version. No new component needed.
**Alternative rejected:** Using a simple `ActivityIndicator` overlay — would be inconsistent with the branded loading experience the web provides.

### 2. Position `LoadingScreen` as sibling to `SettingsScreenLayout`
**Decision:** Render `<LoadingScreen visible={loading} ... />` as a sibling before `<SettingsScreenLayout>`, mirroring the web pattern where it's a sibling to `<SettingsPanelContent>`.
**Why:** `LoadingScreen` is an absolute-positioned overlay (zIndex 9999) that covers the entire screen. It needs to be outside the scroll container.

### 3. Use `Alert.alert()` for error feedback
**Decision:** On catch, call `Alert.alert(t('general.error'), t('settings.account_add.creation_error'))` with a fallback message.
**Why:** Platform-appropriate for React Native. The web version just does `setLoading(false)` with no explicit error UI — the mobile version will be slightly better by showing an alert.

### 4. Guard `handleConfirm` with `loading` state
**Decision:** Add `if (loading) return;` at the top of `handleConfirm`.
**Why:** Prevents multiple concurrent `createAccount()` calls from double-tapping.

## Risks / Trade-offs

- **[Low risk] Translation key may not exist yet** → The key `settings.account_add.creation_error` might not be in translation files. Mitigation: use a fallback string in the `t()` call and add the key to both `en` and `es` translation files.
- **[Low risk] LoadingScreen covers TopSheet header** → Since `LoadingScreen` uses zIndex 9999 and absolute positioning, it will cover the settings sheet header. This is intentional (same as web behavior) — the user should not be able to navigate away during creation.
