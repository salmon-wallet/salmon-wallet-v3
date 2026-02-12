// Polyfill Buffer globally before any Solana library loads
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize i18n configuration - must be imported before App
import i18n from '../../i18n/config';
import { I18nextProvider } from 'react-i18next';

// Initialize storage and stash for extension platform
import { initStorage, initStash, AccountsProvider } from '@salmon/shared';

// Initialize storage with Chrome extension adapter
initStorage({ platform: 'extension' });

// Initialize stash for session data (communicates with background worker)
initStash('extension');

// Open a long-lived port to the background service worker.
// When the popup closes, Chrome automatically disconnects this port,
// which signals the background to clear session secrets (password, derived key).
// This ensures the lock screen is shown every time the popup is reopened.
chrome.runtime.connect({ name: 'salmon-popup-lifecycle' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AccountsProvider>
        <App />
      </AccountsProvider>
    </I18nextProvider>
  </React.StrictMode>
);
