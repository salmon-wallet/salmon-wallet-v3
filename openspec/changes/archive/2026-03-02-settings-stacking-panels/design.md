## Context

Settings navigation currently works as page-based routing across all three platforms:
- **Extension**: `HomePage.tsx` uses `currentPage` state machine — clicking a settings option closes the `SettingsSheet` (MUI Drawer) and swaps the entire page content via a switch/case with ~16 settings cases.
- **Web**: React Router routes under `/settings/*` with ~18 lazy-loaded route wrapper components.
- **Mobile**: Expo Router file-based routing with ~20 screen files under `app/(app)/(tabs)/settings/`.

All settings content components (selectors, pages) already live in `packages/ui` as self-contained components with `onBack` callbacks. They don't own their navigation — the parent dictates where they render.

The `SettingsSheet` (MUI Drawer in `packages/ui`, TopSheet in `apps/mobile`) already serves as the settings entry point on extension and mobile. Web has a separate `SettingsPage.tsx` hub.

## Goals / Non-Goals

**Goals:**
- Replace page-based settings navigation with stacking side panels on all platforms
- Keep existing settings content components intact (recycle, don't rewrite)
- Remove all dead code: route files, route wrappers, page switch cases
- Consistent UX across extension, web, and mobile

**Non-Goals:**
- Changing the visual design of individual settings screens (content stays the same)
- Adding new settings options
- Changing non-settings navigation (token detail, NFT, send, etc. remain page-based)
- Deep nesting beyond 2-3 levels (settings menu → sub-page → optional sub-sub-page like account-edit → account-name)

## Decisions

### 1. Panel Stack as a generic `SettingsPanelStack` component

**Decision:** Create a `SettingsPanelStack` component that manages an array/stack of panel entries. Each entry is a `{ screen: SettingsScreen, props?: Record<string, unknown> }`. The component renders all panels in the stack, each absolutely positioned and animated.

**Why:** This keeps the stack logic co-located with the UI rather than spread across routing layers. The existing content components don't need to change — they just get mounted inside panels instead of pages.

**Alternatives considered:**
- *Multiple MUI Drawers*: MUI supports stacked Drawers, but managing backdrop/z-index for N drawers is fragile and each has its own portal.
- *React Router nested layouts*: Would keep URL routing but doesn't give the "panel sliding over" visual. Also doesn't apply to extension (no router).

### 2. DOM implementation: Single container with CSS transitions (packages/ui)

**Decision:** The `SettingsPanelStack` for web/extension renders inside a single MUI Drawer. Internally, each panel is an absolutely-positioned div that slides in from the right using CSS transitions (`transform: translateX`). The panel at stack index N-1 stays in place (optionally dimmed/shifted), and panel N slides in on top.

**Key details:**
- Drawer opens → shows settings menu (panel 0)
- User clicks option → push panel 1 (slides in from right, 250ms ease-out)
- User clicks back → pop panel 1 (slides out to right, 200ms ease-in)
- Only the top 2 panels are rendered to DOM (current + previous for animation)
- Panel width matches the drawer width (320px for extension, responsive for web)
- Backdrop click on the Drawer itself closes everything (same as current behavior)

**Why over multiple Drawers:** Single container avoids z-index battles, portal stacking issues, and gives full control over the inter-panel animation.

### 3. Mobile implementation: Reanimated-based panel stack (apps/mobile)

**Decision:** Create a `SettingsPanelStack` React Native component using `react-native-reanimated` for animations. The SettingsSheet TopSheet remains as the container. Inside it, panels stack with `translateX` animations matching the existing 300ms cubic easing pattern.

**Key details:**
- TopSheet opens → shows settings menu (panel 0)
- User taps option → push panel 1 (animated `translateX` from screenWidth to 0, 300ms, `Easing.out(Easing.cubic)`)
- User taps back or swipe-right gesture → pop panel 1 (reverse animation)
- Swipe gesture: Pan responder on the top panel, threshold ~80px to dismiss
- Each panel is a full-height View inside the TopSheet content area
- Only top 2 panels rendered (same as DOM version)

**Why not modify Expo Router stack:** The goal is to keep everything inside the TopSheet modal. Using Expo Router would navigate away from the sheet, which is the current behavior we're replacing.

### 4. Shared hook: `useSettingsPanelStack` (packages/shared)

**Decision:** Create a platform-agnostic hook that manages the panel stack state:

```
useSettingsPanelStack() → {
  stack: SettingsPanelEntry[]
  push: (screen: SettingsScreen, props?: Record<string, unknown>) => void
  pop: () => void
  reset: () => void
  current: SettingsPanelEntry | null
  canGoBack: boolean
}
```

**Why shared:** The stack logic (push/pop/reset) is identical across platforms. Only the rendering differs. This lives in `packages/shared/src/hooks/useSettingsPanelStack.ts`.

### 5. Content component mapping: Registry pattern

**Decision:** Create a `settingsPanelRegistry` map that maps `SettingsScreen` → React component. Each platform provides its own registry since mobile uses different components than web/extension.

- `packages/ui`: Registry maps to `LanguageSelector`, `CurrencySelector`, `AccountsPage`, etc.
- `apps/mobile`: Registry maps to mobile-specific wrappers that use the same shared selectors but with RN-specific layout.

**Why:** Avoids a giant switch/case. Adding a new settings panel = adding one entry to the registry.

### 6. Rename `SettingsPageLayout` → `SettingsPanelContent`

**Decision:** Rename the existing `SettingsPageLayout` component (and directory) in `packages/ui` to `SettingsPanelContent`. The component is functionally identical — it provides a header (with back button + title) and scrollable content area. The rename reflects that these are no longer "pages".

### 7. SettingsSheet refactor: Becomes first panel in stack

**Decision:** The `SettingsSheet` component no longer calls `onNavigate` externally. Instead, it uses the `push` function from `useSettingsPanelStack` to push sub-panels. The `SettingsSheet` content (menu with sections) becomes panel index 0 in the stack.

Props change:
- Remove: `onNavigate`
- The sheet internally manages all settings navigation via the panel stack
- Keep: `onClose`, `developerNetworksEnabled`, `onDeveloperNetworksToggle`, `onRemoveWallet`, `onRemoveAllWallets`
- Add: All props needed by sub-panels (language, currency, accounts, etc.) — passed through a context or prop-drilled via the registry

### 8. Props delivery: SettingsContext

**Decision:** Create a `SettingsProvider` context in `packages/shared` that aggregates all data needed by settings sub-panels (active language, currencies, accounts, explorers, etc.). Each content component already consumes hooks like `useAccountsContext()`, `useCurrencyContext()`, `useLanguage()` — so most data is already available via existing contexts. The `SettingsProvider` only needs to provide panel-stack-specific callbacks (what to do after selecting a language, etc.) and the `push`/`pop` navigation.

**Why context over prop drilling:** With a registry pattern, we can't easily prop-drill to arbitrary components. A context lets any panel access navigation and shared callbacks.

### 9. Dead code removal strategy

**Extension (`apps/extension`):**
- Remove all settings-related cases from `HomePage.tsx` switch: `backup`, `currency`, `about`, `language`, `explorer`, `addressBook`, `addressBookAdd`, `addressBookEdit`, `trustedApps`, `security`, `support`, `privateKey`, `avatar`, `accounts`, `accountEdit`, `accountName`, `accountAdd`
- Remove corresponding `PageView` type entries
- Remove `handleSettingsNavigate` callback (navigation is internal to panel stack now)

**Web (`apps/web`):**
- Remove all `/settings/*` sub-routes from `router.tsx` (keep `/settings` main route)
- Delete or gut `apps/web/src/pages/settings/index.tsx` (all 18 route wrappers become dead)
- Refactor `SettingsPage.tsx` to trigger the panel stack drawer instead of navigating to routes

**Mobile (`apps/mobile`):**
- Delete all files in `app/(app)/(tabs)/settings/` except `_layout.tsx` and `index.tsx` (or repurpose index as a redirect)
- Remove `handleSettingsNavigate` from `_layout.tsx` that does `router.push`
- The TopSheet + PanelStack handles everything internally

## Risks / Trade-offs

- **[Deep linking breaks for web]** → Currently `/settings/language` is a valid URL. After this change, settings sub-pages won't have URLs. Mitigation: This is acceptable for a wallet app — settings don't need deep links. The main `/settings` URL still works.
- **[Extension popup height]** → Extension popup is ~600px tall. Stacking panels within a 320px-wide drawer might feel cramped for content-heavy pages (accounts, address book). Mitigation: Panels use the full popup height (not just drawer height). The drawer becomes a full-height panel stack container.
- **[Mobile gesture conflicts]** → Swipe-right to go back might conflict with the TopSheet's drag-to-close. Mitigation: The TopSheet drag is vertical (drag down to close), while panel back is horizontal (swipe right). No conflict.
- **[Prop aggregation complexity]** → Some settings pages need many props (accounts page needs account list, add/edit callbacks, etc.). Mitigation: Use existing context hooks — most data is already available via `useAccountsContext()`, `useCurrencyContext()`, etc. The panel stack doesn't need to pass this data.
