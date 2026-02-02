import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize i18n configuration - must be imported before App
import '../../i18n/config';

// Initialize storage and stash for extension platform
import { initStorage, initStash } from '@salmon/shared';

// Initialize storage with Chrome extension adapter
initStorage({ platform: 'extension' });

// Initialize stash for session data (communicates with background worker)
initStash('extension');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
