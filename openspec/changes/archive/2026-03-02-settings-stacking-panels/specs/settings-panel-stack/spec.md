## ADDED Requirements

### Requirement: Panel stack state hook
The system SHALL provide a `useSettingsPanelStack` hook in `packages/shared/src/hooks/` that manages an ordered stack of panel entries. Each entry SHALL contain a `screen: SettingsScreen` identifier and optional `props: Record<string, unknown>`. The hook SHALL expose `push(screen, props?)`, `pop()`, `reset()`, `current`, `stack`, and `canGoBack`.

**Package:** `packages/shared`

#### Scenario: Initial state
- **WHEN** the hook is initialized
- **THEN** the stack SHALL be empty and `current` SHALL be `null` and `canGoBack` SHALL be `false`

#### Scenario: Push a panel
- **WHEN** `push('language')` is called
- **THEN** the stack SHALL contain one entry with `screen: 'language'`
- **THEN** `current` SHALL return that entry
- **THEN** `canGoBack` SHALL be `true`

#### Scenario: Push multiple panels
- **WHEN** `push('accounts')` then `push('account-edit', { accountId: '123' })` are called
- **THEN** the stack SHALL contain two entries in order
- **THEN** `current` SHALL return the `account-edit` entry with its props

#### Scenario: Pop a panel
- **WHEN** the stack has two entries and `pop()` is called
- **THEN** the top entry SHALL be removed
- **THEN** `current` SHALL return the previous entry

#### Scenario: Pop on empty stack
- **WHEN** the stack has one entry and `pop()` is called
- **THEN** the stack SHALL be empty
- **THEN** `current` SHALL be `null`

#### Scenario: Reset
- **WHEN** `reset()` is called
- **THEN** the stack SHALL be empty regardless of how many entries it had

### Requirement: DOM panel stack component
The system SHALL provide a `SettingsPanelStack` component in `packages/ui/src/components/SettingsPanelStack/` that renders stacked panels inside a single MUI Drawer container. Each panel SHALL be an absolutely-positioned container that slides in from the right when pushed and slides out to the right when popped.

**Package:** `packages/ui`

#### Scenario: Drawer opens with settings menu
- **WHEN** the panel stack is opened with `visible=true`
- **THEN** a MUI Drawer SHALL open from the right
- **THEN** the settings menu (sections with navigation items) SHALL be displayed as the base content

#### Scenario: User navigates to a sub-panel
- **WHEN** the user clicks a navigation item (e.g., "Language")
- **THEN** a new panel SHALL slide in from the right over the settings menu (250ms ease-out)
- **THEN** the new panel SHALL display the corresponding content component (e.g., `LanguageSelector`)

#### Scenario: User goes back from a sub-panel
- **WHEN** the user clicks the back button on a sub-panel
- **THEN** the top panel SHALL slide out to the right (200ms ease-in)
- **THEN** the previous panel SHALL be revealed underneath

#### Scenario: User closes the drawer
- **WHEN** the user clicks the backdrop or close button
- **THEN** the entire drawer SHALL close
- **THEN** the panel stack SHALL reset to empty

#### Scenario: Nested navigation within panels
- **WHEN** the user navigates from Accounts → Account Edit → Account Name
- **THEN** each panel SHALL stack on top of the previous one
- **THEN** back navigation SHALL pop one panel at a time in reverse order

### Requirement: Mobile panel stack component
The system SHALL provide a `SettingsPanelStack` component in `apps/mobile/src/components/SettingsPanelStack/` that renders stacked panels inside the existing TopSheet container using `react-native-reanimated` animations. Panels SHALL slide in from the right with 300ms cubic easing matching the existing TopSheet animation pattern.

**Package:** `apps/mobile`

#### Scenario: TopSheet opens with settings menu
- **WHEN** the settings TopSheet opens
- **THEN** the settings menu (sections with navigation items) SHALL be displayed as the base content

#### Scenario: User navigates to a sub-panel
- **WHEN** the user taps a navigation item
- **THEN** a new panel SHALL slide in from the right (300ms, `Easing.out(Easing.cubic)`)
- **THEN** the panel SHALL display the corresponding content component

#### Scenario: User goes back via button
- **WHEN** the user taps the back button on a sub-panel
- **THEN** the top panel SHALL slide out to the right (300ms, `Easing.in(Easing.cubic)`)

#### Scenario: User goes back via swipe gesture
- **WHEN** the user swipes right on a sub-panel past 80px threshold
- **THEN** the top panel SHALL animate out to the right
- **THEN** the previous panel SHALL be revealed

#### Scenario: Swipe does not conflict with TopSheet dismiss
- **WHEN** the user swipes down on the TopSheet
- **THEN** the TopSheet SHALL close (existing vertical dismiss behavior)
- **WHEN** the user swipes right on a sub-panel
- **THEN** only the horizontal panel-back gesture SHALL trigger (no vertical dismiss)

### Requirement: Settings menu as base panel content
The system SHALL refactor the `SettingsSheet` so that its menu content (sections: Account, Preferences, Advanced, Danger Zone) becomes the base content of the panel stack (panel index 0). Clicking a navigation item SHALL call `push(screen)` on the panel stack instead of dispatching an external `onNavigate` callback.

**Package:** `packages/ui` (DOM), `apps/mobile` (React Native)

#### Scenario: Settings menu item triggers internal navigation
- **WHEN** the user clicks/taps "Language" in the settings menu
- **THEN** the system SHALL call `push('language')` on the panel stack
- **THEN** the `LanguageSelector` component SHALL render in a new panel sliding in from the right

#### Scenario: Toggle items remain in-place
- **WHEN** the user toggles "Developer Networks"
- **THEN** no panel SHALL be pushed
- **THEN** the toggle SHALL update in-place as before

#### Scenario: Action items remain in-place
- **WHEN** the user clicks "Remove Wallet" or "Remove All Wallets"
- **THEN** no panel SHALL be pushed
- **THEN** the existing confirmation dialog flow SHALL trigger as before

### Requirement: Rename SettingsPageLayout to SettingsPanelContent
The system SHALL rename the `SettingsPageLayout` component and directory in `packages/ui` to `SettingsPanelContent`. All imports across the codebase SHALL be updated. The component functionality SHALL remain identical (header with back button + title, scrollable content area).

**Package:** `packages/ui`

#### Scenario: All existing usages update to new name
- **WHEN** any component imports `SettingsPageLayout`
- **THEN** the import SHALL be updated to `SettingsPanelContent`
- **THEN** the component SHALL render identically to before

### Requirement: Remove onNavigate from SettingsSheetBaseProps
The system SHALL remove the `onNavigate` prop from `SettingsSheetBaseProps` in `packages/shared/src/types/settings.ts`. Navigation is now handled internally by the panel stack. All consumers that pass `onNavigate` SHALL be updated to remove it.

**Package:** `packages/shared`

#### Scenario: SettingsSheetBaseProps no longer includes onNavigate
- **WHEN** a consumer imports `SettingsSheetBaseProps`
- **THEN** the `onNavigate` property SHALL NOT exist on the type

### Requirement: Remove settings page routing from extension
The system SHALL remove all settings-related `PageView` cases from `HomePage.tsx` in `apps/extension`. The settings-related entries in the `PageView` type (`backup`, `currency`, `about`, `language`, `explorer`, `addressBook`, `addressBookAdd`, `addressBookEdit`, `trustedApps`, `security`, `support`, `privateKey`, `avatar`, `accounts`, `accountEdit`, `accountName`, `accountAdd`) SHALL be removed. The `handleSettingsNavigate` callback SHALL be removed.

**Package:** `apps/extension`

#### Scenario: HomePage no longer renders settings pages
- **WHEN** the user opens settings and navigates to Language
- **THEN** `HomePage.tsx` SHALL NOT change its `currentPage` state
- **THEN** the Language panel SHALL render inside the settings drawer panel stack

### Requirement: Remove settings sub-routes from web
The system SHALL remove all `/settings/*` sub-routes from `apps/web/src/router.tsx`. The route wrapper components in `apps/web/src/pages/settings/index.tsx` SHALL be deleted. The `/settings` main route SHALL trigger the panel stack drawer. The `SettingsPage.tsx` file SHALL be refactored or replaced to open the panel stack.

**Package:** `apps/web`

#### Scenario: Settings sub-URLs no longer exist
- **WHEN** a user navigates to `/settings/language` directly
- **THEN** the system SHALL redirect to `/settings` (via the existing catch-all redirect)

#### Scenario: Settings page opens panel stack
- **WHEN** the user navigates to `/settings` or clicks the settings trigger
- **THEN** the `SettingsPanelStack` drawer SHALL open with the settings menu

### Requirement: Remove settings screen routes from mobile
The system SHALL delete all settings screen files from `apps/mobile/app/(app)/(tabs)/settings/` (approximately 20 files). The `handleSettingsNavigate` callback in `_layout.tsx` that calls `router.push` SHALL be removed. Settings navigation SHALL be handled entirely within the TopSheet panel stack.

**Package:** `apps/mobile`

#### Scenario: No Expo Router navigation for settings
- **WHEN** the user taps a settings option in the TopSheet
- **THEN** the system SHALL NOT call `router.push()`
- **THEN** the content SHALL render inside the TopSheet panel stack

### Requirement: Panel content component registry
The system SHALL provide a registry (map) that associates each `SettingsScreen` value with its corresponding content component. The DOM registry SHALL live in `packages/ui` and the mobile registry SHALL live in `apps/mobile`. Each entry maps a screen identifier to a React component that accepts standardized props including `onBack`.

**Package:** `packages/ui`, `apps/mobile`

#### Scenario: Registry resolves a known screen
- **WHEN** the panel stack needs to render screen `'language'`
- **THEN** the registry SHALL return the `LanguageSelector` component

#### Scenario: Registry handles sub-navigation props
- **WHEN** the panel stack renders `'account-edit'` with `{ accountId: '123' }`
- **THEN** the registry SHALL return `AccountEditPage` and the props SHALL be forwarded
