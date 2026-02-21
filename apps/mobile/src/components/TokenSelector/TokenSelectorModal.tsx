import React, { useCallback } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { useTokenSearch, colors, spacing, borderRadius, ContentLoader, Rect, Circle, getShortAddress, getTokenKey } from '@salmon/shared';
import { TokenLogo } from '../TokenLogo';
import type { TokenSelectorToken, TokenSelectorModalProps } from './types';

const HIDDEN_VALUE = '******';

/**
 * Modal component for selecting tokens
 */
export function TokenSelectorModal({
  visible,
  onClose,
  tokens,
  featuredTokens,
  onSelect,
  onSearch,
  hiddenBalance = false,
  showNetworkChip = false,
  showVerifiedDisclaimer = false,
  loading = false,
}: TokenSelectorModalProps): React.ReactElement {
  const { t } = useTranslation();

  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    paginatedTokens,
    hasMore,
    loadMore,
    reset,
  } = useTokenSearch(tokens, onSearch);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSelect = useCallback(
    (token: TokenSelectorToken) => {
      onSelect(token);
      reset();
    },
    [onSelect, reset]
  );

  const renderTokenItem: ListRenderItem<TokenSelectorToken> = useCallback(
    ({ item: token }) => {
      const tokenName = token.name || getShortAddress(token.mint || token.address);
      const balanceText = token.uiAmount
        ? `${hiddenBalance ? HIDDEN_VALUE : token.uiAmount} ${token.symbol || ''}`
        : token.symbol || '';

      return (
        <TouchableOpacity
          style={styles.tokenItem}
          onPress={() => handleSelect(token)}
          activeOpacity={0.7}
        >
          <View style={styles.tokenIconContainer}>
            <TokenLogo uri={token.logo || undefined} symbol={token.symbol} size={40} />
          </View>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenNameRow}>
              <View style={styles.tokenNameContainer}>
                <TextInput
                  style={styles.tokenName}
                  value={tokenName}
                  editable={false}
                />
              </View>
              {showNetworkChip && token.network && (
                <View style={styles.networkChip}>
                  <TextInput
                    style={styles.networkChipText}
                    value={token.network.toUpperCase()}
                    editable={false}
                  />
                </View>
              )}
            </View>
            <TextInput
              style={styles.tokenBalance}
              value={balanceText}
              editable={false}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelect, hiddenBalance, showNetworkChip]
  );

  const renderFeaturedTokens = useCallback(() => {
    if (!featuredTokens || featuredTokens.length === 0 || searchQuery.length >= 3) {
      return null;
    }

    return (
      <View style={styles.featuredContainer}>
        {featuredTokens.map((token) => (
          <TouchableOpacity
            key={getTokenKey(token)}
            style={styles.featuredToken}
            onPress={() => handleSelect(token)}
            activeOpacity={0.7}
          >
            <TokenLogo uri={token.logo || undefined} symbol={token.symbol} size={48} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [featuredTokens, searchQuery, handleSelect]);

  const renderHeader = useCallback(() => {
    return (
      <View>
        {showVerifiedDisclaimer && searchQuery.length < 3 && (
          <View style={styles.disclaimerContainer}>
            <TextInput
              style={styles.disclaimerText}
              value={t('swap.showing_verified_tokens', 'Showing verified tokens only')}
              editable={false}
              multiline
            />
          </View>
        )}
        {isSearching && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color={colors.text.secondary} />
            <TextInput
              style={styles.searchingText}
              value={t('actions.searching', 'Searching...')}
              editable={false}
            />
          </View>
        )}
        {renderFeaturedTokens()}
      </View>
    );
  }, [showVerifiedDisclaimer, searchQuery, isSearching, t, renderFeaturedTokens]);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
        <TextInput
          style={styles.loadMoreText}
          value={t('actions.view_more', 'View More')}
          editable={false}
        />
      </TouchableOpacity>
    );
  }, [hasMore, loadMore, t]);

  const renderEmpty = useCallback(() => {
    if (isSearching) return null;

    return (
      <View style={styles.emptyContainer}>
        <TextInput
          style={styles.emptyText}
          value={t('wallet.no_tokens_found', 'No tokens found')}
          editable={false}
        />
      </View>
    );
  }, [isSearching, t]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TextInput
            style={styles.title}
            value={t('wallet.select_token', 'Select Token')}
            editable={false}
          />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('actions.search_placeholder', 'Search tokens...')}
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 5 }, (_, i) => (
              <View key={i} style={styles.tokenItem}>
                <ContentLoader
                  speed={1.5}
                  width={320}
                  height={40}
                  viewBox="0 0 320 40"
                  backgroundColor={colors.skeleton.base}
                  foregroundColor={colors.skeleton.highlight}
                >
                  <Circle cx="20" cy="20" r="20" />
                  <Rect x="52" y="4" rx="4" ry="4" width="100" height="14" />
                  <Rect x="52" y="24" rx="4" ry="4" width="140" height="12" />
                </ContentLoader>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={paginatedTokens}
            keyExtractor={getTokenKey}
            renderItem={renderTokenItem}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <TextInput
              style={styles.closeButtonText}
              value={t('actions.close', 'Close')}
              editable={false}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tokenIconContainer: {
    marginRight: spacing.md,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenNameContainer: {
    flex: 1,
  },
  tokenName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  tokenBalance: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 2,
    padding: 0,
  },
  networkChip: {
    backgroundColor: colors.border.default,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  networkChipText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    padding: 0,
  },
  featuredContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  featuredToken: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  disclaimerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  disclaimerText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    padding: 0,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  searchingText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginLeft: spacing.sm,
    padding: 0,
  },
  loadMoreButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loadMoreText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    padding: 0,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
  },
  closeButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
});
