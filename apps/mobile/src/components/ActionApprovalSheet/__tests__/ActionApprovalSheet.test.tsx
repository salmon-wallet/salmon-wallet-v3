/**
 * Tests for ActionApprovalSheet — the pre-sign approval surface for Solana
 * Actions / Blinks. Covers risk gates R2 (simulate-then-show, refuse on
 * sim-error unless explicitly acknowledged) and R8 (partial-sig warning).
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
}));

import { ActionApprovalSheet } from '../ActionApprovalSheet';

const baseMetadata = {
  icon: 'https://dial.to/icon.png',
  title: 'Donate',
  description: 'Donate to the cause',
  host: 'dial.to',
};

const baseTransaction = {
  serializedBase64: 'AAAA',
};

const okSimulation = {
  signerBalanceDelta: {
    lamportsBefore: 1_000_000_000n,
    lamportsAfter: 950_000_000n,
    lamportsDelta: -50_000_000n,
  },
  tokenDeltas: [],
  computeUnitsConsumed: 4200,
  logs: [],
};

describe('ActionApprovalSheet', () => {
  it('renders metadata block with icon, title, host, description', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={okSimulation}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText('Donate')).toBeTruthy();
    expect(screen.getByText('Donate to the cause')).toBeTruthy();
    expect(screen.getByText('dial.to')).toBeTruthy();
    expect(screen.getByTestId('action-icon').props.source.uri).toBe(
      'https://dial.to/icon.png',
    );
  });

  it('renders SOL delta with sign for fee payer', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={okSimulation}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    // -0.05 SOL
    expect(screen.getByTestId('sol-delta').props.children).toContain('-0.05');
  });

  it('renders token delta lines and shows unknown-amount warning when decimals null', () => {
    const sim = {
      ...okSimulation,
      tokenDeltas: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          owner: 'OwnerPubKey1111111111111111111111111111111',
          uiAmountBefore: '10',
          uiAmountAfter: '5',
          rawAmountDelta: -5n,
          decimals: 9,
        },
        {
          mint: 'UnknownMint11111111111111111111111111111111',
          owner: 'OwnerPubKey1111111111111111111111111111111',
          uiAmountBefore: null,
          uiAmountAfter: null,
          rawAmountDelta: 100n,
          decimals: null,
        },
      ],
    };
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={sim}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByTestId('token-delta-0')).toBeTruthy();
    expect(screen.getByTestId('token-delta-1')).toBeTruthy();
    expect(screen.getByText('blinks.approval.simulation.unknown_amount')).toBeTruthy();
  });

  it('renders ALT/partial-signed warning when simulation.warning includes partial-sign text', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={{
          ...okSimulation,
          warning: 'transaction was partial-signed; existing signatures verified',
        }}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('blinks.approval.partial_signed')).toBeTruthy();
  });

  it('disables Approve when simulation errored, enables after toggle', () => {
    const onApprove = jest.fn();
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulationError={{ code: 'simulation_failed', message: 'oops' }}
        onApprove={onApprove}
        onCancel={jest.fn()}
      />,
    );

    const approve = screen.getByTestId('approval-approve');
    expect(approve.props.accessibilityState?.disabled).toBe(true);

    const toggle = screen.getByTestId('approval-risk-toggle');
    fireEvent(toggle, 'valueChange', true);

    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(false);
  });

  it('does NOT show risk toggle when simulation succeeded', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={okSimulation}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('approval-risk-toggle')).toBeNull();
  });

  it('shows simulation error banner with code', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulationError={{ code: 'simulation_failed', message: 'oops' }}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('blinks.approval.simulation.failed')).toBeTruthy();
  });

  it('Approve calls onApprove and Cancel calls onCancel', () => {
    const onApprove = jest.fn();
    const onCancel = jest.fn();
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        transaction={baseTransaction}
        simulation={okSimulation}
        onApprove={onApprove}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByTestId('approval-approve'));
    expect(onApprove).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('approval-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables Approve when no transaction available', () => {
    render(
      <ActionApprovalSheet
        loading={false}
        metadata={baseMetadata}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(true);
  });

  it('disables Approve while loading', () => {
    render(
      <ActionApprovalSheet
        loading={true}
        metadata={baseMetadata}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByTestId('approval-approve').props.accessibilityState?.disabled).toBe(true);
  });
});
