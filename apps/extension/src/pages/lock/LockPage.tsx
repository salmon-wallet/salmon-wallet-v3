import React, { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface LockPageProps {
  onUnlock: (password: string) => Promise<boolean>;
  onRemoveAllAccounts: () => Promise<void>;
}

/**
 * Lock page component displayed when the wallet is locked.
 * Provides password input for unlocking the wallet.
 *
 * The design prioritizes instant feedback:
 * - No animations on mount
 * - Immediate loading state when submitting
 * - Clear error feedback
 */
export function LockPage({ onUnlock, onRemoveAllAccounts }: LockPageProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError(t('lock.error.empty_password', 'Please enter your password'));
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const success = await onUnlock(password);
      if (!success) {
        setError(t('lock.error.invalid_password', 'Invalid password'));
        setPassword('');
      }
      // If success, the parent component will handle the transition
    } catch {
      setError(t('lock.error.unlock_failed', 'Failed to unlock wallet'));
    } finally {
      setIsUnlocking(false);
    }
  }, [password, onUnlock, t]);

  const handleForgotPassword = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    setShowResetDialog(false);
    setShowConfirmDialog(true);
  }, []);

  const handleFinalConfirm = useCallback(async () => {
    try {
      await onRemoveAllAccounts();
      setShowConfirmDialog(false);
      // Navigation will be handled by the parent component
    } catch (err) {
      console.error('Failed to reset wallet:', err);
      setError(t('lock.error.reset_failed', 'Failed to reset wallet. Please try again.'));
      setShowConfirmDialog(false);
    }
  }, [onRemoveAllAccounts, t]);

  const handleCancelReset = useCallback(() => {
    setShowResetDialog(false);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Logo/Icon placeholder */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <span style={styles.logoText}>S</span>
          </div>
        </div>

        <h1 style={styles.title}>
          {t('lock.title', 'Welcome Back')}
        </h1>

        <p style={styles.subtitle}>
          {t('lock.subtitle', 'Enter your password to unlock your wallet')}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder={t('lock.password_placeholder', 'Password')}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {}),
              }}
              disabled={isUnlocking}
              autoFocus
            />
            {error && (
              <p style={styles.errorText}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUnlocking || !password.trim()}
            style={{
              ...styles.button,
              ...(isUnlocking || !password.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {isUnlocking ? (
              <span style={styles.spinner} />
            ) : (
              t('lock.unlock', 'Unlock')
            )}
          </button>

          {/* Forgot Password Link */}
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isUnlocking}
            style={styles.forgotPasswordButton}
          >
            {t('lock.forgot_password', 'I forgot my password')}
          </button>
        </form>
      </div>

      {/* Reset Wallet Dialog */}
      {showResetDialog && (
        <div style={styles.modalOverlay} onClick={handleCancelReset}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {t('lock.reset_wallet.title', 'Reset Wallet')}
            </h2>
            <p style={styles.modalMessage}>
              {t('lock.reset_wallet.message', 'If you forgot your password, you will need to reset your wallet. This will permanently delete all accounts and data. You can restore your wallet using your seed phrase after resetting.')}
            </p>
            <div style={styles.modalButtons}>
              <button
                onClick={handleCancelReset}
                style={styles.modalButtonSecondary}
              >
                {t('lock.reset_wallet.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleConfirmReset}
                style={styles.modalButtonDestructive}
              >
                {t('lock.reset_wallet.reset', 'Reset Wallet')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      {showConfirmDialog && (
        <div style={styles.modalOverlay} onClick={handleCancelConfirm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {t('lock.confirm_reset.title', 'Are you sure?')}
            </h2>
            <p style={styles.modalMessage}>
              {t('lock.confirm_reset.message', 'This action cannot be undone. All wallet data will be permanently deleted.')}
            </p>
            <div style={styles.modalButtons}>
              <button
                onClick={handleCancelConfirm}
                style={styles.modalButtonSecondary}
              >
                {t('lock.confirm_reset.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleFinalConfirm}
                style={styles.modalButtonDestructive}
              >
                {t('lock.confirm_reset.confirm', 'Delete All Data')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline styles for the LockPage component.
 * Using inline styles to avoid any CSS loading delays
 * and ensure instant rendering.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: '32px',
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8E53 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#ffffff',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '14px',
    color: '#888888',
    marginBottom: '32px',
    textAlign: 'center' as const,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s ease',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: '12px',
    marginTop: '8px',
    marginLeft: '4px',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#FF6B4A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50px',
    transition: 'opacity 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  forgotPasswordButton: {
    marginTop: '16px',
    padding: '8px',
    background: 'none',
    border: 'none',
    color: '#888888',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid #333333',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  modalMessage: {
    fontSize: '14px',
    color: '#cccccc',
    lineHeight: '1.6',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  modalButtonDestructive: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#ff4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
};

// Inject keyframe animation for spinner and button hover effects
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Forgot password button hover effect */
    button[style*="color: rgb(136, 136, 136)"]:hover:not(:disabled) {
      color: #ffffff !important;
    }

    /* Modal button hover effects */
    button[style*="background-color: rgb(51, 51, 51)"]:hover {
      background-color: #444444 !important;
    }

    button[style*="background-color: rgb(255, 68, 68)"]:hover {
      background-color: #ff5555 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default LockPage;
