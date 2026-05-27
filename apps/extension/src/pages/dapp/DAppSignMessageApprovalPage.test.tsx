/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockUseDAppMetadata = vi.fn();
const mockDecodeDAppMessage = vi.fn();

vi.mock('@salmon/shared', () => ({
  useDAppMetadata: (origin: string) => mockUseDAppMetadata(origin),
  decodeDAppMessage: (data: number[]) => mockDecodeDAppMessage(data),
  approveSolanaSignMessage: vi.fn(),
}));

vi.mock('@salmon/shared/utils/account', () => ({
  isSolanaAccount: () => true,
}));

vi.mock('@salmon/ui', () => ({
  DAppSignMessageApprovalView: (props: Record<string, unknown>) => (
    <div
      data-testid="sign-message-view"
      data-app-name={String(props.appName ?? '')}
      data-app-icon={String(props.appIcon ?? '')}
      data-message={String(props.messageText ?? '')}
      data-disabled={String(props.disabled ?? '')}
    />
  ),
}));

import { DAppSignMessageApprovalPage } from './DAppSignMessageApprovalPage';
import type { DAppSignMessageRequest } from '@salmon/shared';

const messageBytes = [72, 101, 108, 108, 111];
const baseRequest: DAppSignMessageRequest = {
  id: 'req-msg-1',
  method: 'signMessage',
  params: { data: messageBytes },
} as unknown as DAppSignMessageRequest;

const fakeAccount = { kind: 'solana' } as unknown as Parameters<typeof DAppSignMessageApprovalPage>[0]['account'];

const baseProps = {
  origin: 'https://dapp.example',
  request: baseRequest,
  account: fakeAccount,
  onDismiss: vi.fn(),
};

describe('DAppSignMessageApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecodeDAppMessage.mockReturnValue({ text: 'Hello' });
  });

  it('renders sign-message view with metadata and decoded message', () => {
    mockUseDAppMetadata.mockReturnValue({
      metadata: { name: 'Signer dApp', icon: 'https://dapp.example/icon.png' },
    });

    const { getByTestId } = render(<DAppSignMessageApprovalPage {...baseProps} />);

    const view = getByTestId('sign-message-view');
    expect(view.dataset.appName).toBe('Signer dApp');
    expect(view.dataset.appIcon).toBe('https://dapp.example/icon.png');
    expect(view.dataset.message).toBe('Hello');
    expect(view.dataset.disabled).toBe('false');
    expect(mockDecodeDAppMessage).toHaveBeenCalledWith(messageBytes);
  });

  it('renders without throwing when metadata is null', () => {
    mockUseDAppMetadata.mockReturnValue({ metadata: null });

    const { getByTestId } = render(<DAppSignMessageApprovalPage {...baseProps} />);

    const view = getByTestId('sign-message-view');
    expect(view.dataset.appName).toBe('');
    expect(view.dataset.appIcon).toBe('');
  });

  it('disables the view when message data is missing', () => {
    mockUseDAppMetadata.mockReturnValue({ metadata: null });
    const requestWithoutData = {
      ...baseRequest,
      params: {},
    } as unknown as DAppSignMessageRequest;

    const { getByTestId } = render(
      <DAppSignMessageApprovalPage {...baseProps} request={requestWithoutData} />,
    );

    expect(getByTestId('sign-message-view').dataset.disabled).toBe('true');
    expect(mockDecodeDAppMessage).not.toHaveBeenCalled();
  });
});
