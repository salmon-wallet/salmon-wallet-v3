import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import RootLayout from '../app/_layout';

const mockLockAccounts = jest.fn();
const mockUseAccountsContext = jest.fn();

jest.mock('react-native-reanimated', () => ({}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const MockStack = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  MockStack.Screen = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

  return {
    Stack: MockStack,
    router: { replace: jest.fn() },
    useSegments: jest.fn(() => ['(app)', '(tabs)']),
    useRootNavigationState: jest.fn(() => ({ key: 'root' })),
    ErrorBoundary: () => null,
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('../src/i18n', () => ({
  I18nProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@expo/vector-icons/FontAwesome', () => ({
  __esModule: true,
  default: {
    font: {},
  },
}));

jest.mock('@salmon/assets/src/fonts/DMSans-Light.ttf', () => 'DMSansLight', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-Regular.ttf', () => 'DMSansRegular', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-Medium.ttf', () => 'DMSansMedium', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-SemiBold.ttf', () => 'DMSansSemiBold', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-Bold.ttf', () => 'DMSansBold', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-ExtraBold.ttf', () => 'DMSansExtraBold', { virtual: true });
jest.mock('@salmon/assets/src/fonts/DMSans-Black.ttf', () => 'DMSansBlack', { virtual: true });

jest.mock('@salmon/shared', () => ({
  colors: {
    background: { primary: '#000' },
  },
  AccountsProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  CurrencyProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useAccountsContext: () => mockUseAccountsContext(),
  useInactivityTimeout: jest.fn(),
}));

describe('RootLayout mobile lock lifecycle', () => {
  let listeners: Record<string, Array<(...args: any[]) => void>>;

  beforeEach(() => {
    jest.clearAllMocks();
    listeners = {};
    mockUseAccountsContext.mockReturnValue([
      {
        ready: true,
        locked: false,
        requiredLock: true,
        accounts: [{ id: 'account-1' }],
      },
      {
        lockAccounts: mockLockAccounts,
      },
    ]);
  });

  it('subscribes to Android blur so lock cannot be skipped when the app loses focus without backgrounding', async () => {
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((eventType: any, listener: any) => {
        listeners[eventType] ??= [];
        listeners[eventType].push(listener);
        return { remove: jest.fn() } as any;
      });

    render(<RootLayout />);

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
  });

  it('locks on repeated Android blur/background cycles without needing the app state change every time', async () => {
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((eventType: any, listener: any) => {
        listeners[eventType] ??= [];
        listeners[eventType].push(listener);
        return { remove: jest.fn() } as any;
      });

    mockLockAccounts.mockResolvedValue(undefined);

    render(<RootLayout />);

    await waitFor(() => {
      expect(listeners.blur).toHaveLength(1);
      expect(listeners.change).toHaveLength(1);
    });

    listeners.blur[0]();
    await Promise.resolve();

    listeners.change[0]('active');
    listeners.blur[0]();
    await Promise.resolve();

    expect(mockLockAccounts).toHaveBeenCalledTimes(2);
  });

  it('does not lock on iOS-style inactive transitions alone', async () => {
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((eventType: any, listener: any) => {
        listeners[eventType] ??= [];
        listeners[eventType].push(listener);
        return { remove: jest.fn() } as any;
      });

    render(<RootLayout />);

    await waitFor(() => {
      expect(listeners.change).toHaveLength(1);
    });

    listeners.change[0]('inactive');
    await Promise.resolve();

    expect(mockLockAccounts).not.toHaveBeenCalled();
  });

  it('locks when iOS eventually reaches background after becoming inactive', async () => {
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((eventType: any, listener: any) => {
        listeners[eventType] ??= [];
        listeners[eventType].push(listener);
        return { remove: jest.fn() } as any;
      });

    mockLockAccounts.mockResolvedValue(undefined);

    render(<RootLayout />);

    await waitFor(() => {
      expect(listeners.change).toHaveLength(1);
    });

    listeners.change[0]('inactive');
    await Promise.resolve();
    listeners.change[0]('background');
    await Promise.resolve();

    expect(mockLockAccounts).toHaveBeenCalledTimes(1);
  });
});
