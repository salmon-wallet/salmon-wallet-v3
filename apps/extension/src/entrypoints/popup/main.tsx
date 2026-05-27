import '../../polyfills/node';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../assets/fonts.css';

// Initialize i18n configuration - must be imported before App
import i18n from '../../i18n/config';
import { I18nextProvider } from 'react-i18next';

// Initialize storage and stash for extension platform
import { initStorage, initStash, AccountsProvider, CurrencyProvider, createQueryClient, QueryClientProvider } from '@salmon/shared';

// Initialize storage with Chrome extension adapter
initStorage({ platform: 'extension' });

// Initialize stash for session data (communicates with background worker)
initStash('extension');

function Root() {
  const [queryClient] = React.useState(() => createQueryClient());
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AccountsProvider>
            <CurrencyProvider>
              <App />
            </CurrencyProvider>
          </AccountsProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
