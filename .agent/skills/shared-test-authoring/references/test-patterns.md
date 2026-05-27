# Shared Test Patterns

## Vitest config

```typescript
// packages/shared/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,          // describe, it, expect available without import
    environment: 'node',    // default; hooks override to jsdom
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] },
  },
})
```

## Test commands

```bash
pnpm turbo run test --filter=@salmon/shared        # Run all
pnpm --filter @salmon/shared test -- src/hooks/     # Run hooks only
pnpm --filter @salmon/shared test:coverage          # With coverage
```

## Category 1: Hook tests

Hook tests need jsdom for React rendering. Use `renderHook` + `act` + `waitFor`.

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

// Mock dependencies BEFORE importing hook
vi.mock('../storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
}));

import * as storage from '../storage';

describe('useMyHook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (storage.getStorageItem as any).mockResolvedValue(null);
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current[0].ready).toBe(true);
    });

    expect(result.current[0].data).toBeNull();
  });

  it('should update state when action is called', async () => {
    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current[0].ready).toBe(true);
    });

    await act(async () => {
      await result.current[1].doSomething('value');
    });

    expect(result.current[0].data).toBe('value');
  });
});
```

## Category 2: Service tests

Services need API client mocks declared before imports.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks BEFORE imports
vi.mock('../client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
  staticApiClient: { get: vi.fn() },
}));

import { getMyData, clearMyCache } from './myService';
import { apiClient } from '../client';

const mockGet = vi.mocked(apiClient.get);

const MOCK_DATA = [{ id: '1', name: 'Test' }];

describe('myService', () => {
  beforeEach(() => {
    clearMyCache();  // Always clear cache between tests
    vi.clearAllMocks();
  });

  it('should fetch data', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_DATA });
    const result = await getMyData('solana');
    expect(result).toEqual(MOCK_DATA);
    expect(mockGet).toHaveBeenCalledWith('/v1/endpoint/solana');
  });

  it('should return cached data on second call', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_DATA });
    await getMyData('solana');
    await getMyData('solana');
    expect(mockGet).toHaveBeenCalledTimes(1);  // Only one API call
  });

  it('should return null on error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    const result = await getMyData('solana');
    expect(result).toBeNull();
  });
});
```

## Category 3: Utility tests

Pure functions — minimal or no mocking.

```typescript
import { describe, it, expect } from 'vitest';
import { formatAddress, validateAmount } from './formatting';

describe('formatAddress', () => {
  it('should shorten address to 4+4 by default', () => {
    expect(formatAddress('AbCdEfGhIjKlMnOpQrStUvWx')).toBe('AbCd...UvWx');
  });

  it('should return empty string for null', () => {
    expect(formatAddress(null)).toBe('');
  });
});
```

## Category 4: Blockchain tests

Use real SDK objects when possible, mock API calls.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Keypair, VersionedTransaction } from '@solana/web3.js';

vi.mock('../hooks/useAvailableNetworks', () => ({
  fetchAndMergeNetworkConfigs: vi.fn().mockResolvedValue(true),
}));

describe('solana transaction', () => {
  it('should sign correctly', async () => {
    const keypair = Keypair.generate();
    // Use real SDK objects for crypto verification
    const result = await signTransaction(keypair, message);
    expect(result.signature).toBeDefined();
  });
});
```

## Category 5: Config tests

No mocking needed — test data structures and pure functions.

```typescript
import { describe, it, expect } from 'vitest';
import { EXPLORERS, getTransactionUrl } from './explorers';

describe('explorers', () => {
  it('should have mainnet explorer configured', () => {
    expect(EXPLORERS.ETHEREUM.mainnet?.ETHERSCAN).toBeDefined();
  });

  it('should return null for invalid explorer', () => {
    const url = getTransactionUrl('ETHEREUM', 'mainnet', 'INVALID', 'txid');
    expect(url).toBeNull();
  });
});
```

## Mocking patterns reference

**Stateful mocks** (for storage that persists across calls):
```typescript
let store: Record<string, any> = {};

(storage.setItem as any).mockImplementation((key: string, val: any) => {
  store[key] = val;
  return Promise.resolve();
});
(storage.getItem as any).mockImplementation((key: string) => {
  return Promise.resolve(store[key] ?? null);
});

beforeEach(() => { store = {}; });
```

**Chained responses** (different results per call):
```typescript
mockGet
  .mockResolvedValueOnce({ data: firstResult })
  .mockResolvedValueOnce({ data: secondResult });
```

**Testing invalid inputs**:
```typescript
// @ts-expect-error - Testing invalid input
const result = myFunction('invalid-arg');
expect(result).toBeNull();
```

## What to cover by category

| Category | Must test | Nice to test |
|---|---|---|
| Hooks | Init state, actions, error state, async loading | Edge cases, cleanup |
| Services | Success fetch, cache hit, API error, data structure | Rate limiting, fallback |
| Utils | Core transforms, null/empty inputs | Edge numeric cases |
| Blockchain | Transaction signing, address validation | Network-specific behavior |
| Crypto | Encrypt/decrypt round-trip, invalid password | Key derivation edge cases |
| Config | Structure presence, URL generation | Invalid inputs |

## File naming

- Test file: `module.test.ts` (co-located with source)
- No dedicated test directories — tests sit next to the code they test
