import React from 'react';
import { View, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import TokenListItem from './TokenListItem';
import TokenListSkeleton from './TokenListSkeleton';
import type { Token, TokenListProps } from './types';

/**
 * Key extractor for FlatList
 */
const keyExtractor = (item: Token): string => item.address;

/**
 * TokenList component for displaying a list of cryptocurrency tokens
 *
 * Displays token information including logo, name, balance, USD value,
 * and 24-hour price change. Shows a skeleton loader while data is loading.
 *
 * @example
 * ```tsx
 * const tokens = [
 *   {
 *     address: 'So11111111111111111111111111111111111111112',
 *     name: 'Solana',
 *     symbol: 'SOL',
 *     logo: 'https://...',
 *     uiAmount: '10.5',
 *     usdBalance: 1050.00,
 *     last24HoursChange: { perc: 5.2 }
 *   },
 *   // ... more tokens
 * ];
 *
 * <TokenList
 *   tokens={tokens}
 *   loading={false}
 *   onTokenPress={(token) => navigation.navigate('TokenDetail', { token })}
 *   hiddenBalance={false}
 * />
 * ```
 */
const TokenList: React.FC<TokenListProps> = ({
  tokens,
  loading = false,
  onTokenPress,
  hiddenBalance = false,
}) => {
  // Render item callback - memoized for performance
  // Must be defined before any conditional returns to comply with Rules of Hooks
  const renderItem: ListRenderItem<Token> = React.useCallback(
    ({ item }) => (
      <TokenListItem
        token={item}
        onPress={onTokenPress}
        hiddenBalance={hiddenBalance}
      />
    ),
    [onTokenPress, hiddenBalance]
  );

  // Show skeleton while loading
  if (loading) {
    return <TokenListSkeleton count={5} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tokens}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
});

export default TokenList;
