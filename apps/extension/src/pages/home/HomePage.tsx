import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '@salmon/shared';

/**
 * Home page component displayed when wallet is unlocked.
 * Shows account info and provides access to main wallet features.
 */
export function HomePage() {
  const { t } = useTranslation();
  const [state, actions] = useAccounts();
  const { activeAccount, activeBlockchainAccount, networkId } = state;

  const handleLock = async () => {
    await actions.lockAccounts();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.networkBadge}>
          {networkId || 'mainnet-beta'}
        </div>
        <button
          onClick={handleLock}
          style={styles.lockButton}
          title={t('actions.lock', 'Lock')}
        >
          <LockIcon />
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.accountInfo}>
          <div style={styles.avatar}>
            {activeAccount?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <h2 style={styles.accountName}>
            {activeAccount?.name || t('home.unnamed_account', 'Account')}
          </h2>
          <p style={styles.address}>
            {activeBlockchainAccount
              ? truncateAddress(activeBlockchainAccount.getReceiveAddress())
              : '---'}
          </p>
        </div>

        <div style={styles.balanceSection}>
          <p style={styles.balanceLabel}>{t('home.total_balance', 'Total Balance')}</p>
          <h1 style={styles.balanceAmount}>$0.00</h1>
        </div>

        <div style={styles.actions}>
          <button style={styles.actionButton}>
            <span style={styles.actionIcon}>+</span>
            <span>{t('actions.receive', 'Receive')}</span>
          </button>
          <button style={styles.actionButton}>
            <span style={styles.actionIcon}>&uarr;</span>
            <span>{t('actions.send', 'Send')}</span>
          </button>
          <button style={styles.actionButton}>
            <span style={styles.actionIcon}>&#x21C4;</span>
            <span>{t('actions.swap', 'Swap')}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

/**
 * Truncates a blockchain address for display.
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Lock icon component.
 */
function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * Inline styles for the HomePage component.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #1a1a1a',
  },
  networkBadge: {
    fontSize: '12px',
    padding: '6px 12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '20px',
    color: '#888888',
    textTransform: 'capitalize' as const,
  },
  lockButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'transparent',
    border: '1px solid #333333',
    borderRadius: '8px',
    color: '#888888',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8E53 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  accountName: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  address: {
    fontSize: '13px',
    color: '#888888',
    fontFamily: 'monospace',
  },
  balanceSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  balanceLabel: {
    fontSize: '13px',
    color: '#888888',
    marginBottom: '8px',
  },
  balanceAmount: {
    fontSize: '40px',
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 24px',
    backgroundColor: '#1a1a1a',
    border: 'none',
    borderRadius: '16px',
    color: '#ffffff',
    cursor: 'pointer',
    minWidth: '80px',
  },
  actionIcon: {
    fontSize: '20px',
    fontWeight: 600,
  },
};

export default HomePage;
