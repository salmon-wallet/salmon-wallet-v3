import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  useAccountsContext,
  useAvailableNetworks,
  useBalance,
  useRefreshOnFocus,
  useUserConfig,
  useCurrencyContext,
  colors,
  spacing,
  fontFamily,
  getBlockchainFromNetworkId,
  BLOCKCHAIN_TO_COINGECKO,
  PERIOD_TO_DAYS,
  getMarketChart,
  getCoinInfo,
  coinInfoToMarketData,
  type BlockchainBalance,
  type BlockchainId,
  type NetworkId,
  type PriceChartPeriod,
  type PriceDataPoint,
  type CoinInfo,
  type MarketData,
  type Token,
  type NftData,
  type SettingsScreen,
} from '@salmon/shared';
import {
  WalletHeader,
  BalanceCardCarousel,
  ActionButtonRow,
  TokenList,
  TokenListItem,
  TokenListSkeleton,
  PriceChart,
  TokenMarketData,
  TokenAbout,
  ScalesBackground,
  ReceiveSheet,
  SettingsSheet,
  WalletSwitcherSheet,
  ConfirmDialog,
} from '@salmon/ui';

import { CollectiblesTab } from './CollectiblesTab';
import { SwapTab } from './SwapTab';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTab = 'home' | 'collectibles' | 'swap';

// Network ID → BlockchainId mapping for carousel theming
const NETWORK_TO_BLOCKCHAIN: Record<string, BlockchainId> = {
  'solana-mainnet': 'solana',
  'solana-devnet': 'solana-devnet',
  'bitcoin-mainnet': 'bitcoin',
  'bitcoin-testnet': 'bitcoin-testnet',
  'ethereum-mainnet': 'ethereum',
  'ethereum-sepolia': 'ethereum-sepolia',
};

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.background.primary,
});

const Main = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
});

const BottomFadeGradient = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 180,
  background: `linear-gradient(to bottom, transparent 0%, ${colors.background.primary} 60%)`,
  pointerEvents: 'none',
  zIndex: 1,
});

const TabContent = styled(Box)({
  position: 'relative',
  zIndex: 2,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

const TokenSectionWrapper = styled(Box)({
  flex: 1,
  minHeight: 0,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

const TokenSection = styled(Box)({
  flex: 1,
  minHeight: 0,
  padding: `0 ${spacing.lg}px ${spacing.lg}px`,
  overflowY: 'auto',
});

const BottomListFade = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 30,
  background: `linear-gradient(to top, ${colors.background.primary}, transparent)`,
  pointerEvents: 'none',
  zIndex: 3,
  opacity: 0,
  transition: 'opacity 0.15s ease',
});

const TopListFade = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 30,
  background: `linear-gradient(to bottom, ${colors.background.primary}, transparent)`,
  pointerEvents: 'none',
  zIndex: 3,
  opacity: 0,
  transition: 'opacity 0.15s ease',
});

const EmptyState = styled(Box)({
  padding: `${spacing.xl}px ${spacing.lg}px`,
  textAlign: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
});

const EmptyStateText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
  marginBottom: spacing.sm,
});

const EmptyStateSubtext = styled(Typography)({
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.4)',
});

const TabBar = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  borderBottom: `1px solid ${colors.border.default}`,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const TabButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  flex: 1,
  padding: `${spacing.md}px 0`,
  background: 'none',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.accent.primary}` : '2px solid transparent',
  color: active ? colors.text.primary : colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: active ? 600 : 400,
  fontSize: 14,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: colors.text.primary,
  },
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomePage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, actions] = useAccountsContext();
  const [{ currency }] = useCurrencyContext();
  const {
    ready,
    activeAccount,
    activeBlockchainAccount,
    networkId,
    accounts,
    accountId,
    switchingNetwork,
  } = state;

  // User configuration
  const userConfig = useUserConfig({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: networkId?.split('-')[0] || 'solana',
      },
    },
  });
  const { developerNetworks, toggleDeveloperNetworks } = userConfig;

  // Available networks
  const { allNetworks: availableNetworks, networksReady } = useAvailableNetworks({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: 'solana',
      },
    },
    developerNetworks,
  });

  // Tab & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeBlockchainIndex, setActiveBlockchainIndex] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [walletSwitcherVisible, setWalletSwitcherVisible] = useState(false);
  const [receiveSheetVisible, setReceiveSheetVisible] = useState(false);
  const [removeWalletDialogVisible, setRemoveWalletDialogVisible] = useState(false);
  const [removeAllWalletsDialogVisible, setRemoveAllWalletsDialogVisible] = useState(false);

  // Bitcoin chart state
  const [bitcoinChartData, setBitcoinChartData] = useState<PriceDataPoint[]>([]);
  const [bitcoinCoinInfo, setBitcoinCoinInfo] = useState<CoinInfo | null>(null);
  const [bitcoinChartPeriod, setBitcoinChartPeriod] = useState<PriceChartPeriod>('1M');
  const [bitcoinDataLoading, setBitcoinDataLoading] = useState(false);

  // Filter networks to only those the user has accounts for
  const allNetworks = useMemo(() => {
    if (!activeAccount?.networksAccounts) return availableNetworks;
    const userNetworkIds = Object.keys(activeAccount.networksAccounts);
    return availableNetworks.filter((network) => userNetworkIds.includes(network.id));
  }, [availableNetworks, activeAccount]);

  // Reset carousel index if network list shrinks
  useEffect(() => {
    if (activeBlockchainIndex >= allNetworks.length && allNetworks.length > 0) {
      setActiveBlockchainIndex(0);
      actions.changeNetwork(allNetworks[0].id);
    }
  }, [allNetworks, activeBlockchainIndex, actions]);

  // Sync carousel index with persisted networkId on mount / network change
  useEffect(() => {
    if (!networkId || allNetworks.length === 0) return;
    const idx = allNetworks.findIndex((n) => n.id === networkId);
    if (idx >= 0 && idx !== activeBlockchainIndex) {
      setActiveBlockchainIndex(idx);
    }
  }, [networkId, allNetworks]);

  // Balance
  const {
    tokens,
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    refreshing,
    refresh,
    lastUpdated,
    hiddenBalance,
    toggleHidden,
  } = useBalance({
    account: activeBlockchainAccount,
    networkId: networkId as NetworkId | undefined,
    skip: !ready || !activeBlockchainAccount || !networksReady,
  });

  useRefreshOnFocus({ onFocus: refresh, lastUpdated, enabled: !!activeBlockchainAccount });

  // Clear switching network flag once loaded
  useEffect(() => {
    if (!loading && switchingNetwork) {
      actions.clearSwitchingNetwork();
    }
  }, [loading, switchingNetwork, actions]);

  // Build blockchain balances for carousel
  const blockchainBalances: BlockchainBalance[] = useMemo(() => {
    return allNetworks.map((network) => {
      const blockchain = NETWORK_TO_BLOCKCHAIN[network.id] || 'solana';
      const isActiveNetwork = network.id === networkId;

      if (isActiveNetwork) {
        const showSkeleton = switchingNetwork || refreshing;
        return {
          network: { id: network.id, name: network.name, blockchain },
          usdTotal: showSkeleton ? undefined : usdTotal,
          changePercent: showSkeleton ? undefined : changePercent,
          changeAmount: showSkeleton ? undefined : changeAmount,
          loading: showSkeleton || (loading && usdTotal === undefined),
        };
      }
      return {
        network: { id: network.id, name: network.name, blockchain },
        usdTotal: undefined,
        changePercent: undefined,
        changeAmount: undefined,
        loading: false,
      };
    });
  }, [allNetworks, networkId, switchingNetwork, refreshing, usdTotal, changePercent, changeAmount, loading]);

  const handleBlockchainChange = useCallback((_blockchain: BlockchainId, index: number) => {
    setActiveBlockchainIndex(index);
    const selectedBalance = blockchainBalances[index];
    if (selectedBalance) {
      actions.changeNetwork(selectedBalance.network.id);
    }
  }, [blockchainBalances, actions]);

  const currentBlockchain = useMemo(() => {
    const active = blockchainBalances[activeBlockchainIndex];
    return active?.network.blockchain || 'solana';
  }, [activeBlockchainIndex, blockchainBalances]);

  // Format tokens for TokenList
  const formattedTokens = useMemo(() => {
    return tokens
      .filter((token) => {
        if (!currentBlockchain.startsWith('solana')) return true;
        const hasMeaningfulTags = token.tags && token.tags.length > 0 && token.tags.some((tag) => tag !== 'unknown');
        if (hasMeaningfulTags) return true;
        return !!developerNetworks;
      })
      .map((token) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logo: token.logo ?? undefined,
        price: token.price,
        uiAmount: token.uiAmount,
        usdBalance: token.usdBalance,
        last24HoursChange: token.priceChange24h !== undefined ? { perc: token.priceChange24h } : undefined,
        tags: token.tags,
        coingeckoId: token.coingeckoId,
        decimals: token.decimals,
      }));
  }, [tokens, developerNetworks, currentBlockchain]);

  // Bitcoin chart data
  useEffect(() => {
    if (currentBlockchain !== 'bitcoin') return;
    setBitcoinDataLoading(true);
    const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
    const days = PERIOD_TO_DAYS[bitcoinChartPeriod];
    getMarketChart(coinId, days, currency)
      .then((res) => {
        if (res?.prices) {
          setBitcoinChartData(res.prices.map(([ts, price]: [number, number]) => ({ timestamp: ts, price })));
        }
      })
      .catch((e) => console.error('Failed to load Bitcoin chart data:', e))
      .finally(() => setBitcoinDataLoading(false));
  }, [currentBlockchain, bitcoinChartPeriod, currency]);

  useEffect(() => {
    if (currentBlockchain !== 'bitcoin' || bitcoinCoinInfo) return;
    const coinId = BLOCKCHAIN_TO_COINGECKO[currentBlockchain];
    getCoinInfo(coinId, currency)
      .then((info) => { if (info) setBitcoinCoinInfo(info); })
      .catch((e) => console.error('Failed to load Bitcoin coin info:', e));
  }, [currentBlockchain, bitcoinCoinInfo, currency]);

  const bitcoinMarketData: MarketData | undefined = useMemo(() => {
    if (!bitcoinCoinInfo) return undefined;
    return coinInfoToMarketData(bitcoinCoinInfo);
  }, [bitcoinCoinInfo]);

  const bitcoinToken: Token | undefined = useMemo(() => {
    if (!bitcoinCoinInfo?.marketData) return undefined;
    const md = bitcoinCoinInfo.marketData;
    return {
      address: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
      price: md.currentPrice,
      uiAmount: 0,
      usdBalance: 0,
      last24HoursChange: md.priceChangePercentage24h ? { perc: md.priceChangePercentage24h, abs: md.priceChange24h } : null,
      isVerified: true,
    };
  }, [bitcoinCoinInfo]);

  // Scroll-driven fade refs
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);

  const handleTokenListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollHeight - scrollTop - clientHeight < 2;
    if (topFadeRef.current) topFadeRef.current.style.opacity = String(Math.min(scrollTop / 30, 1));
    if (bottomFadeRef.current) bottomFadeRef.current.style.opacity = atBottom ? '0' : '1';
  }, []);

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------

  const accountAddress = activeBlockchainAccount?.getReceiveAddress() || '';
  const accountName = activeAccount?.name || t('home.unnamed_account', 'Account');

  const handleCopyAddress = useCallback(() => {
    if (accountAddress) navigator.clipboard.writeText(accountAddress);
  }, [accountAddress]);

  const handleTokenPress = useCallback((token: Token) => {
    navigate(`/token/${token.address}`);
  }, [navigate]);

  const handleSendPress = useCallback(() => navigate('/send'), [navigate]);
  const handleReceivePress = useCallback(() => setReceiveSheetVisible(true), []);
  const handleActivityPress = useCallback(() => navigate('/activity'), [navigate]);

  // Settings sheet → router navigation
  const handleSettingsNavigate = useCallback((screen: SettingsScreen) => {
    setSettingsVisible(false);
    const pageMap: Partial<Record<SettingsScreen, string>> = {
      accounts: '/settings/accounts',
      security: '/settings/security',
      backup: '/settings/backup',
      language: '/settings/language',
      currency: '/settings/currency',
      explorer: '/settings/explorer',
      addressBook: '/settings/address-book',
      trustedApps: '/settings/trusted-apps',
      about: '/settings/about',
      support: '/settings/support',
      privateKey: '/settings/private-key',
    };
    const targetPath = pageMap[screen];
    if (targetPath) navigate(targetPath);
  }, [navigate]);

  // Wallet switcher
  const handleSelectAccount = useCallback((targetAccountId: string) => {
    actions.changeAccount(targetAccountId);
    setWalletSwitcherVisible(false);
  }, [actions]);

  const handleAddAccount = useCallback(() => {
    setWalletSwitcherVisible(false);
    navigate('/auth/create');
  }, [navigate]);

  const handleDeleteAccount = useCallback(async (targetAccountId: string) => {
    await actions.removeAccount(targetAccountId);
    setWalletSwitcherVisible(false);
  }, [actions]);

  // Remove wallet dialogs
  const validatePassword = useCallback(
    async (password: string): Promise<boolean> => actions.checkPassword(password),
    [actions],
  );

  const confirmRemoveWallet = useCallback(async () => {
    if (activeAccount?.id) await actions.removeAccount(activeAccount.id);
  }, [actions, activeAccount]);

  const confirmRemoveAllWallets = useCallback(async () => {
    await actions.removeAllAccounts();
  }, [actions]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Container>
      {/* Header */}
      <WalletHeader
        accountName={accountName}
        address={accountAddress}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={() => setSettingsVisible(true)}
        onRefreshPress={refresh}
        refreshing={refreshing}
        onWalletPress={() => setWalletSwitcherVisible(true)}
        avatarUrl={activeAccount?.avatar}
        accountId={activeAccount?.id}
      />

      {/* Tab Bar */}
      <TabBar>
        <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
          {t('tabs.home', 'Home')}
        </TabButton>
        <TabButton active={activeTab === 'collectibles'} onClick={() => setActiveTab('collectibles')}>
          {t('tabs.collectibles', 'Collectibles')}
        </TabButton>
        <TabButton active={activeTab === 'swap'} onClick={() => setActiveTab('swap')}>
          {t('tabs.swap', 'Swap')}
        </TabButton>
      </TabBar>

      <Main>
        <ScalesBackground style={{ zIndex: 0 }} />
        <BottomFadeGradient />

        <TabContent>
          {activeTab === 'home' && (
            <>
              <BalanceCardCarousel
                blockchains={blockchainBalances}
                hiddenBalance={hiddenBalance}
                onToggleVisibility={toggleHidden}
                onBlockchainChange={handleBlockchainChange}
                activeIndex={activeBlockchainIndex}
                showNetworkLabel={developerNetworks}
              />

              <ActionButtonRow
                onSendPress={handleSendPress}
                onReceivePress={handleReceivePress}
                onActivityPress={handleActivityPress}
                style={{ marginTop: 24, marginBottom: 24 }}
              />

              <TokenSectionWrapper>
                <TopListFade ref={topFadeRef} />
                {currentBlockchain === 'bitcoin' ? (
                  <TokenSection onScroll={handleTokenListScroll}>
                    {(switchingNetwork || refreshing) ? (
                      <TokenListSkeleton count={1} />
                    ) : bitcoinToken && (
                      <TokenListItem
                        token={bitcoinToken}
                        onPress={handleTokenPress}
                        hiddenBalance={hiddenBalance}
                        blockchain="bitcoin"
                      />
                    )}
                    <PriceChart
                      data={bitcoinChartData}
                      selectedPeriod={bitcoinChartPeriod}
                      onPeriodChange={setBitcoinChartPeriod}
                      loading={bitcoinDataLoading && bitcoinChartData.length === 0}
                      height={180}
                      style={{ marginTop: spacing.md, marginLeft: -spacing.lg, marginRight: -spacing.lg }}
                    />
                    <TokenMarketData
                      data={bitcoinMarketData}
                      symbol="BTC"
                      loading={bitcoinDataLoading && !bitcoinCoinInfo}
                      style={{ marginTop: spacing.md }}
                    />
                    <TokenAbout
                      description={bitcoinCoinInfo?.description}
                      loading={bitcoinDataLoading && !bitcoinCoinInfo}
                      maxLines={4}
                      style={{ marginTop: spacing.md }}
                    />
                  </TokenSection>
                ) : (
                  <TokenSection onScroll={handleTokenListScroll}>
                    {formattedTokens.length > 0 || loading || switchingNetwork || refreshing ? (
                      <TokenList
                        tokens={(switchingNetwork || refreshing) ? [] : formattedTokens}
                        loading={(switchingNetwork || refreshing) || (loading && formattedTokens.length === 0)}
                        onTokenPress={handleTokenPress}
                        hiddenBalance={hiddenBalance}
                        blockchain={getBlockchainFromNetworkId(currentBlockchain)}
                      />
                    ) : (
                      <EmptyState>
                        <EmptyStateText>{t('home.no_tokens', 'No tokens found')}</EmptyStateText>
                        <EmptyStateSubtext>{t('home.no_tokens_hint', 'Your tokens will appear here once you receive some')}</EmptyStateSubtext>
                      </EmptyState>
                    )}
                  </TokenSection>
                )}
                <BottomListFade ref={bottomFadeRef} />
              </TokenSectionWrapper>
            </>
          )}

          {activeTab === 'collectibles' && (
            <CollectiblesTab
              activeAccount={activeAccount}
              developerNetworks={developerNetworks}
              onNftDetailPress={(nft: NftData) => navigate(`/nft/${nft.mint}`, { state: nft })}
              onSeeAllPress={(data) => navigate('/nft/all', { state: data })}
            />
          )}

          {activeTab === 'swap' && (
            <SwapTab onNavigateHome={() => { setActiveTab('home'); refresh(); }} />
          )}
        </TabContent>
      </Main>

      {/* Overlays */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onNavigate={handleSettingsNavigate}
        developerNetworksEnabled={developerNetworks}
        onDeveloperNetworksToggle={toggleDeveloperNetworks}
        onRemoveWallet={() => { setSettingsVisible(false); setRemoveWalletDialogVisible(true); }}
        onRemoveAllWallets={() => { setSettingsVisible(false); setRemoveAllWalletsDialogVisible(true); }}
      />

      <WalletSwitcherSheet
        visible={walletSwitcherVisible}
        onClose={() => setWalletSwitcherVisible(false)}
        accounts={accounts}
        activeAccountId={accountId || ''}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
        onEditAccount={(_id) => { setWalletSwitcherVisible(false); navigate(`/settings/accounts`); }}
        onDeleteAccount={handleDeleteAccount}
      />

      <ConfirmDialog
        visible={removeWalletDialogVisible}
        onClose={() => setRemoveWalletDialogVisible(false)}
        title={t('settings.remove_wallet', 'Remove Wallet')}
        message={t('settings.remove_wallet_description', 'Are you sure you want to remove this wallet? Make sure you have backed up your recovery phrase before removing.')}
        confirmText={t('actions.remove', 'Remove')}
        isDanger
        requirePassword
        validatePassword={validatePassword}
        onConfirm={confirmRemoveWallet}
      />

      <ConfirmDialog
        visible={removeAllWalletsDialogVisible}
        onClose={() => setRemoveAllWalletsDialogVisible(false)}
        title={t('settings.remove_all_wallets', 'Remove All Wallets')}
        message={t('settings.remove_all_wallets_description', 'This will remove ALL wallets from this device. This action cannot be undone. Make sure you have backed up all recovery phrases.')}
        confirmText={t('actions.remove_all', 'Remove All')}
        isDanger
        onConfirm={confirmRemoveAllWallets}
      />

      <ReceiveSheet
        visible={receiveSheetVisible}
        onClose={() => setReceiveSheetVisible(false)}
        address={accountAddress}
      />
    </Container>
  );
}
