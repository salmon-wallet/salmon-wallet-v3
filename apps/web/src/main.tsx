// Buffer polyfill — must be first
import { Buffer } from 'buffer';
(globalThis as Record<string, unknown>).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';

// i18n — before App
import i18n from './i18n/config';
import { I18nextProvider } from 'react-i18next';

// Storage and stash
import { initStorage, initStash, AccountsProvider, CurrencyProvider } from '@salmon/shared';

// App
import { App } from './App';
import { SalmonWalletRegistrar } from './providers/SalmonWalletProvider';

initStorage({ platform: 'web' });
initStash('web');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AccountsProvider>
        <CurrencyProvider>
          <SalmonWalletRegistrar />
          <App />
        </CurrencyProvider>
      </AccountsProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
