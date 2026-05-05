/**
 * Tests for the /blink-success route — the post-submit confirmation screen.
 *
 * Reads `signature` (and optional `host`) from route params; renders the
 * shared TransactionSuccessScreen with a truncated signature; the Done
 * button dismisses the modal stack back to the Blinks tab.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockDismissAll = jest.fn();
const mockReplace = jest.fn();
const mockParams: { signature?: string; host?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    dismissAll: (...a: unknown[]) => mockDismissAll(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockTransactionSuccessScreen = jest.fn();
jest.mock('../../src/components/TransactionSuccessScreen', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    TransactionSuccessScreen: (props: {
      title: string;
      summary: string;
      explorerUrl: string | null;
      onContinue: () => void;
    }) => {
      mockTransactionSuccessScreen(props);
      return React.createElement(
        View,
        { testID: 'tx-success-mock' },
        React.createElement(Text, { testID: 'tx-success-title' }, props.title),
        React.createElement(Text, { testID: 'tx-success-summary' }, props.summary),
        React.createElement(
          TouchableOpacity,
          { testID: 'tx-success-continue', onPress: props.onContinue },
          React.createElement(Text, null, 'continue'),
        ),
      );
    },
  };
});

jest.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', muted: '#999' },
    background: { primary: '#000' },
  },
  fontFamilyNative: { medium: 'System' },
  fontSize: { md: 16 },
  spacing: { md: 12 },
  ms: (v: number) => v,
  s: (v: number) => v,
  vs: (v: number) => v,
}));

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.signature;
  delete mockParams.host;
});

describe('BlinkSuccessScreen', () => {
  it('renders TransactionSuccessScreen with truncated signature', () => {
    mockParams.signature =
      'A1B2C3D4E5F6G7H8aaaaaaaaaaaaaaaaaaaaaaaaaaaaZ8Y7X6W5V4U3T2S1';
    mockParams.host = 'dial.to';
    const BlinkSuccess = require('../../app/blink-success').default;
    render(<BlinkSuccess />);

    expect(screen.getByTestId('tx-success-mock')).toBeTruthy();
    expect(screen.getByTestId('tx-success-title').props.children).toBe(
      'blinks.success.title',
    );
    // First 8 + ellipsis + last 8.
    expect(screen.getByTestId('tx-success-summary').props.children).toBe(
      'A1B2C3D4…V4U3T2S1',
    );
  });

  it('Done button calls router.dismissAll()', () => {
    mockParams.signature = 'A1B2C3D4E5F6G7H8aaaaZ8Y7X6W5V4U3T2S1';
    const BlinkSuccess = require('../../app/blink-success').default;
    render(<BlinkSuccess />);

    fireEvent.press(screen.getByTestId('tx-success-continue'));
    expect(mockDismissAll).toHaveBeenCalled();
  });

  it('renders fallback when signature is missing', () => {
    const BlinkSuccess = require('../../app/blink-success').default;
    render(<BlinkSuccess />);
    expect(screen.getByTestId('blink-success-empty')).toBeTruthy();
  });
});
