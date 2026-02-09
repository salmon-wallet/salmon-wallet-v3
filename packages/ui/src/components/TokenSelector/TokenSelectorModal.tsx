import React, { useCallback } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { useTokenSearch } from '@salmon/shared';
import type { TokenSelectorToken, TokenSelectorModalProps } from './types';

const HIDDEN_VALUE = '******';

/**
 * Get a unique key for a token
 */
const getTokenKey = (token: TokenSelectorToken): string => {
  return token.mint || token.address || token.symbol || Math.random().toString();
};

/**
 * Get a short address for display
 */
const getShortAddress = (address: string | undefined): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

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
            {token.logo ? (
              <Image source={{ uri: token.logo }} style={styles.tokenIcon} />
            ) : (
              <View style={[styles.tokenIcon, styles.tokenIconPlaceholder]} />
            )}
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
          <View style={styles.chevron}>
            <TextInput style={styles.chevronIcon} value=">" editable={false} />
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
            {token.logo ? (
              <Image source={{ uri: token.logo }} style={styles.featuredTokenIcon} />
            ) : (
              <View style={[styles.featuredTokenIcon, styles.tokenIconPlaceholder]} />
            )}
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
            <ActivityIndicator size="small" color="#999" />
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
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <TextInput style={styles.backButtonText} value="<" editable={false} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.title}
              value={t('wallet.select_token', 'Select Token')}
              editable={false}
            />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('actions.search_placeholder', 'Search tokens...')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  tokenIconContainer: {
    marginRight: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenIconPlaceholder: {
    backgroundColor: '#3a3a5e',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  tokenBalance: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
    padding: 0,
  },
  networkChip: {
    backgroundColor: '#3a3a5e',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  networkChipText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
    padding: 0,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronIcon: {
    color: '#999',
    fontSize: 16,
    padding: 0,
  },
  featuredContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 8,
  },
  featuredToken: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  featuredTokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  disclaimerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  disclaimerText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    padding: 0,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  searchingText: {
    color: '#999',
    fontSize: 14,
    marginLeft: 8,
    padding: 0,
  },
  loadMoreButton: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    padding: 0,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  closeButton: {
    backgroundColor: '#4a4ae8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
});
