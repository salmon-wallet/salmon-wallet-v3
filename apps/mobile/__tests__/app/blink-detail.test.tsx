import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockFetchActionMetadata = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

class mockActionClientError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.name = 'ActionClientError';
    this.code = code;
  }
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    back: (...args: unknown[]) => mockBack(...args),
  }),
  useLocalSearchParams: () => ({ host: 'dial.to', path: '/donate' }),
}));

jest.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', muted: '#999', inverse: '#000', error: '#f00' },
    border: { subtle: '#333', default: '#555' },
    background: { primary: '#000', secondary: '#111' },
    button: {
      primaryBackground: '#fff',
      primaryText: '#000',
      disabledOpacity: 0.5,
    },
    status: { error: '#f00' },
  },
  fontFamilyNative: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: { sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24 },
  letterSpacing: { wide: 0, widest: 0 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, headerPadding: 16 },
  ms: (v: number) => v,
  s: (v: number) => v,
  vs: (v: number) => v,
  componentSizes: { buttonHeight: 48, buttonRadius: 24, inputHeight: 44 },
  blinks: {
    client: {
      fetchActionMetadata: (...args: unknown[]) => mockFetchActionMetadata(...args),
      ActionClientError: mockActionClientError,
    },
  },
}));

import BlinkDetailScreen from '../../app/blink-detail';

const validResponse = {
  type: 'action',
  icon: 'https://dial.to/icon.png',
  title: 'Donate',
  description: 'Donate to the cause',
  label: 'Donate',
  links: {
    actions: [
      {
        type: 'transaction',
        href: '/donate/{amount}',
        label: 'Send',
        parameters: [
          { name: 'amount', type: 'number', required: true, min: 1 },
        ],
      },
    ],
  },
};

describe('BlinkDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state initially', async () => {
    let resolve!: (v: unknown) => void;
    mockFetchActionMetadata.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    render(<BlinkDetailScreen />);

    expect(screen.getByText('blinks.detail.loading')).toBeTruthy();

    await act(async () => {
      resolve(validResponse);
    });
  });

  it('renders icon, title, description, label after successful fetch', async () => {
    mockFetchActionMetadata.mockResolvedValueOnce(validResponse);
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Donate to the cause')).toBeTruthy();
    });
    expect(screen.getByText('Donate')).toBeTruthy();
    expect(screen.getByText('Send')).toBeTruthy();
    expect(screen.getByTestId('blink-icon').props.source.uri).toBe('https://dial.to/icon.png');
  });

  it('renders the parameter inputs from the response', async () => {
    mockFetchActionMetadata.mockResolvedValueOnce(validResponse);
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('param-amount')).toBeTruthy();
    });
  });

  it('renders untrusted_host error banner', async () => {
    mockFetchActionMetadata.mockRejectedValueOnce(new mockActionClientError('untrusted_host'));
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('blinks.detail.error.untrusted_host')).toBeTruthy();
    });
  });

  it('renders not_https error banner', async () => {
    mockFetchActionMetadata.mockRejectedValueOnce(new mockActionClientError('not_https'));
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('blinks.detail.error.not_https')).toBeTruthy();
    });
  });

  it('renders timeout error banner', async () => {
    mockFetchActionMetadata.mockRejectedValueOnce(new mockActionClientError('timeout'));
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('blinks.detail.error.timeout')).toBeTruthy();
    });
  });

  it('disables Continue while required field is empty', async () => {
    mockFetchActionMetadata.mockResolvedValueOnce(validResponse);
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('blink-continue')).toBeTruthy();
    });
    const btn = screen.getByTestId('blink-continue');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables Continue and navigates when all required fields are valid', async () => {
    mockFetchActionMetadata.mockResolvedValueOnce(validResponse);
    render(<BlinkDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('param-amount')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('param-amount'), '5');

    const btn = screen.getByTestId('blink-continue');
    await waitFor(() => {
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });

    fireEvent.press(btn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const arg = mockPush.mock.calls[0][0];
    expect(arg.pathname).toBe('/blink-approval');
    expect(arg.params.host).toBe('dial.to');
    expect(typeof arg.params.data).toBe('string');
    const parsed = JSON.parse(arg.params.data);
    expect(parsed.values.amount).toBe('5');
  });
});
