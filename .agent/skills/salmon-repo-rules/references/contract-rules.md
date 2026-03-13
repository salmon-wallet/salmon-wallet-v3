# Shared UI Contract Rules

## What belongs in `packages/shared/src/types/ui`

- Props and supporting types for components or flows that exist across platforms
- Semantic fields such as labels, callbacks, domain values, states, and behavior flags
- Base contracts that platform-local types can extend

## What does not belong there

- `CSSProperties`
- `ViewStyle`
- DOM-only event shapes
- React Native-only props
- Contracts for components that exist only in `web` and `extension`
- Contracts for components that exist only in one app

## Canonical pattern

- Shared semantic contract in `packages/shared/src/types/ui`
- DOM extension in `packages/ui/.../types.ts`
- React Native extension in mobile-local types

## Smells

- A `shared/types/ui` contract that names only DOM concerns
- A `packages/ui` local type that duplicates semantic fields instead of extending shared
- Multiple public import paths for the same contract
