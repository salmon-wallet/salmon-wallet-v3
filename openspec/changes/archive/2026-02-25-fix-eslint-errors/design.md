## Approach

Minimal, surgical fixes — each lint issue is addressed in the simplest correct way.

### 1. `react-hooks/refs` errors in useRefreshOnFocus (6 errors)

All three variants (`.ts`, `.native.ts`, `.web.ts`) assign `ref.current` during render:

```ts
const onFocusRef = useRef(onFocus);
onFocusRef.current = onFocus; // ERROR: during render
```

**Fix**: Wrap the assignments in a `useEffect`:

```ts
const onFocusRef = useRef(onFocus);
useEffect(() => { onFocusRef.current = onFocus; }, [onFocus]);

const lastUpdatedRef = useRef(lastUpdated);
useEffect(() => { lastUpdatedRef.current = lastUpdated; }, [lastUpdated]);
```

This is the standard React pattern for keeping refs in sync with props/state.

### 2. Unused `activeBlockchainAccount` in useSendContacts.ts (1 warning)

The variable is destructured from context but never used. Remove it from destructuring.

### 3. Unused `onBridgeInitiated` in useSwapScreenLogic.ts (1 warning)

The parameter is destructured from props but never used. Prefix with `_` to signal intentional non-use.

### 4. Unnecessary `swapMode` dependency in useSwapScreenLogic.ts (1 warning)

The `useMemo` for `swapConfirmLabel` doesn't use `swapMode` in its body (it was removed in a recent change). Remove it from the dependency array.

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/src/hooks/useRefreshOnFocus.ts` | Wrap ref assignments in useEffect |
| `packages/shared/src/hooks/useRefreshOnFocus.native.ts` | Wrap ref assignments in useEffect |
| `packages/shared/src/hooks/useRefreshOnFocus.web.ts` | Wrap ref assignments in useEffect |
| `packages/shared/src/hooks/useSendContacts.ts` | Remove unused destructuring |
| `packages/shared/src/hooks/useSwapScreenLogic.ts` | Prefix unused param, remove dep |
