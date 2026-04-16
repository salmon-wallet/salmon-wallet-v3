/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const mockLockAccounts = vi.fn();
const mockUseInactivityTimeout = vi.fn();
const mockClearSessionKey = vi.fn();

vi.mock('@salmon/ui', () => ({
  WalletLayout: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  RouterProvider: () => null,
}));

vi.mock('./router', () => ({
  router: {},
}));

vi.mock('./utils/sessionKeyCache', () => ({
  clearSessionKey: () => mockClearSessionKey(),
}));

vi.mock('@salmon/shared', () => ({
  useAccountsContext: () => [{
    ready: true,
    locked: false,
    accounts: [{ id: 'account-1' }],
  }, {
    lockAccounts: mockLockAccounts,
  }],
  useInactivityTimeout: (config: unknown) => mockUseInactivityTimeout(config),
}));

describe('Web inactivity lock', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockClearSessionKey.mockResolvedValue(undefined);
    mockLockAccounts.mockResolvedValue(undefined);
  });

  it('configures inactivity lock only when wallet is unlocked and accounts exist', () => {
    render(<App />);

    expect(mockUseInactivityTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        timeoutMs: 5 * 60 * 1000,
      })
    );
  });

  it('clears session cache and locks accounts on inactivity timeout', async () => {
    render(<App />);

    const onTimeout = mockUseInactivityTimeout.mock.calls[0]?.[0]?.onTimeout as (() => void) | undefined;

    expect(onTimeout).toBeTypeOf('function');
    onTimeout?.();
    await Promise.resolve();

    expect(mockClearSessionKey).toHaveBeenCalledTimes(1);
    expect(mockLockAccounts).toHaveBeenCalledTimes(1);
  });
});
