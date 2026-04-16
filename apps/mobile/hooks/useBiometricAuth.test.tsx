import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useBiometricAuth } from './useBiometricAuth';

const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();
const mockHasHardwareAsync = jest.fn();
const mockIsEnrolledAsync = jest.fn();
const mockSupportedAuthenticationTypesAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (...args: unknown[]) => mockGetItemAsync(...args),
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
}));

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  hasHardwareAsync: (...args: unknown[]) => mockHasHardwareAsync(...args),
  isEnrolledAsync: (...args: unknown[]) => mockIsEnrolledAsync(...args),
  supportedAuthenticationTypesAsync: (...args: unknown[]) => mockSupportedAuthenticationTypesAsync(...args),
}));

describe('useBiometricAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(true);
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([1]);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === 'salmon_biometric_key_exists') return Promise.resolve('true');
      if (key === 'salmon_biometric_enabled') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    mockSetItemAsync.mockResolvedValue(undefined);
    mockDeleteItemAsync.mockResolvedValue(undefined);
  });

  it('clears biometric preference and all stored biometric artifacts when disabled', async () => {
    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.state.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.setEnableBiometric(false);
    });

    expect(mockSetItemAsync).toHaveBeenCalledWith('salmon_biometric_enabled', 'false');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('salmon_biometric_key');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('salmon_biometric_key_marker');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('salmon_biometric_key_exists');
    expect(result.current.enableBiometric).toBe(false);
    expect(result.current.state.hasStoredKey).toBe(false);
  });
});
