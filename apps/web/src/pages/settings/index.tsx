/**
 * Settings route pages -- thin wrappers around @salmon/ui selector components.
 * Each page provides the required props and onBack navigation via react-router.
 */
import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  useAccountsContext,
  useCurrencyContext,
  useLanguage,
  useUserConfig,
  useAddressbook,
  useAvailableNetworks,
  CURRENCY_MAP, SUPPORTED_CURRENCIES,
  SUPPORT_OPTIONS,
  colors, fontFamily, fontSize, spacing,
} from '@salmon/shared';
import type {
  TrustedAppItem, LanguageSelectorItem, CurrencySelectorItem,
  ExplorerSelectorItem, AddressBookItem, AddressInput,
  NetworkSelectorItem, NetworkAdapter, BlockchainType,
} from '@salmon/shared';
import {
  CurrencySelector, LanguageSelector, ExplorerSelector,
  SupportSelector, TrustedAppsSelector, NetworkSelector,
  ScreenHeader,
  AccountsPage, AccountEditPage, AccountNamePage,
  AccountAvatarPage, AccountAddPage, SecurityPage,
  BackupPage, PrivateKeyPage, AddressBookPage,
  AddressAddPage, AddressEditPage, AboutPage,
} from '@salmon/ui';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds activeBlockchainAccount param from networkId */
function useActiveBlockchainParam() {
  const [state] = useAccountsContext();
  const { networkId } = state;
  const activeBlockchainAccount = useMemo(() => ({
    network: {
      environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
      blockchain: (networkId || 'solana-mainnet').split('-')[0],
    },
  }), [networkId]);
  return { networkId, activeBlockchainAccount, state };
}

/** Builds a NetworkAdapter for address book hooks from available networks */
function useAddressbookAdapter() {
  const { networkId, activeBlockchainAccount, state } = useActiveBlockchainParam();
  const { allNetworks } = useAvailableNetworks({ activeBlockchainAccount });
  const networkAdapter: NetworkAdapter = useMemo(() => ({
    getNetwork: async (id: string) => {
      const found = allNetworks.find((n) => n.id === id);
      if (!found) return undefined;
      return { id: found.id, name: found.name, blockchain: found.id.split('-')[0] as BlockchainType };
    },
    getNetworks: async () =>
      allNetworks.map((n) => ({ id: n.id, name: n.name, blockchain: n.id.split('-')[0] as BlockchainType })),
  }), [allNetworks]);
  return { networkId, networkAdapter, allNetworks, state };
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export function CurrencyPage(): React.ReactElement {
  const navigate = useNavigate();
  const [{ currency }, { changeCurrency }] = useCurrencyContext();

  const currencies: CurrencySelectorItem[] = useMemo(
    () => SUPPORTED_CURRENCIES.map((code) => {
      const info = CURRENCY_MAP[code];
      return { code: info.code, name: info.name, symbol: info.symbol };
    }),
    [],
  );

  return (
    <CurrencySelector
      currencies={currencies}
      activeCurrencyCode={currency}
      onSelectCurrency={(code) => { changeCurrency(code as typeof currency); }}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export function LanguagePage(): React.ReactElement {
  const navigate = useNavigate();
  const { language, availableLanguages, languageNames, changeLanguage } = useLanguage();

  const languages: LanguageSelectorItem[] = useMemo(
    () => availableLanguages.map((code) => ({
      code,
      nativeName: languageNames[code],
    })),
    [availableLanguages, languageNames],
  );

  return (
    <LanguageSelector
      languages={languages}
      activeLanguageCode={language}
      onSelectLanguage={(code) => { changeLanguage(code as typeof language); }}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Explorer
// ---------------------------------------------------------------------------

export function ExplorerPage(): React.ReactElement {
  const navigate = useNavigate();
  const { activeBlockchainAccount } = useActiveBlockchainParam();
  const { explorer, explorers, changeExplorer, isLoading } = useUserConfig({ activeBlockchainAccount });

  const explorerItems: ExplorerSelectorItem[] = useMemo(
    () => explorers.map((e) => ({ key: e.key, name: e.name })),
    [explorers],
  );

  return (
    <ExplorerSelector
      explorers={explorerItems}
      activeExplorerName={explorer?.name || ''}
      onSelectExplorer={(key) => { changeExplorer(key); }}
      onBack={() => navigate('/home')}
      loading={isLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export function SupportPage(): React.ReactElement {
  const navigate = useNavigate();

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <SupportSelector
      options={SUPPORT_OPTIONS}
      onOpenLink={handleOpenLink}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Trusted Apps
// ---------------------------------------------------------------------------

export function TrustedAppsPage(): React.ReactElement {
  const navigate = useNavigate();
  const [state, actions] = useAccountsContext();
  const { activeTrustedApps } = state;

  const trustedAppItems: TrustedAppItem[] = Object.entries(activeTrustedApps || {}).map(
    ([domain, app]) => ({ domain, name: app.name, icon: app.icon }),
  );

  const handleRevoke = useCallback(
    (domain: string) => { actions.removeTrustedApp(domain); },
    [actions],
  );

  return (
    <TrustedAppsSelector
      apps={trustedAppItems}
      onRevokeApp={handleRevoke}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

export function NetworkPage(): React.ReactElement {
  const navigate = useNavigate();
  const { networkId, activeBlockchainAccount, state } = useActiveBlockchainParam();
  const [, actions] = useAccountsContext();
  const { activeAccount } = state;
  const { allNetworks } = useAvailableNetworks({ activeBlockchainAccount });

  const userNetworks = useMemo(() => {
    if (!activeAccount?.networksAccounts) return allNetworks;
    const userNetworkIds = Object.keys(activeAccount.networksAccounts);
    return allNetworks.filter((n) => userNetworkIds.includes(n.id));
  }, [allNetworks, activeAccount]);

  const networkItems: NetworkSelectorItem[] = useMemo(
    () => userNetworks.map((n) => ({ id: n.id, name: n.name, blockchain: n.id.split('-')[0] })),
    [userNetworks],
  );

  return (
    <NetworkSelector
      networks={networkItems}
      activeNetworkId={networkId || 'solana-mainnet'}
      onSelectNetwork={(id) => { actions.changeNetwork(id); }}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function AccountsRoute(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <AccountsPage
      onBack={() => navigate('/home')}
      onEditAccount={(id) => navigate(`/settings/account/${id}`)}
      onAddAccount={() => navigate('/settings/account-add')}
    />
  );
}

// ---------------------------------------------------------------------------
// Account Edit
// ---------------------------------------------------------------------------

export function AccountEditRoute(): React.ReactElement {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return (
    <AccountEditPage
      accountId={id || ''}
      onEditName={(accountId) => navigate(`/settings/account/${accountId}/name`)}
      onEditAvatar={() => navigate(`/settings/account/${id}/avatar`)}
      onBackupSeed={() => navigate('/settings/backup')}
      onExportPrivateKey={() => navigate('/settings/private-key')}
      onBack={() => navigate('/settings/accounts')}
    />
  );
}

// ---------------------------------------------------------------------------
// Account Name
// ---------------------------------------------------------------------------

export function AccountNameRoute(): React.ReactElement {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return (
    <AccountNamePage
      accountId={id || ''}
      onBack={() => navigate(-1 as never)}
    />
  );
}

// ---------------------------------------------------------------------------
// Account Avatar
// ---------------------------------------------------------------------------

export function AccountAvatarRoute(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <AccountAvatarPage
      onBack={() => navigate(-1 as never)}
    />
  );
}

// ---------------------------------------------------------------------------
// Account Add
// ---------------------------------------------------------------------------

export function AccountAddRoute(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <AccountAddPage
      onComplete={() => navigate('/home')}
      onBack={() => navigate('/settings/accounts')}
    />
  );
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export function SecurityRoute(): React.ReactElement {
  const navigate = useNavigate();
  return <SecurityPage onBack={() => navigate('/home')} />;
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

export function BackupRoute(): React.ReactElement {
  const navigate = useNavigate();
  return <BackupPage onBack={() => navigate('/home')} />;
}

// ---------------------------------------------------------------------------
// Private Key
// ---------------------------------------------------------------------------

export function PrivateKeyRoute(): React.ReactElement {
  const navigate = useNavigate();
  return <PrivateKeyPage onBack={() => navigate('/home')} />;
}

// ---------------------------------------------------------------------------
// Address Book
// ---------------------------------------------------------------------------

export function AddressBookRoute(): React.ReactElement {
  const navigate = useNavigate();
  const { networkId, networkAdapter } = useAddressbookAdapter();
  const [{ contacts }, { removeContact }] = useAddressbook({ networkAdapter });

  const contactItems: AddressBookItem[] = useMemo(
    () => contacts.map((c) => ({
      name: c.name, address: c.address,
      networkId: c.network.id, networkName: c.network.name,
      domain: c.domain,
    })),
    [contacts],
  );

  return (
    <AddressBookPage
      contacts={contactItems}
      activeNetworkId={networkId || 'solana-mainnet'}
      onAddContact={() => navigate('/settings/address-book/add')}
      onEditContact={(contact: AddressBookItem) => navigate('/settings/address-book/edit', { state: { contact } })}
      onRemoveContact={async (address: string) => { await removeContact(address); }}
      onBack={() => navigate('/home')}
    />
  );
}

// ---------------------------------------------------------------------------
// Address Add
// ---------------------------------------------------------------------------

export function AddressAddRoute(): React.ReactElement {
  const navigate = useNavigate();
  const { networkId, networkAdapter, allNetworks } = useAddressbookAdapter();
  const [, { addContact }] = useAddressbook({ networkAdapter });

  const activeNet = useMemo(
    () => allNetworks.find((n) => n.id === networkId) || allNetworks[0],
    [allNetworks, networkId],
  );
  const blockchain = (networkId || 'solana-mainnet').split('-')[0];

  return (
    <AddressAddPage
      activeNetworkId={activeNet?.id || 'solana-mainnet'}
      activeNetworkName={activeNet?.name || 'Solana Mainnet'}
      activeBlockchain={blockchain}
      onSave={async (input: AddressInput) => {
        await addContact(input);
        navigate('/settings/address-book');
      }}
      onBack={() => navigate('/settings/address-book')}
    />
  );
}

// ---------------------------------------------------------------------------
// Address Edit
// ---------------------------------------------------------------------------

export function AddressEditRoute(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const contact = (location.state as { contact?: AddressBookItem })?.contact;
  const { networkAdapter } = useAddressbookAdapter();
  const [, { editContact }] = useAddressbook({ networkAdapter });

  if (!contact) {
    navigate('/settings/address-book', { replace: true });
    return <div />;
  }

  const blockchain = (contact.networkId || 'solana-mainnet').split('-')[0];

  return (
    <AddressEditPage
      contact={contact}
      activeBlockchain={blockchain}
      onSave={async (originalAddress: string, input: AddressInput) => {
        await editContact(originalAddress, input);
        navigate('/settings/address-book');
      }}
      onBack={() => navigate('/settings/address-book')}
    />
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export function AboutRoute(): React.ReactElement {
  const navigate = useNavigate();
  return <AboutPage onBack={() => navigate('/home')} />;
}
