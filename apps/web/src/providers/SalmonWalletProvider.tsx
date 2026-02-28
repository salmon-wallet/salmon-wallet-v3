/**
 * SalmonWalletProvider — Wallet Standard registration for the web wallet.
 *
 * Registers Salmon as a discoverable wallet so dApps using
 * @solana/wallet-adapter or wallet-standard can find it.
 *
 * Communication with approval popups uses the BroadcastChannel-based
 * walletBridge utility.
 */

import { useEffect } from 'react';
import { sendRequest, waitForResponse, type BridgeRequest } from '../utils/walletBridge';

let registered = false;

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Minimal wallet-standard–compatible wallet object.
 *
 * A full implementation would use @wallet-standard/base `registerWallet()`.
 * This scaffolding sets up the request → popup → response flow.
 */
function createSalmonWallet() {
  return {
    name: 'Salmon' as const,
    icon: '/images/Logo.png' as const,
    version: '1.0.0' as const,

    async connect(origin: string): Promise<{ publicKey: string } | null> {
      const requestId = generateRequestId();
      const request: BridgeRequest = {
        type: 'connect',
        requestId,
        origin,
        payload: null,
      };

      // Open approval popup
      const popupUrl = `/dapp/connect?requestId=${requestId}&origin=${encodeURIComponent(origin)}`;
      window.open(popupUrl, 'salmon-connect', 'width=420,height=600,popup=yes');

      sendRequest(request);
      const response = await waitForResponse(requestId);

      if (!response.approved) return null;
      return response.payload as { publicKey: string };
    },

    async signMessage(origin: string, message: Uint8Array): Promise<Uint8Array | null> {
      const requestId = generateRequestId();
      const request: BridgeRequest = {
        type: 'sign-message',
        requestId,
        origin,
        payload: { message: Array.from(message) },
      };

      const popupUrl = `/dapp/sign-message?requestId=${requestId}&origin=${encodeURIComponent(origin)}`;
      window.open(popupUrl, 'salmon-sign', 'width=420,height=600,popup=yes');

      sendRequest(request);
      const response = await waitForResponse(requestId);

      if (!response.approved) return null;
      const sig = response.payload as { signature: number[] };
      return new Uint8Array(sig.signature);
    },

    async signTransaction(origin: string, transaction: Uint8Array): Promise<Uint8Array | null> {
      const requestId = generateRequestId();
      const request: BridgeRequest = {
        type: 'sign-transaction',
        requestId,
        origin,
        payload: { transaction: Array.from(transaction) },
      };

      const popupUrl = `/dapp/sign-transaction?requestId=${requestId}&origin=${encodeURIComponent(origin)}`;
      window.open(popupUrl, 'salmon-sign-tx', 'width=420,height=600,popup=yes');

      sendRequest(request);
      const response = await waitForResponse(requestId);

      if (!response.approved) return null;
      const signed = response.payload as { signedTransaction: number[] };
      return new Uint8Array(signed.signedTransaction);
    },
  };
}

/**
 * Register the Salmon wallet globally so it's discoverable
 * via wallet-standard's `getWallets()`.
 */
function registerSalmonWallet(): void {
  if (registered) return;
  registered = true;

  const wallet = createSalmonWallet();

  // Register with wallet-standard event API
  // dApps listen for 'wallet-standard:register-wallet' events
  const registerEvent = new CustomEvent('wallet-standard:app-ready', {
    detail: { register: (cb: (wallet: unknown) => void) => cb(wallet) },
  });
  window.dispatchEvent(registerEvent);

  // Also expose on window for direct access
  (window as unknown as Record<string, unknown>).__salmonWallet = wallet;
}

/**
 * React component that registers the wallet provider on mount.
 * Include in the app tree to make Salmon discoverable.
 */
export function SalmonWalletRegistrar(): null {
  useEffect(() => {
    registerSalmonWallet();
  }, []);

  return null;
}
