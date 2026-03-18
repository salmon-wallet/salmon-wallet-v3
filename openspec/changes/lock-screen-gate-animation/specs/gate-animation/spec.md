## ADDED Requirements

### Requirement: Lock screen SHALL appear instantly without animation
When the app locks, the `LockScreenOverlay` SHALL be immediately visible at `translateY: 0` with no slide-down animation.

#### Scenario: App locks due to background/inactivity
- **WHEN** `locked` becomes `true`
- **THEN** the lock screen SHALL be at full-screen position immediately (no transition)
- **THEN** the WalletHeader SHALL be hidden (`opacity: 0`)

### Requirement: Unlock SHALL slide the gate up to header position then fade in header
When biometric or password unlock succeeds, the lock screen SHALL slide up and the WalletHeader elements SHALL fade in.

#### Scenario: Successful unlock with biometric
- **WHEN** the user unlocks via Face ID or password
- **THEN** the lock screen SHALL slide UP from `translateY: 0` to `translateY: -(screenHeight - headerHeight)` over 600ms with cubic easing
- **THEN** after the slide completes, `onAnimationComplete` SHALL fire
- **THEN** the WalletHeader content SHALL fade from `opacity: 0` to `opacity: 1` over 200ms

#### Scenario: WalletHeader hidden while locked
- **WHEN** the lock screen is visible (`locked === true`)
- **THEN** the WalletHeader SHALL have `opacity: 0` so it's not visible behind the lock screen
- **WHEN** unlock animation completes
- **THEN** the WalletHeader SHALL animate to `opacity: 1`

### Requirement: Lock screen and TopSheet SHALL share visual continuity
Both surfaces MUST use the same background color (`colors.background.primary`) and scales pattern to reinforce the gate metaphor.

#### Scenario: Visual consistency between lock and settings
- **WHEN** the lock screen is visible
- **THEN** it SHALL use `colors.background.primary` background with `ScalesBackground` overlay
- **WHEN** the TopSheet is visible
- **THEN** it SHALL use the same background color and scales pattern
