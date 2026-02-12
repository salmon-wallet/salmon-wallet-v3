import React, { useCallback, useState } from 'react';
import { useAccountsContext, useInactivityTimeout, DerivedKeyCache } from '@salmon/shared';
import { LockPage } from '../../pages/lock/LockPage';
import { HomePage } from '../../pages/home/HomePage';
import { SelectOptionsPage } from '../../pages/auth/SelectOptionsPage';
import { CreateWalletPage } from '../../pages/auth/CreateWalletPage';
import { RecoverWalletPage } from '../../pages/auth/RecoverWalletPage';
import { PasswordPage } from '../../pages/auth/PasswordPage';
import { SuccessPage } from '../../pages/auth/SuccessPage';
import { DerivedAccountsPage } from '../../pages/auth/DerivedAccountsPage';
import { clearSessionKey } from '../../utils/sessionKeyCache';

// ============================================================================
// Types
// ============================================================================

type AuthStep = 'select' | 'create' | 'recover' | 'password' | 'success' | 'derived';

interface AuthData {
  mnemonic: string;
  flowType: 'create' | 'recover';
}

// ============================================================================
// Loading Spinner
// ============================================================================

function LoadingSpinner() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
    </div>
  );
}

// ============================================================================
// Main App
// ============================================================================

/**
 * Main App component that handles wallet state and routing.
 *
 * State machine:
 * 1. Loading (ready = false) -> Show loading spinner
 * 2. Locked (ready = true, locked = true) -> Show lock screen
 * 3. No accounts (ready = true, accounts.length = 0) -> Show auth flow
 * 4. Auth flow in progress (justCreated = true) -> Show auth flow
 * 5. Unlocked (ready = true, locked = false) -> Show home
 */
function App() {
  const [state, actions] = useAccountsContext();
  const { ready, locked, accounts } = state;

  // Auth flow state
  const [authStep, setAuthStep] = useState<AuthStep>('select');
  const [authData, setAuthData] = useState<AuthData | null>(null);

  // Prevents premature transition to HomePage after account creation
  // (accounts.length becomes > 0 but we're still in the auth flow)
  const [justCreated, setJustCreated] = useState(false);

  // Set up inactivity timeout for auto-lock
  useInactivityTimeout({
    timeoutMs: 5 * 60 * 1000,
    onTimeout: () => {
      actions.lockAccounts();
    },
    enabled: ready && !locked && accounts.length > 0 && !justCreated,
  });

  // Handler for removing all accounts from lock screen
  const handleRemoveAllAccounts = useCallback(async () => {
    await clearSessionKey();
    await actions.removeAllAccounts();
    setAuthStep('select');
    setAuthData(null);
  }, [actions]);

  // Handler for unlocking with a cached derived key
  const handleUnlockWithCachedKey = useCallback(
    async (keyCache: DerivedKeyCache): Promise<boolean> => {
      return actions.unlockWithCachedKey(keyCache);
    },
    [actions]
  );

  // ---- Auth flow handlers ----

  const handleCreateWallet = useCallback(() => {
    setAuthStep('create');
  }, []);

  const handleRecoverWallet = useCallback(() => {
    setAuthStep('recover');
  }, []);

  const handleAuthBack = useCallback(() => {
    setAuthStep('select');
    setAuthData(null);
  }, []);

  const handleCreateComplete = useCallback((mnemonic: string) => {
    setAuthData({ mnemonic, flowType: 'create' });
    setAuthStep('password');
  }, []);

  const handleRecoverComplete = useCallback((mnemonic: string) => {
    setAuthData({ mnemonic, flowType: 'recover' });
    setAuthStep('password');
  }, []);

  const handleCreating = useCallback(() => {
    setJustCreated(true);
  }, []);

  const handlePasswordSuccess = useCallback(() => {
    setAuthStep('success');
  }, []);

  const handlePasswordBack = useCallback(() => {
    if (authData?.flowType === 'create') {
      setAuthStep('create');
    } else {
      setAuthStep('recover');
    }
  }, [authData]);

  const handleGoToWallet = useCallback(() => {
    setJustCreated(false);
    setAuthStep('select');
    setAuthData(null);
  }, []);

  const handleCheckDerived = useCallback(() => {
    setAuthStep('derived');
  }, []);

  const handleDerivedComplete = useCallback(() => {
    setJustCreated(false);
    setAuthStep('select');
    setAuthData(null);
  }, []);

  const handleDerivedBack = useCallback(() => {
    setAuthStep('success');
  }, []);

  // ---- Rendering ----

  if (!ready) {
    return <LoadingSpinner />;
  }

  // Wallet is locked — show lock screen even if account metadata failed to load.
  // This must be checked BEFORE accounts.length === 0 to prevent showing onboarding
  // when encrypted mnemonics exist but account metadata is missing from storage.
  if (locked) {
    return (
      <LockPage
        onUnlock={actions.unlockAccounts}
        onUnlockWithCachedKey={handleUnlockWithCachedKey}
        onRemoveAllAccounts={handleRemoveAllAccounts}
      />
    );
  }

  // Show auth flow when no accounts exist or when we just created one
  if (accounts.length === 0 || justCreated) {
    switch (authStep) {
      case 'create':
        return (
          <CreateWalletPage
            onComplete={handleCreateComplete}
            onBack={handleAuthBack}
          />
        );
      case 'recover':
        return (
          <RecoverWalletPage
            onComplete={handleRecoverComplete}
            onBack={handleAuthBack}
          />
        );
      case 'password':
        if (!authData) return <SelectOptionsPage onCreateWallet={handleCreateWallet} onRecoverWallet={handleRecoverWallet} />;
        return (
          <PasswordPage
            mnemonic={authData.mnemonic}
            flowType={authData.flowType}
            onCreating={handleCreating}
            onSuccess={handlePasswordSuccess}
            onBack={handlePasswordBack}
          />
        );
      case 'success':
        return (
          <SuccessPage
            onGoToWallet={handleGoToWallet}
            onCheckDerived={handleCheckDerived}
          />
        );
      case 'derived':
        return (
          <DerivedAccountsPage
            onComplete={handleDerivedComplete}
            onBack={handleDerivedBack}
          />
        );
      default:
        return (
          <SelectOptionsPage
            onCreateWallet={handleCreateWallet}
            onRecoverWallet={handleRecoverWallet}
          />
        );
    }
  }

  // Wallet is unlocked
  return <HomePage />;
}

// ============================================================================
// Styles
// ============================================================================

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
  `;
  document.head.appendChild(styleSheet);
}

export default App;
