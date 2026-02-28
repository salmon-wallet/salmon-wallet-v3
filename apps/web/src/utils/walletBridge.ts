/**
 * walletBridge — BroadcastChannel wrapper for cross-window dApp communication.
 *
 * The main wallet tab registers as a wallet provider (wallet-standard).
 * When a dApp in another tab requests connect/sign, the wallet opens an
 * approval popup.  This bridge enables the popup ↔ wallet tab communication.
 */

const CHANNEL_NAME = 'salmon_wallet_bridge';

export interface BridgeRequest {
  type: 'connect' | 'sign-message' | 'sign-transaction';
  requestId: string;
  origin: string;
  payload: unknown;
}

export interface BridgeResponse {
  requestId: string;
  approved: boolean;
  payload?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// Send / Receive helpers
// ---------------------------------------------------------------------------

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/** Post a response back to the requesting tab. */
export function sendResponse(response: BridgeResponse): void {
  getChannel().postMessage(response);
}

/** Post a request from the wallet provider to an approval popup. */
export function sendRequest(request: BridgeRequest): void {
  getChannel().postMessage(request);
}

/**
 * Wait for a response matching the given requestId.
 * Resolves with the response or rejects after timeoutMs.
 */
export function waitForResponse(
  requestId: string,
  timeoutMs = 120_000,
): Promise<BridgeResponse> {
  return new Promise((resolve, reject) => {
    const ch = getChannel();
    const timer = setTimeout(() => {
      ch.removeEventListener('message', handler);
      reject(new Error('Wallet bridge response timeout'));
    }, timeoutMs);

    function handler(event: MessageEvent<BridgeResponse>) {
      if (event.data?.requestId === requestId) {
        clearTimeout(timer);
        ch.removeEventListener('message', handler);
        resolve(event.data);
      }
    }

    ch.addEventListener('message', handler);
  });
}

/**
 * Listen for incoming requests (used by the approval popup).
 * Returns an unsubscribe function.
 */
export function onRequest(
  callback: (request: BridgeRequest) => void,
): () => void {
  const ch = getChannel();
  function handler(event: MessageEvent<BridgeRequest>) {
    if (event.data?.type && event.data?.requestId) {
      callback(event.data);
    }
  }
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}

/** Clean up the BroadcastChannel. */
export function closeBridge(): void {
  channel?.close();
  channel = null;
}
