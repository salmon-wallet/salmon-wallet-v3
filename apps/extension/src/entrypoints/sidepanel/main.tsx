// Polyfill Buffer globally before any Solana library loads
import { Buffer } from 'buffer';
(globalThis as Record<string, unknown>).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';

// Initialize i18n configuration - must be imported before App
import i18n from '../../i18n/config';
import { I18nextProvider } from 'react-i18next';

// Initialize storage and stash for extension platform
import { initStorage, initStash, AccountsProvider, CurrencyProvider } from '@salmon/shared';

initStorage({ platform: 'extension' });
initStash('extension');

// Wait for the viewport to have dimensions before importing App.
// The side panel may not be sized yet at script execution time, and
// styled components evaluate scaling functions (s, vs, ms) at definition
// time — so we need real window dimensions before those modules load.
const waitForLayout = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.innerWidth > 0 && window.innerHeight > 0) {
      resolve();
      return;
    }
    const check = () => {
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  });

(async () => {
  await waitForLayout();

  // Dynamic import so styled components see real viewport dimensions
  const { default: App } = await import('../popup/App');

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <AccountsProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </AccountsProvider>
      </I18nextProvider>
    </React.StrictMode>
  );
})();
