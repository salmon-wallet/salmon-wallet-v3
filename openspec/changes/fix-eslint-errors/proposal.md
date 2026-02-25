## Why

ESLint reports 6 errors and 3 warnings in `@salmon/shared`, blocking CI. The errors are all `react-hooks/refs` violations (assigning `ref.current` during render) in `useRefreshOnFocus` hooks. The warnings are unused variables and an unnecessary dependency.

## What Changes

- Move `ref.current` assignments into `useEffect` in all 3 `useRefreshOnFocus` variants (`.ts`, `.native.ts`, `.web.ts`)
- Prefix unused `onBridgeInitiated` with `_` in `useSwapScreenLogic.ts`
- Remove unused `activeBlockchainAccount` destructuring in `useSendContacts.ts`
- Remove unnecessary `swapMode` dependency from `useMemo` in `useSwapScreenLogic.ts`

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — these are implementation-level lint fixes, no spec-level behavior changes)

## Impact

- `packages/shared/src/hooks/useRefreshOnFocus.ts`
- `packages/shared/src/hooks/useRefreshOnFocus.native.ts`
- `packages/shared/src/hooks/useRefreshOnFocus.web.ts`
- `packages/shared/src/hooks/useSwapScreenLogic.ts`
- `packages/shared/src/hooks/useSendContacts.ts`
