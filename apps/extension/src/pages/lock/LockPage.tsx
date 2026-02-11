import React, { useState, useCallback, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PrimaryButton,
  SecondaryButton,
  LockIcon,
  LoadingScreen,
} from '../../components';
import {
  colors,
  gradients,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  componentSizes,
  contentPadding,
  DerivedKeyCache,
  getStashItem,
  STASH_KEYS,
} from '@salmon/shared';
import { getSessionKey, storeSessionKey, clearSessionKey } from '../../utils/sessionKeyCache';


interface LockPageProps {
  onUnlock: (password: string) => Promise<boolean>;
  onUnlockWithCachedKey: (keyCache: DerivedKeyCache) => Promise<boolean>;
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
export function LockPage({ onUnlock, onUnlockWithCachedKey, onRemoveAllAccounts }: LockPageProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [isCheckingSessionKey, setIsCheckingSessionKey] = useState(true);
  const sessionKeyCheckRef = useRef(false);

  // Check for valid session key on mount for instant unlock
  useEffect(() => {
    // Prevent double execution in React strict mode
    if (sessionKeyCheckRef.current) return;
    sessionKeyCheckRef.current = true;

    const checkSessionKey = async () => {
      try {
        const sessionKey = await getSessionKey();
        if (sessionKey) {
          // Try instant unlock with cached session key
          const success = await onUnlockWithCachedKey(sessionKey);
          if (success) {
            // Session key worked, unlock succeeded
            return;
          }
          // Session key was invalid or expired, clear it
          await clearSessionKey();
        }
      } catch (error) {
        console.warn('Failed to check session key:', error);
      } finally {
        setIsCheckingSessionKey(false);
      }
    };

    checkSessionKey();
  }, [onUnlockWithCachedKey]);

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

    setShowLoadingScreen(true);  // Show loading screen immediately
    setIsUnlocking(true);
    setError(null);

    try {
      const success = await onUnlock(password);
      if (!success) {
        setError(t('lock.error.invalid_password', 'Invalid password'));
        setPassword('');
        setShowLoadingScreen(false);  // Hide on error
      } else {
        // On success, retrieve the derived key from stash and store in session
        // This enables instant unlock for subsequent opens during this browser session
        try {
          const derivedKey = await getStashItem<DerivedKeyCache>(STASH_KEYS.DERIVED_KEY);
          if (derivedKey) {
            await storeSessionKey(derivedKey);
          }
        } catch (cacheError) {
          // Session key caching is optional - don't fail unlock if it fails
          console.warn('Failed to cache session key:', cacheError);
        }
      }
      // Don't hide on success - page will navigate away
    } catch {
      setError(t('lock.error.unlock_failed', 'Failed to unlock wallet'));
      setShowLoadingScreen(false);  // Hide on error
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

  // Show nothing while checking session key - instant unlock will navigate away
  // This prevents a flash of the lock screen when session key is valid
  if (isCheckingSessionKey) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <LockIcon sx={{ fontSize: 32, color: colors.text.primary }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Logo with Lock Icon */}
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <LockIcon sx={{ fontSize: 32, color: colors.text.primary }} />
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

            <PrimaryButton
              type="submit"
              disabled={!password.trim()}
              loading={isUnlocking}
              fullWidth
            >
              {t('lock.unlock', 'Unlock')}
            </PrimaryButton>

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
                <SecondaryButton
                  onClick={handleCancelReset}
                  variant="outline"
                  fullWidth
                >
                  {t('lock.reset_wallet.cancel', 'Cancel')}
                </SecondaryButton>
                <button
                  onClick={handleConfirmReset}
                  style={styles.destructiveButton}
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
                <SecondaryButton
                  onClick={handleCancelConfirm}
                  variant="outline"
                  fullWidth
                >
                  {t('lock.confirm_reset.cancel', 'Cancel')}
                </SecondaryButton>
                <button
                  onClick={handleFinalConfirm}
                  style={styles.destructiveButton}
                >
                  {t('lock.confirm_reset.confirm', 'Delete All Data')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Screen during unlock */}
      <LoadingScreen
        visible={showLoadingScreen}
        title="Unlocking Wallet"
        showTips={true}
        tipInterval={3000}
      />
    </>
  );
}

/**
 * Styles for the LockPage component.
 * Uses design tokens from @salmon/shared for consistency.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: `${contentPadding.screen}px`,
    background: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
    color: colors.text.primary,
    fontFamily: `${fontFamily.sans}, sans-serif`,
  },
  content: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: `${spacing['3xl']}px`,
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: gradients.primaryCSS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    marginBottom: `${spacing.sm}px`,
    textAlign: 'center' as const,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: `${spacing['3xl']}px`,
    textAlign: 'center' as const,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: `${spacing.lg}px`,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: fontSize.md,
    backgroundColor: colors.input.background,
    border: `1px solid ${colors.input.border}`,
    borderRadius: `${componentSizes.inputRadius}px`,
    color: colors.text.primary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s ease',
    fontFamily: `${fontFamily.sans}, sans-serif`,
  },
  inputError: {
    borderColor: colors.input.borderError,
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontSize.xs,
    marginTop: `${spacing.sm}px`,
    marginLeft: `${spacing.xs}px`,
  },
  forgotPasswordButton: {
    marginTop: `${spacing.lg}px`,
    padding: `${spacing.sm}px`,
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    width: '100%',
    fontFamily: `${fontFamily.sans}, sans-serif`,
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dialog.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: `${contentPadding.screen}px`,
  },
  modalContent: {
    backgroundColor: colors.dialog.background,
    borderRadius: `${borderRadius.xl}px`,
    padding: `${contentPadding.modal}px`,
    maxWidth: '400px',
    width: '100%',
    border: `1px solid ${colors.dialog.border}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: `${spacing.lg}px`,
    textAlign: 'center' as const,
    fontFamily: `${fontFamily.sans}, sans-serif`,
  },
  modalMessage: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    lineHeight: '1.6',
    marginBottom: `${spacing['2xl']}px`,
    textAlign: 'center' as const,
    fontFamily: `${fontFamily.sans}, sans-serif`,
  },
  modalButtons: {
    display: 'flex',
    gap: `${spacing.md}px`,
    justifyContent: 'center',
  },
  destructiveButton: {
    flex: 1,
    padding: '12px 20px',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    backgroundColor: colors.status.error,
    color: colors.text.primary,
    border: 'none',
    borderRadius: `${componentSizes.buttonRadius}px`,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    fontFamily: `${fontFamily.sans}, sans-serif`,
    height: `${componentSizes.buttonHeight}px`,
  },
};

// Inject hover effects for interactive elements
if (typeof document !== 'undefined') {
  const styleId = 'lock-page-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      /* Input focus effect */
      input:focus {
        border-color: ${colors.input.borderFocus} !important;
      }

      /* Forgot password button hover effect */
      button[style*="background: none"]:hover:not(:disabled) {
        color: ${colors.text.primary} !important;
      }

      /* Destructive button hover effect */
      button[style*="background-color: ${colors.status.error}"]:hover {
        opacity: 0.9;
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default LockPage;
