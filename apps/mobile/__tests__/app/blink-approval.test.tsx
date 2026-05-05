/**
 * Tests for the /blink-approval route — fetches the Action POST tx,
 * simulates it, drives the ActionApprovalSheet, and runs the sign+submit
 * pipeline.
 *
 * Risk gates exercised here:
 *   R2 — simulate-then-show; sim error blocks Approve unless toggle is set.
 *   R8 — partial-signed: the sign helper is invoked with `{ partialSigned:
 *        true }` so it does NOT mutate feePayer / blockhash. Unsigned: helper
 *        receives `{ partialSigned: false }`.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockRequestActionTransaction = jest.fn();
const mockSimulateActionTx = jest.fn();
const mockSignAndSubmit = jest.fn();
const mockGetConnection = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

class mockActionClientError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = 'ActionClientError';
    this.code = code;
  }
}

class mockActionSimulationError extends Error {
  code: string;
  logs?: string[];
  constructor(code: string, logs?: string[]) {
    super(code);
    this.name = 'ActionSimulationError';
    this.code = code;
    this.logs = logs;
  }
}

const FAKE_PUBKEY = '11111111111111111111111111111112';

const mockAccount: any = {
  getReceiveAddress: () => FAKE_PUBKEY,
  getConnection: (...args: unknown[]) => mockGetConnection(...args),
};

const mockAccountState = {
  ready: true,
  activeBlockchainAccount: mockAccount,
  networkId: 'solana-mainnet',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    back: (...args: unknown[]) => mockBack(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  }),
  useLocalSearchParams: () => ({
    host: 'dial.to',
    data: JSON.stringify({
      path: '/donate',
      action: { href: '/donate', label: 'Send' },
      values: { amount: '5' },
    }),
  }),
}));

jest.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', muted: '#999', inverse: '#000' },
    border: { subtle: '#333', default: '#555' },
    background: { primary: '#000', secondary: '#111' },
    button: {
      primaryBackground: '#fff',
      primaryText: '#000',
      disabledOpacity: 0.5,
    },
    status: {
      error: '#f00',
      errorBackground: '#200',
      warning: '#ffb000',
      warningBackground: '#332200',
      success: '#0f0',
    },
  },
  fontFamilyNative: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: { sm: 14, md: 16, lg: 18, xl: 20 },
  letterSpacing: { wide: 0, widest: 0 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, headerPadding: 16 },
  ms: (v: number) => v,
  s: (v: number) => v,
  vs: (v: number) => v,
  componentSizes: { buttonHeight: 48, buttonRadius: 24, inputHeight: 44 },
  blinks: {
    client: {
      requestActionTransaction: (...a: unknown[]) => mockRequestActionTransaction(...a),
      ActionClientError: mockActionClientError,
    },
    simulate: {
      simulateActionTx: (...a: unknown[]) => mockSimulateActionTx(...a),
      ActionSimulationError: mockActionSimulationError,
    },
  },
  useAccountsContext: () => [mockAccountState, {}],
}));

const mockInspectSigStatus = jest.fn();
jest.mock('../../src/blinks', () => ({
  signAndSubmitActionTransaction: (...a: unknown[]) => mockSignAndSubmit(...a),
  inspectTransactionSigStatus: (...a: unknown[]) => mockInspectSigStatus(...a),
}));

import BlinkApprovalScreen from '../../app/blink-approval';

const FAKE_B64_UNSIGNED = 'AAAA';
const FAKE_B64_PARTIAL = 'BBBB';

const okSim = {
  signerBalanceDelta: {
    lamportsBefore: 1_000_000_000n,
    lamportsAfter: 950_000_000n,
    lamportsDelta: -50_000_000n,
  },
  tokenDeltas: [],
  computeUnitsConsumed: 4200,
  logs: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetConnection.mockResolvedValue({});
  mockSignAndSubmit.mockResolvedValue({ signature: 'SIGNATURE_BASE58' });
  // Map b64 fixtures to deterministic sig status for inspection.
  mockInspectSigStatus.mockImplementation((b64: string) => ({
    partialSigned: b64 === FAKE_B64_PARTIAL,
    isVersioned: false,
  }));
});

describe('BlinkApprovalScreen', () => {
  it('shows loading state initially (Approve disabled)', async () => {
    let resolve!: (v: unknown) => void;
    mockRequestActionTransaction.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    render(<BlinkApprovalScreen />);
    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(true);

    await act(async () => {
      resolve({ transaction: FAKE_B64_UNSIGNED });
      await Promise.resolve();
    });
  });

  it('renders ActionApprovalSheet and approves successfully (unsigned)', async () => {
    mockRequestActionTransaction.mockResolvedValueOnce({
      transaction: FAKE_B64_UNSIGNED,
      message: 'donate',
    });
    mockSimulateActionTx.mockResolvedValueOnce(okSim);

    render(<BlinkApprovalScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(false),
    );

    fireEvent.press(screen.getByTestId('approval-approve'));

    await waitFor(() => expect(mockSignAndSubmit).toHaveBeenCalled());
    const args = mockSignAndSubmit.mock.calls[0][0];
    // Risk gate R8: unsigned tx → partialSigned should be false → route is
    // free to set feePayer + fresh blockhash.
    expect(args.serializedTransactionBase64).toBe(FAKE_B64_UNSIGNED);
    expect(args.partialSigned).toBe(false);
  });

  it('shows error banner when POST fails', async () => {
    mockRequestActionTransaction.mockRejectedValueOnce(
      new mockActionClientError('http_error', 'boom'),
    );
    render(<BlinkApprovalScreen />);
    await waitFor(() => {
      // The error code is mapped to its dedicated i18n key; the test mock
      // for `t` returns the key as-is.
      expect(screen.getByText('blinks.approval.error.http_error')).toBeTruthy();
    });
  });

  it('shows simulation error and gates Approve behind toggle', async () => {
    mockRequestActionTransaction.mockResolvedValueOnce({
      transaction: FAKE_B64_UNSIGNED,
    });
    mockSimulateActionTx.mockRejectedValueOnce(
      new mockActionSimulationError('simulation_failed', ['log1', 'log2']),
    );

    render(<BlinkApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('blinks.approval.simulation.failed')).toBeTruthy();
    });
    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(true);

    fireEvent(screen.getByTestId('approval-risk-toggle'), 'valueChange', true);
    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(false);
  });

  it('passes partialSigned=true when sim warning indicates partial-sig (R8)', async () => {
    mockRequestActionTransaction.mockResolvedValueOnce({
      transaction: FAKE_B64_PARTIAL,
    });
    mockSimulateActionTx.mockResolvedValueOnce({
      ...okSim,
      warning: 'transaction was partial-signed; existing signatures verified',
    });

    render(<BlinkApprovalScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(false),
    );

    fireEvent.press(screen.getByTestId('approval-approve'));

    await waitFor(() => expect(mockSignAndSubmit).toHaveBeenCalled());
    const args = mockSignAndSubmit.mock.calls[0][0];
    // Risk gate R8: helper MUST receive partialSigned=true, contract is the
    // helper does NOT mutate feePayer / recentBlockhash in that branch.
    expect(args.partialSigned).toBe(true);
  });

  it('Cancel calls router.back', async () => {
    mockRequestActionTransaction.mockResolvedValueOnce({
      transaction: FAKE_B64_UNSIGNED,
    });
    mockSimulateActionTx.mockResolvedValueOnce(okSim);

    render(<BlinkApprovalScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(false),
    );

    fireEvent.press(screen.getByTestId('approval-cancel'));
    expect(mockBack).toHaveBeenCalled();
  });
});
