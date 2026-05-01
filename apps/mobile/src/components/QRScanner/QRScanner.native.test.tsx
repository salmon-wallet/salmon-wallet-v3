import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@salmon/shared', () => ({
  colors: {
    scanner: {
      background: '#000',
      surface: '#111',
      text: '#fff',
      textSecondary: '#ccc',
      textTertiary: '#999',
      button: '#222',
    },
  },
  spacing: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '5xl': 40,
    base: 10,
  },
  borderRadius: {
    iconLg: 18,
    lg: 16,
  },
  fontFamilyNative: {
    semiBold: 'System',
  },
  fontSize: {
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
  },
  fontWeight: {
    semibold: '600',
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { QRScanner } from './QRScanner.native';

describe('QRScanner.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render placeholder content when hidden', () => {
    render(
      <QRScanner
        visible={false}
        onClose={jest.fn()}
        onScan={jest.fn()}
      />
    );

    expect(screen.queryByText('Camera Setup Required')).toBeNull();
  });

  it('renders the placeholder scanner copy when visible', () => {
    render(
      <QRScanner
        visible
        onClose={jest.fn()}
        onScan={jest.fn()}
        title="Custom QR Title"
      />
    );

    expect(screen.getByText('Custom QR Title')).toBeTruthy();
    expect(screen.getByText('Camera Setup Required')).toBeTruthy();
    expect(screen.getByText('QR Scanner requires native camera configuration.')).toBeTruthy();
    expect(
      screen.getByText('Please configure expo-camera or react-native-camera to enable QR code scanning.')
    ).toBeTruthy();
  });

  it('calls onClose from both the back action and the footer button', () => {
    const onClose = jest.fn();

    render(
      <QRScanner
        visible
        onClose={onClose}
        onScan={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('< Back'));
    fireEvent.press(screen.getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
