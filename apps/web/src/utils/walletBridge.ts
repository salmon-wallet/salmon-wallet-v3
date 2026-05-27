/**
 * BroadcastChannel bridge for popup-based dApp approvals in the web wallet.
 */

import type { DAppApprovalRequest } from '@salmon/shared';

const CHANNEL_NAME = 'salmon_wallet_bridge';

export interface BridgeRequest {
  requestId: string;
  origin: string;
  request: DAppApprovalRequest;
}

export interface BridgeResponse {
  requestId: string;
  approved: boolean;
  payload?: unknown;
  error?: string;
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function sendResponse(response: BridgeResponse): void {
  getChannel().postMessage(response);
}

export function sendRequest(request: BridgeRequest): void {
  getChannel().postMessage(request);
}

export function waitForResponse(
  requestId: string,
  timeoutMs = 120_000,
): Promise<BridgeResponse> {
  return new Promise((resolve, reject) => {
    const channelRef = getChannel();
    const timer = setTimeout(() => {
      channelRef.removeEventListener('message', handler);
      reject(new Error('Wallet bridge response timeout'));
    }, timeoutMs);

    function handler(event: MessageEvent<BridgeResponse>) {
      if (event.data?.requestId === requestId) {
        clearTimeout(timer);
        channelRef.removeEventListener('message', handler);
        resolve(event.data);
      }
    }

    channelRef.addEventListener('message', handler);
  });
}

export function onRequest(callback: (request: BridgeRequest) => void): () => void {
  const channelRef = getChannel();

  function handler(event: MessageEvent<BridgeRequest>) {
    if (event.data?.requestId && event.data?.request?.method) {
      callback(event.data);
    }
  }

  channelRef.addEventListener('message', handler);
  return () => channelRef.removeEventListener('message', handler);
}

export function closeBridge(): void {
  channel?.close();
  channel = null;
}
