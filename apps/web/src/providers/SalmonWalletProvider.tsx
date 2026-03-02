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
 *
 * Follows the wallet-standard protocol (same as salmon-wallet-standard/src/register.ts):
 * 1. Dispatch 'wallet-standard:register-wallet' for apps already listening
 * 2. Listen for 'wallet-standard:app-ready' for apps that load later
 */
function registerSalmonWallet(): () => void {
  if (registered) return () => {};
  registered = true;

  const wallet = createSalmonWallet();
  const callback = ({ register }: { register: (w: unknown) => void }) => register(wallet);

  // Dispatch register-wallet event for dApps already listening
  window.dispatchEvent(
    new CustomEvent('wallet-standard:register-wallet', {
      detail: callback,
      bubbles: false,
      cancelable: false,
    }),
  );

  // Listen for app-ready events from dApps that load after the wallet
  const appReadyHandler = (event: Event) => {
    callback((event as CustomEvent).detail);
  };
  window.addEventListener('wallet-standard:app-ready', appReadyHandler);

  // Also expose on window for direct access
  (window as unknown as Record<string, unknown>).__salmonWallet = wallet;

  return () => {
    window.removeEventListener('wallet-standard:app-ready', appReadyHandler);
  };
}

/**
 * React component that registers the wallet provider on mount.
 * Include in the app tree to make Salmon discoverable.
 */
export function SalmonWalletRegistrar(): null {
  useEffect(() => {
    const cleanup = registerSalmonWallet();
    return cleanup;
  }, []);

  return null;
}
