import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Onboarding page displayed when no wallet accounts exist.
 * Provides options to create a new wallet or recover an existing one.
 */
export function SelectOptionsPage() {
  const { t } = useTranslation();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <span style={styles.logoText}>S</span>
          </div>
        </div>

        <h1 style={styles.title}>
          {t('wallet.onboarding.title1', 'Welcome to Salmon')}
        </h1>

        <p style={styles.subtitle}>
          {t('wallet.onboarding.content1', 'The secure Solana wallet for everyone')}
        </p>

        <div style={styles.buttons}>
          <button style={styles.primaryButton}>
            {t('wallet.onboarding.create', 'Create New Wallet')}
          </button>

          <button style={styles.secondaryButton}>
            {t('wallet.onboarding.recover', 'I Already Have a Wallet')}
          </button>
        </div>
      </div>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          {t('wallet.onboarding.terms_notice', 'By continuing, you agree to our Terms of Service')}
        </p>
      </footer>
    </div>
  );
}

/**
 * Inline styles for the SelectOptionsPage component.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '320px',
    margin: '0 auto',
    width: '100%',
  },
  logoContainer: {
    marginBottom: '32px',
  },
  logo: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8E53 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#ffffff',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '12px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '15px',
    color: '#888888',
    marginBottom: '48px',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  buttons: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#FF6B4A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '1px solid #333333',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  footer: {
    paddingTop: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#666666',
  },
};

export default SelectOptionsPage;
