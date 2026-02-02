import React, { useCallback } from 'react';
import { useAccounts, useInactivityTimeout, DerivedKeyCache } from '@salmon/shared';
import { LockPage } from '../../pages/lock/LockPage';
import { HomePage } from '../../pages/home/HomePage';
import { SelectOptionsPage } from '../../pages/auth/SelectOptionsPage';
import { clearSessionKey } from '../../utils/sessionKeyCache';

/**
 * Loading spinner component shown during initialization.
 * Uses inline styles for instant rendering without CSS loading delays.
 */
function LoadingSpinner() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
    </div>
  );
}

/**
 * Main App component that handles wallet state and routing.
 *
 * State machine:
 * 1. Loading (ready = false) -> Show loading spinner
 * 2. No accounts (ready = true, accounts.length = 0) -> Show onboarding
 * 3. Locked (ready = true, locked = true) -> Show lock screen
 * 4. Unlocked (ready = true, locked = false) -> Show home
 *
 * Transitions are instant (no animations) to provide a snappy UX.
 * The unlock action shows a loading state in the button only.
 */
function App() {
  const [state, actions] = useAccounts();
  const { ready, locked, accounts } = state;

  // Set up inactivity timeout for auto-lock
  // Only enabled when wallet is unlocked and has accounts
  // Note: We don't clear the session key on auto-lock - the user can still
  // instantly unlock with the session key until the browser session ends
  useInactivityTimeout({
    timeoutMs: 5 * 60 * 1000, // 5 minutes
    onTimeout: () => {
      actions.lockAccounts();
    },
    enabled: ready && !locked && accounts.length > 0,
  });

  // Handler for removing all accounts from lock screen
  // After removal, accounts.length will be 0 and app will show onboarding
  const handleRemoveAllAccounts = useCallback(async () => {
    await clearSessionKey();
    await actions.removeAllAccounts();
  }, [actions]);

  // Handler for unlocking with a cached derived key (instant unlock)
  const handleUnlockWithCachedKey = useCallback(
    async (keyCache: DerivedKeyCache): Promise<boolean> => {
      return actions.unlockWithCachedKey(keyCache);
    },
    [actions]
  );

  // Show loading spinner during initialization
  // This is a brief moment while checking stash for existing password
  if (!ready) {
    return <LoadingSpinner />;
  }

  // No accounts - show onboarding/setup flow
  if (accounts.length === 0) {
    return <SelectOptionsPage />;
  }

  // Wallet is locked - show lock screen
  // Transition to unlocked state is instant (no fade animation)
  if (locked) {
    return (
      <LockPage
        onUnlock={actions.unlockAccounts}
        onUnlockWithCachedKey={handleUnlockWithCachedKey}
        onRemoveAllAccounts={handleRemoveAllAccounts}
      />
    );
  }

  // Wallet is unlocked - show main app
  return <HomePage />;
}

/**
 * Inline styles for instant rendering without CSS loading delays.
 */
const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255, 107, 74, 0.2)',
    borderTopColor: '#FF6B4A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// Inject keyframe animation for spinner (only once)
if (typeof document !== 'undefined' && !document.getElementById('app-spinner-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'app-spinner-styles';
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Reset default styles for instant rendering */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #0f0f0f;
      overflow: hidden;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default App;
