import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockListTrustedHosts = jest.fn();
const mockPush = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
  }),
}));

jest.mock('../../hooks/useTabChrome', () => ({
  useTabChrome: () => ({
    headerContentOffset: 0,
    scrollBottomPadding: 0,
  }),
}));

jest.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', muted: '#999' },
    border: { subtle: '#333' },
  },
  fontFamilyNative: { regular: 'System', medium: 'System', semiBold: 'System' },
  fontSize: { md: 16, lg: 18, xl: 20 },
  letterSpacing: { wide: 0 },
  listTrustedHosts: (...args: unknown[]) => mockListTrustedHosts(...args),
  ms: (value: number) => value,
  s: (value: number) => value,
  spacing: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, headerPadding: 16 },
  vs: (value: number) => value,
}));

import BlinksScreen from '../../app/(app)/(tabs)/blinks';

describe('BlinksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders one row per trusted host returned by listTrustedHosts', () => {
    mockListTrustedHosts.mockReturnValue(['dial.to', 'jup.ag', 'tensor.trade']);

    render(<BlinksScreen />);

    expect(screen.getByText('dial.to')).toBeTruthy();
    expect(screen.getByText('jup.ag')).toBeTruthy();
    expect(screen.getByText('tensor.trade')).toBeTruthy();
  });

  it('navigates to the blink-detail route with the host param when a row is pressed', () => {
    mockListTrustedHosts.mockReturnValue(['dial.to']);

    render(<BlinksScreen />);

    fireEvent.press(screen.getByText('dial.to'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/blink-detail?host=dial.to');
  });

  it('shows the empty state when no trusted hosts are available', () => {
    mockListTrustedHosts.mockReturnValue([]);

    render(<BlinksScreen />);

    expect(screen.getByText('blinks.empty_state')).toBeTruthy();
  });
});
