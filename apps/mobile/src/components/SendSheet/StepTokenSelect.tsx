import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  componentSizes,
  fontFamilyNative,
  ms,
  vs,
  s,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import { TokenLogo } from '../TokenLogo';
import type { StepTokenSelectProps, SendToken } from './types';

// ============================================================================
// Token Row Component
// ============================================================================

interface TokenRowProps {
  token: SendToken;
  onPress: (token: SendToken) => void;
}

const TokenRow: React.FC<TokenRowProps> = React.memo(({ token, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(token);
  }, [token, onPress]);

  const balanceDisplay = useMemo(() => {
    const amount = typeof token.uiAmount === 'string'
      ? parseFloat(token.uiAmount)
      : token.uiAmount;
    if (amount === 0) return `0 ${token.symbol}`;
    if (amount < 0.0001) return `<0.0001 ${token.symbol}`;
    return `${Number(amount.toFixed(4))} ${token.symbol}`;
  }, [token.uiAmount, token.symbol]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={`${token.name}, ${balanceDisplay}`}
      accessibilityRole="button"
    >
      <BlurContainer style={styles.tokenRow}>
        {/* Token Logo */}
        <View style={styles.tokenLogoContainer}>
          <TokenLogo uri={token.logo || undefined} symbol={token.symbol} size={ms(32)} />
        </View>

        {/* Token Name */}
        <Text style={styles.tokenName} numberOfLines={1}>
          {token.name}
        </Text>

        {/* Balance */}
        <Text style={styles.tokenBalance} numberOfLines={1}>
          {balanceDisplay}
        </Text>
      </BlurContainer>
    </TouchableOpacity>
  );
});

TokenRow.displayName = 'TokenRow';

// ============================================================================
// Main Component
// ============================================================================

export const StepTokenSelect: React.FC<StepTokenSelectProps> = ({
  tokens,
  onSelectToken,
  showUnverifiedTokens,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const topFadeOpacity = useMemo(() => new Animated.Value(0), []);

  // Filter out unverified tokens unless developer mode is enabled
  const verifiedTokens = useMemo(() => {
    return tokens.filter((token) => {
      const hasMeaningfulTags =
        token.tags &&
        token.tags.length > 0 &&
        token.tags.some((tag) => tag !== 'unknown');
      if (hasMeaningfulTags) return true;
      return !!showUnverifiedTokens;
    });
  }, [tokens, showUnverifiedTokens]);

  // Filter tokens by search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return verifiedTokens;
    const query = searchQuery.toLowerCase().trim();
    return verifiedTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
  }, [verifiedTokens, searchQuery]);

  // Handle scroll for top fade gradient
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const opacity = Math.min(offsetY / 30, 1);
      topFadeOpacity.setValue(opacity);
    },
    [topFadeOpacity]
  );

  const renderItem = useCallback(
    ({ item }: { item: SendToken }) => (
      <TokenRow token={item} onPress={onSelectToken} />
    ),
    [onSelectToken]
  );

  const keyExtractor = useCallback((item: SendToken) => item.address, []);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <BlurContainer style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={ms(18)}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </BlurContainer>

      {/* Section Header */}
      <Text style={styles.sectionHeader}>Select Token</Text>

      {/* Token List */}
      <View style={styles.listWrapper}>
        <FlatList
          data={filteredTokens}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        />

        {/* Top fade gradient */}
        <Animated.View
          style={[styles.topFadeGradient, { opacity: topFadeOpacity }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[colors.background.secondary, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: s(18),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(8),
    paddingHorizontal: s(14),
    height: vs(38),
    marginBottom: vs(18),
  },
  searchIcon: {
    marginRight: s(8),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(12),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  sectionHeader: {
    fontSize: ms(16),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    marginBottom: vs(12),
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingBottom: vs(30),
    gap: vs(10),
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: componentSizes.sheetFadeGradientHeight,
    zIndex: 1,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: s(12),
  },
  tokenLogoContainer: {
    marginRight: s(12),
  },
  tokenName: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fontFamilyNative.medium,
    color: '#d6d6d6',
  },
  tokenBalance: {
    fontSize: ms(14),
    fontFamily: fontFamilyNative.medium,
    color: '#d6d6d6',
    marginLeft: s(8),
  },
});

export default StepTokenSelect;
